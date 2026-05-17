const crypto = require('node:crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

async function main() {
  const results = [];

  try {
    console.log('[seed] Starting database seeding...\n');

    let advertiser = await prisma.advertiser.findUnique({
      where: { id: DEMO_ADVERTISER.id },
    });

    if (advertiser) {
      results.push(['Advertiser', DEMO_ADVERTISER.id, 'already_existed', `Email: ${DEMO_ADVERTISER.email}`]);
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
      results.push(['Advertiser', DEMO_ADVERTISER.id, 'created', `Email: ${DEMO_ADVERTISER.email}`]);
    }

    let campaign = await prisma.campaign.findUnique({
      where: { id: DEMO_CAMPAIGN.id },
    });

    if (campaign) {
      results.push(['Campaign', DEMO_CAMPAIGN.id, 'already_existed', DEMO_CAMPAIGN.title]);
    } else {
      campaign = await prisma.campaign.create({
        data: {
          id: DEMO_CAMPAIGN.id,
          advertiserId: DEMO_ADVERTISER.id,
          segmentId: `seg_demo_${crypto.randomUUID().slice(0, 8)}`,
          creativeId: `creat_demo_${crypto.randomUUID().slice(0, 8)}`,
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
      results.push(['Campaign', DEMO_CAMPAIGN.id, 'created', DEMO_CAMPAIGN.title]);
    }

    let proofRecord = await prisma.proofRecord.findUnique({
      where: { nullifier: DEMO_PROOF_NULLIFIER },
    });

    if (proofRecord) {
      results.push(['ProofRecord', DEMO_PROOF_NULLIFIER.slice(0, 16) + '...', 'already_existed', 'Demo proof (match=true)']);
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
      results.push(['ProofRecord', DEMO_PROOF_NULLIFIER.slice(0, 16) + '...', 'created', 'isMatch=true']);
    }

    let rewardClaim = await prisma.rewardClaim.findUnique({
      where: { nullifier: DEMO_REWARD_NULLIFIER },
    });

    if (rewardClaim) {
      results.push(['RewardClaim', DEMO_REWARD_NULLIFIER.slice(0, 16) + '...', 'already_existed', 'status=CLAIMED']);
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
      results.push(['RewardClaim', DEMO_REWARD_NULLIFIER.slice(0, 16) + '...', 'created', 'amount=5, status=CLAIMED']);
    }

    for (const [entity, id, status, details] of results) {
      console.log(`[seed] ${status}: ${entity} ${id} ${details}`);
    }

    console.log('\n[seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[seed] Fatal error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
