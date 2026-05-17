/**
 * Auth Controller Integration Tests
 * Uses Jest + Supertest + testcontainers-node for ephemeral Postgres
 * Mocks MidnightGateway at NestJS module boundary
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { GenericContainer } from 'testcontainers';
import { AppModule } from '../../../app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let postgresContainer: GenericContainer;
  let databaseUrl: string;

  const DEMO_USER_EMAIL = 'test@example.com';
  const DEMO_PASSWORD = 'testpass123';

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

    // Set environment for Prisma
    process.env.DATABASE_URL = databaseUrl;

    // Create test NestJS application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('MidnightGateway')
      .useValue({
        // Mock gateway - no Midnight node needed for auth tests
        registerSegment: jest.fn(),
        proveSegmentMatch: jest.fn(),
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

    // Setup Prisma and run migrations
    prisma = new PrismaClient({ datasourceUrl: databaseUrl });
    // In real setup: await runPrismaMigrations();

    // Create test user
    await prisma.advertiser.create({
      data: {
        id: 'adv_test_001',
        role: 'ADVERTISER',
        status: 'ACTIVE',
        displayName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Note: In real implementation, this would have hashed password
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
    if (postgresContainer) {
      await postgresContainer.stop();
    }
  });

  describe('POST /auth/login', () => {
    it('should return 200 with session cookie on valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: DEMO_USER_EMAIL,
          password: DEMO_PASSWORD,
        })
        .expect(200);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.body).toHaveProperty('sub');
      expect(response.body).toHaveProperty('role');
      expect(response.body.role).toBe('advertiser');
    });

    it('should return 401 on invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: DEMO_USER_EMAIL,
          password: 'wrong_password',
        })
        .expect(401);
    });

    it('should include token in response body when X-Client: mobile header present', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Client', 'mobile')
        .send({
          email: DEMO_USER_EMAIL,
          password: DEMO_PASSWORD,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    it('should return 400 on missing email field', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          password: DEMO_PASSWORD,
        })
        .expect(400);
    });

    it('should rate-limit after 5 attempts in 60s', async () => {
      const endpoint = request(app.getHttpServer()).post('/api/v1/auth/login');

      // Send 5 successful requests
      for (let i = 0; i < 5; i++) {
        await endpoint.send({
          email: DEMO_USER_EMAIL,
          password: DEMO_PASSWORD,
        });
      }

      // 6th request should be rate-limited
      const response = await endpoint.send({
        email: DEMO_USER_EMAIL,
        password: DEMO_PASSWORD,
      });

      expect(response.status).toBe(429); // Too Many Requests
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear auth cookie and return success', async () => {
      // First login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: DEMO_USER_EMAIL,
          password: DEMO_PASSWORD,
        });

      const cookies = loginResponse.headers['set-cookie'];

      // Then logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(logoutResponse.body).toEqual({ cleared: true });
      // Should have Set-Cookie header with expired date
      expect(logoutResponse.headers['set-cookie']).toBeDefined();
    });
  });
});
