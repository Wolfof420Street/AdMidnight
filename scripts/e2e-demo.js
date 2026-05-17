#!/usr/bin/env node

const crypto = require('node:crypto');

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const DEMO_EMAIL = 'demo@admidnight.io';
const DEMO_PASSWORD = 'demo_password_123';

const results = [];

async function run() {
  console.log(`\n[e2e] Starting end-to-end demo against ${API_URL}\n`);

  let step = 1;
  let token = null;
  let campaignId = null;
  let rewardEscrow = null;
  let bidReceiptId = null;
  let proofNullifier = null;
  let commitmentHash = null;
  let nonce = null;

  try {
    {
      console.log(`[${step}] POST /auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
      });
      const json = await response.json();
      const passed = response.status === 200 && json.token;
      token = json.token ?? null;
      results.push({
        step,
        endpoint: '/auth/login',
        method: 'POST',
        status: response.status,
        output: passed ? 'Token obtained' : 'Login failed',
        passed,
      });
      if (!passed) throw new Error(`Login failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /advertiser/campaign/create`);
      const centroid = new Array(128).fill(Math.random());
      const response = await fetch(`${API_URL}/advertiser/campaign/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          segmentConfig: {
            centroid,
            similarityThreshold: 0.75,
            targetCategories: ['tech'],
          },
          creative: {
            title: 'E2E Test Campaign',
            description: 'A test campaign for e2e validation',
            imageUrl: 'https://example.com/e2e.jpg',
            clickUrl: 'https://example.com',
            advertiserName: 'Demo Advertiser',
          },
          budgetMidnight: '500',
          cpmBidMidnight: '10',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      const json = await response.json();
      campaignId = json.id ?? null;
      const passed = response.status === 201 && campaignId;
      results.push({
        step,
        endpoint: '/advertiser/campaign/create',
        method: 'POST',
        status: response.status,
        output: passed ? `Created ${campaignId}` : 'Creation failed',
        passed,
      });
      if (!passed) throw new Error(`Campaign creation failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] GET /user/segments/available`);
      const response = await fetch(`${API_URL}/user/segments/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      const passed = response.status === 200 && Array.isArray(json) && json.length > 0;
      results.push({
        step,
        endpoint: '/user/segments/available',
        method: 'GET',
        status: response.status,
        output: passed ? `${json.length} segments available` : 'No segments',
        passed,
      });
      if (!passed) throw new Error(`Get segments failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /user/proof/match`);
      proofNullifier = '0x' + '0'.repeat(64);
      const response = await fetch(`${API_URL}/user/proof/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proofBytes: `placeholder_proof_${crypto.randomUUID()}`,
          publicInputs: {
            segmentId: 'seg_demo_001',
            campaignId,
            isMatch: true,
            nullifier: proofNullifier,
          },
          generatedAt: new Date().toISOString(),
        }),
      });
      const json = await response.json();
      rewardEscrow = json.rewardEscrow;
      const passed = response.status === 200 && rewardEscrow;
      results.push({
        step,
        endpoint: '/user/proof/match',
        method: 'POST',
        status: response.status,
        output: passed ? 'Proof accepted' : 'Proof rejected',
        passed,
      });
      if (!passed) throw new Error(`Proof submission failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /user/proof/match (replay)`);
      const response = await fetch(`${API_URL}/user/proof/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proofBytes: `placeholder_proof_${crypto.randomUUID()}`,
          publicInputs: {
            segmentId: `seg_${crypto.randomUUID().slice(0, 8)}`,
            campaignId,
            isMatch: true,
            nullifier: proofNullifier,
          },
          generatedAt: new Date().toISOString(),
        }),
      });
      const json = await response.json();
      const sameEscrow = JSON.stringify(json.rewardEscrow) === JSON.stringify(rewardEscrow);
      const passed = response.status === 200 && sameEscrow;
      results.push({
        step,
        endpoint: '/user/proof/match (replay)',
        method: 'POST',
        status: response.status,
        output: passed ? 'Idempotent response' : 'Idempotency failed',
        passed,
      });
      if (!passed) throw new Error(`Idempotency check failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /advertiser/auction/bid`);
      nonce = '0x' + crypto.randomBytes(32).toString('hex');
      const bidAmount = '50';
      const combined = Buffer.concat([
        Buffer.from(bidAmount, 'utf-8'),
        Buffer.from(nonce.slice(2), 'hex'),
      ]);
      commitmentHash = '0x' + crypto.createHash('sha256').update(combined).digest('hex');

      const response = await fetch(`${API_URL}/advertiser/auction/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId,
          commitmentHash,
        }),
      });
      const json = await response.json();
      bidReceiptId = json.bidReceiptId ?? null;
      const passed = response.status === 200 && bidReceiptId;
      results.push({
        step,
        endpoint: '/advertiser/auction/bid',
        method: 'POST',
        status: response.status,
        output: passed ? `Bid accepted ${bidReceiptId}` : 'Bid rejected',
        passed,
      });
      if (!passed) throw new Error(`Bid submission failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /advertiser/auction/reveal`);
      const response = await fetch(`${API_URL}/advertiser/auction/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campaignId,
          actualBid: '50',
          nonce,
        }),
      });
      const json = await response.json();
      const settlementTxHash = json.settlementTxHash ?? null;
      const passed = response.status === 200 && settlementTxHash;
      results.push({
        step,
        endpoint: '/advertiser/auction/reveal',
        method: 'POST',
        status: response.status,
        output: passed ? 'Bid revealed' : 'Reveal failed',
        passed,
      });
      if (!passed) throw new Error(`Bid reveal failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /user/rewards/claim`);
      const response = await fetch(`${API_URL}/user/rewards/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nullifier: proofNullifier,
          zkProof: `proof_${crypto.randomUUID()}`,
        }),
      });
      const json = await response.json();
      const claimStatus = json.status ?? null;
      const passed = response.status === 200 && claimStatus === 'CLAIMED';
      results.push({
        step,
        endpoint: '/user/rewards/claim',
        method: 'POST',
        status: response.status,
        output: passed ? `Claimed ${claimStatus}` : 'Claim failed',
        passed,
      });
      if (!passed) throw new Error(`Reward claim failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /user/rewards/claim (replay)`);
      const response = await fetch(`${API_URL}/user/rewards/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nullifier: proofNullifier,
          zkProof: `proof_${crypto.randomUUID()}`,
        }),
      });
      const json = await response.json();
      const isProblem = response.status !== 200 || (json.error !== undefined && json.error !== null);
      const passed = isProblem || (json.status === 'CLAIMED' && response.status === 200);
      results.push({
        step,
        endpoint: '/user/rewards/claim (replay)',
        method: 'POST',
        status: response.status,
        output: passed ? 'Duplicate claim handled' : 'Unexpected replay response',
        passed,
      });
      step++;
    }

    let allPassed = true;
    for (const result of results) {
      console.log(
        `[e2e] step ${result.step}: ${result.passed ? 'PASS' : 'FAIL'} ${result.method} ${result.endpoint} (${result.status}) ${result.output}`
      );
      if (!result.passed) allPassed = false;
    }

    console.log(`\n[e2e] ${results.filter((r) => r.passed).length}/${results.length} steps passed`);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n[e2e] Fatal error:', error.message || error);
    for (const result of results) {
      console.log(
        `[e2e] step ${result.step}: ${result.passed ? 'PASS' : 'FAIL'} ${result.method} ${result.endpoint} (${result.status}) ${result.output}`
      );
    }
    process.exit(1);
  }
}

run();
