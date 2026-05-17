/**
 * User Controller Integration Tests
 * Tests: proof submission, reward claiming, segment retrieval
 * Mocks MidnightGateway to avoid needing a running Midnight node
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { GenericContainer } from 'testcontainers';
import { AppModule } from '../../../app.module';
import { v4 as uuidv4 } from 'uuid';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let postgresContainer: GenericContainer;
  let databaseUrl: string;
  let authToken: string;

  const TEST_CAMPAIGN_ID = 'camp_test_001';
  const TEST_NULLIFIER = '0x' + '0'.repeat(64);

  beforeAll(async () => {
    // Start ephemeral Postgres container
    postgresContainer = new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'testdb',
      })
      .withExposedPorts(5432);

    const startedContainer = await postgresContainer.start();
    const port = startedContainer.getMappedPort(5432);
    databaseUrl = `postgresql://test:test@127.0.0.1:${port}/testdb`;

    process.env.DATABASE_URL = databaseUrl;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('MidnightGateway')
      .useValue({
        proveSegmentMatch: jest.fn().mockResolvedValue({ success: true }),
        claimReward: jest.fn().mockResolvedValue({ success: true, amount: '5' }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();

    prisma = new PrismaClient({ datasourceUrl: databaseUrl });

    // Create test advertiser and campaign
    await prisma.advertiser.create({
      data: {
        id: 'adv_user_test',
        role: 'ADVERTISER',
        status: 'ACTIVE',
        displayName: 'User Test Advertiser',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.campaign.create({
      data: {
        id: TEST_CAMPAIGN_ID,
        advertiserId: 'adv_user_test',
        segmentId: 'seg_test',
        creativeId: 'creat_test',
        segmentCentroid: JSON.stringify(new Array(128).fill(0)),
        similarityThreshold: 0.75,
        targetCategories: JSON.stringify(['tech']),
        title: 'Test Campaign',
        description: 'Test',
        imageUrl: 'https://example.com',
        clickUrl: 'https://example.com',
        advertiserName: 'Test',
        budgetMidnight: '1000',
        cpmBidMidnight: '10',
        startTime: new Date(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        midnightTxHash: '0x' + 'a'.repeat(64),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Login and get auth token (in real test, would set JWT token)
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'testpass',
      });

    authToken = loginResponse.body.token || 'mock_jwt_token';
  });

  afterAll(async () => {
    if (app) await app.close();
    if (prisma) await prisma.$disconnect();
    if (postgresContainer) await postgresContainer.stop();
  });

  describe('POST /user/proof/match', () => {
    it('should accept valid proof and return escrow info', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/user/proof/match')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          proofBytes: 'proof_' + uuidv4(),
          publicInputs: {
            segmentId: 'seg_test',
            campaignId: TEST_CAMPAIGN_ID,
            isMatch: true,
            nullifier: TEST_NULLIFIER,
          },
          generatedAt: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('rewardEscrow');
      expect(response.body.rewardEscrow).toHaveProperty('amount');
    });

    it('should be idempotent on same nullifier', async () => {
      const proof1 = await request(app.getHttpServer())
        .post('/api/v1/user/proof/match')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          proofBytes: 'proof_' + uuidv4(),
          publicInputs: {
            segmentId: 'seg_test',
            campaignId: TEST_CAMPAIGN_ID,
            isMatch: true,
            nullifier: TEST_NULLIFIER,
          },
          generatedAt: new Date().toISOString(),
        });

      const proof2 = await request(app.getHttpServer())
        .post('/api/v1/user/proof/match')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          proofBytes: 'proof_' + uuidv4(),
          publicInputs: {
            segmentId: 'seg_test',
            campaignId: TEST_CAMPAIGN_ID,
            isMatch: true,
            nullifier: TEST_NULLIFIER,
          },
          generatedAt: new Date().toISOString(),
        });

      expect(proof1.status).toBe(200);
      expect(proof2.status).toBe(200);
      // Should return the same escrow on replay
      expect(JSON.stringify(proof1.body.rewardEscrow)).toBe(
        JSON.stringify(proof2.body.rewardEscrow)
      );
    });

    it('should return 400 on missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/user/proof/match')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          proofBytes: 'proof_test',
          // Missing publicInputs
        })
        .expect(400);
    });
  });

  describe('POST /user/rewards/claim', () => {
    it('should claim reward and return status CLAIMED', async () => {
      // First escrow a reward
      await prisma.rewardClaim.create({
        data: {
          nullifier: '0x' + '2'.repeat(64),
          campaignId: TEST_CAMPAIGN_ID,
          amountMidnight: '5',
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/user/rewards/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nullifier: '0x' + '2'.repeat(64),
          zkProof: 'proof_' + uuidv4(),
        })
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('CLAIMED');
    });

    it('should handle duplicate claim gracefully', async () => {
      const nullifier = '0x' + '3'.repeat(64);

      // Create claimed reward
      await prisma.rewardClaim.create({
        data: {
          nullifier,
          campaignId: TEST_CAMPAIGN_ID,
          amountMidnight: '5',
          status: 'CLAIMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Try to claim again
      const response = await request(app.getHttpServer())
        .post('/api/v1/user/rewards/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nullifier,
          zkProof: 'proof_' + uuidv4(),
        });

      // Should either return 409 or indicate already claimed
      expect([200, 409]).toContain(response.status);
    });

    it('should rate-limit after 2 attempts in 1s', async () => {
      // Send 2 claim requests quickly
      for (let i = 0; i < 2; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/user/rewards/claim')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            nullifier: '0x' + 'f'.repeat(64),
            zkProof: 'proof_' + uuidv4(),
          });
      }

      // 3rd request should be rate-limited
      const response = await request(app.getHttpServer())
        .post('/api/v1/user/rewards/claim')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nullifier: '0x' + 'e'.repeat(64),
          zkProof: 'proof_' + uuidv4(),
        });

      expect(response.status).toBe(429);
    });
  });

  describe('GET /user/segments/available', () => {
    it('should return active segments as array', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/segments/available')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should contain test campaign
      const hasTestCampaign = response.body.some(
        (s: Record<string, unknown>) => s.campaignId === TEST_CAMPAIGN_ID
      );
      expect(hasTestCampaign).toBe(true);
    });
  });

  describe('GET /user/rewards/pending', () => {
    it('should return pending rewards without user PII', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/user/rewards/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Each reward should have: nullifier, amount, campaignId, escrowedAt (no PII)
      response.body.forEach((reward: Record<string, unknown>) => {
        expect(reward).toHaveProperty('nullifier');
        expect(reward).toHaveProperty('amount');
        expect(reward).toHaveProperty('campaignId');
        // Should NOT have user ID or email
        expect(reward).not.toHaveProperty('userId');
        expect(reward).not.toHaveProperty('email');
      });
    });
  });
});
