/**
 * Idempotent seed script for AdMidnight demo
 * Creates: demo advertiser, demo campaign, demo proof, demo reward
 * Safe to run multiple times - skips existing records
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Deterministic values for demo
const DEMO_ADVERTISER = {
  id: 'adv_demo_001',
  email: 'demo@admidnight.io',
  displayName: 'Demo Advertiser',
  role: 'ADVERTISER',
  status: 'ACTIVE',
};

const DEMO_CAMPAIGN = {
  id: 'camp_demo_001',
  title: 'Demo Campaign Alpha',
  description: 'A sample campaign for testing the full flow',
  segmentCentroid: JSON.stringify(new Array(128).fill(0)),
  similarityThreshold: 0.75,
  targetCategories: JSON.stringify(['tech', 'finance']),
  imageUrl: 'https://example.com/demo.jpg',
  clickUrl: 'https://example.com/click',
  budgetMidnight: '1000',
  cpmBidMidnight: '10',
  startTime: new Date('2026-05-17T00:00:00Z'),
  endTime: new Date('2026-05-24T23:59:59Z'),
  status: 'ACTIVE',
};

const DEMO_PROOF_NULLIFIER = '0x' + '0'.repeat(64);
const DEMO_REWARD_NULLIFIER = '0x' + '1'.repeat(64);

interface SeedResult {
  entity: string;
  id: string;
  status: 'created' | 'already_existed';
  details: string;
}

async function main(): Promise<void> {
  const results: SeedResult[] = [];

  try {
    console.log('[seed] Starting database seeding...\n');

    // 1. Create or find advertiser
    let advertiser = await prisma.advertiser.findUnique({
      where: { id: DEMO_ADVERTISER.id },
    });

    if (advertiser) {
      results.push({
        entity: 'Advertiser',
        id: DEMO_ADVERTISER.id,
        status: 'already_existed',
        details: `Email: ${DEMO_ADVERTISER.email}`,
      });
    } else {
      advertiser = await prisma.advertiser.create({
        data: {
          id: DEMO_ADVERTISER.id,
          role: DEMO_ADVERTISER.role,
          status: DEMO_ADVERTISER.status,
          displayName: DEMO_ADVERTISER.displayName,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      results.push({
        entity: 'Advertiser',
        id: DEMO_ADVERTISER.id,
        status: 'created',
        details: `Email: ${DEMO_ADVERTISER.email}`,
      });
    }

    // 2. Create or find campaign
    let campaign = await prisma.campaign.findUnique({
      where: { id: DEMO_CAMPAIGN.id },
    });

    if (campaign) {
      results.push({
        entity: 'Campaign',
        id: DEMO_CAMPAIGN.id,
        status: 'already_existed',
        details: DEMO_CAMPAIGN.title,
      });
    } else {
      const segmentId = `seg_demo_${uuidv4().slice(0, 8)}`;
      const creativeId = `creat_demo_${uuidv4().slice(0, 8)}`;

      campaign = await prisma.campaign.create({
        data: {
          id: DEMO_CAMPAIGN.id,
          advertiserId: DEMO_ADVERTISER.id,
          segmentId,
          creativeId,
          segmentCentroid: DEMO_CAMPAIGN.segmentCentroid,
          similarityThreshold: DEMO_CAMPAIGN.similarityThreshold,
          targetCategories: DEMO_CAMPAIGN.targetCategories,
          title: DEMO_CAMPAIGN.title,
          description: DEMO_CAMPAIGN.description,
          imageUrl: DEMO_CAMPAIGN.imageUrl,
          clickUrl: DEMO_CAMPAIGN.clickUrl,
          advertiserName: DEMO_ADVERTISER.displayName,
          budgetMidnight: DEMO_CAMPAIGN.budgetMidnight,
          cpmBidMidnight: DEMO_CAMPAIGN.cpmBidMidnight,
          startTime: DEMO_CAMPAIGN.startTime,
          endTime: DEMO_CAMPAIGN.endTime,
          status: DEMO_CAMPAIGN.status,
          midnightTxHash: '0x' + 'a'.repeat(64),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      results.push({
        entity: 'Campaign',
        id: DEMO_CAMPAIGN.id,
        status: 'created',
        details: DEMO_CAMPAIGN.title,
      });
    }

    // 3. Create or find proof record
    let proofRecord = await prisma.proofRecord.findUnique({
      where: { nullifier: DEMO_PROOF_NULLIFIER },
    });

    if (proofRecord) {
      results.push({
        entity: 'ProofRecord',
        id: DEMO_PROOF_NULLIFIER,
        status: 'already_existed',
        details: 'Demo proof (match=true)',
      });
    } else {
      proofRecord = await prisma.proofRecord.create({
        data: {
          nullifier: DEMO_PROOF_NULLIFIER,
          campaignId: DEMO_CAMPAIGN.id,
          segmentId: 'seg_demo_001',
          proofHash: '0x' + 'b'.repeat(64),
          publicInputHash: '0x' + 'c'.repeat(64),
          isMatch: true,
          relayTxHash: '0x' + 'd'.repeat(64),
          createdAt: new Date(),
        },
      });
      results.push({
        entity: 'ProofRecord',
        id: DEMO_PROOF_NULLIFIER.slice(0, 16) + '...',
        status: 'created',
        details: 'isMatch=true',
      });
    }

    // 4. Create or find reward claim
    let rewardClaim = await prisma.rewardClaim.findUnique({
      where: { nullifier: DEMO_REWARD_NULLIFIER },
    });

    if (rewardClaim) {
      results.push({
        entity: 'RewardClaim',
        id: DEMO_REWARD_NULLIFIER,
        status: 'already_existed',
        details: 'status=CLAIMED',
      });
    } else {
      rewardClaim = await prisma.rewardClaim.create({
        data: {
          nullifier: DEMO_REWARD_NULLIFIER,
          campaignId: DEMO_CAMPAIGN.id,
          amountMidnight: '5',
          claimTxHash: '0x' + 'e'.repeat(64),
          status: 'CLAIMED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      results.push({
        entity: 'RewardClaim',
        id: DEMO_REWARD_NULLIFIER.slice(0, 16) + '...',
        status: 'created',
        details: 'amount=5, status=CLAIMED',
      });
    }

    // Print summary table
    console.log(
      '\n┌─────────────────┬──────────────────────────────┬───────────────┬──────────────────────────┐'
    );
    console.log(
      '│ Entity          │ ID / Value                   │ Status        │ Details                  │'
    );
    console.log(
      '├─────────────────┼──────────────────────────────┼───────────────┼──────────────────────────┤'
    );

    for (const result of results) {
      const entityPad = result.entity.padEnd(15);
      const idPad = result.id.padEnd(28);
      const statusPad = result.status === 'created' ? '✓ Created'.padEnd(13) : '⊙ Existed'.padEnd(13);
      const detailsPad = result.details.padEnd(24);
      console.log(`│ ${entityPad} │ ${idPad} │ ${statusPad} │ ${detailsPad} │`);
    }

    console.log(
      '└─────────────────┴──────────────────────────────┴───────────────┴──────────────────────────┘'
    );

    console.log(`\n[seed] Database seeding completed successfully!`);
    console.log(`[seed] Demo advertiser: ${DEMO_ADVERTISER.email}`);
    console.log(`[seed] Demo campaign: ${DEMO_CAMPAIGN.title}`);
    console.log(`[seed] Ready to run e2e tests or manual demo flow\n`);

    process.exit(0);
  } catch (error) {
    console.error('[seed] Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
