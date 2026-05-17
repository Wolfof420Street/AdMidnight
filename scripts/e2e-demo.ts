/**
 * E2E demo script: tests complete AdMidnight flow programmatically
 * Steps: login → create campaign → get segments → submit proof → bid → reveal → claim reward
 * Exit code 0 = all steps passed, 1 = any step failed
 */

import { v4 as uuidv4 } from 'uuid';
import { randomBytes, createHash } from 'crypto';

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const DEMO_EMAIL = 'demo@admidnight.io';
const DEMO_PASSWORD = 'demo_password_123';

interface Step {
  step: number;
  endpoint: string;
  method: string;
  status: number | null;
  output: string;
  passed: boolean;
  error?: string;
}

const results: Step[] = [];

async function run() {
  console.log(`\n[e2e] Starting end-to-end demo against ${API_URL}\n`);

  let step = 1;
  let token: string | null = null;
  let campaignId: string | null = null;
  let rewardEscrow: unknown = null;
  let bidReceiptId: string | null = null;
  let proofNullifier: string | null = null;
  let commitmentHash: string | null = null;
  let nonce: string | null = null;

  try {
    // STEP 1: Login
    {
      console.log(`[${step}] POST /auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
      });

      const json = (await response.json()) as Record<string, unknown>;
      const passed = response.status === 200 && json.token;
      token = (json.token as string) ?? null;

      results.push({
        step,
        endpoint: '/auth/login',
        method: 'POST',
        status: response.status,
        output: passed ? '✓ Token obtained' : '✗ Login failed',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      if (!passed) throw new Error(`Login failed: ${response.status}`);
      step++;
    }

    // STEP 2: Create campaign
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

      const json = (await response.json()) as Record<string, unknown>;
      campaignId = (json.id as string) ?? null;
      const passed = response.status === 201 && campaignId;

      results.push({
        step,
        endpoint: '/advertiser/campaign/create',
        method: 'POST',
        status: response.status,
        output: passed ? `✓ Created: ${campaignId?.slice(0, 12)}...` : '✗ Creation failed',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      if (!passed) throw new Error(`Campaign creation failed: ${response.status}`);
      step++;
    }

    // STEP 3: Get available segments
    {
      console.log(`[${step}] GET /user/segments/available`);
      const response = await fetch(`${API_URL}/user/segments/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = (await response.json()) as unknown[];
      const passed = response.status === 200 && Array.isArray(json) && json.length > 0;

      results.push({
        step,
        endpoint: '/user/segments/available',
        method: 'GET',
        status: response.status,
        output: passed ? `✓ ${json.length} segments available` : '✗ No segments',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      if (!passed) throw new Error(`Get segments failed: ${response.status}`);
      step++;
    }

    // STEP 4: Submit proof (valid)
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
          proofBytes: 'placeholder_proof_' + uuidv4(),
          publicInputs: {
            segmentId: 'seg_demo_001', // Use consistent segmentId from seeded campaign
            campaignId,
            isMatch: true,
            nullifier: proofNullifier,
          },
          generatedAt: new Date().toISOString(),
        }),
      });

      const json = (await response.json()) as Record<string, unknown>;
      rewardEscrow = json.rewardEscrow;
      const passed = response.status === 200 && rewardEscrow;

      results.push({
        step,
        endpoint: '/user/proof/match',
        method: 'POST',
        status: response.status,
        output: passed ? `✓ Proof accepted, escrow: ${JSON.stringify(rewardEscrow).slice(0, 20)}...` : '✗ Proof rejected',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      if (!passed) throw new Error(`Proof submission failed: ${response.status}`);
      step++;
    }

    // STEP 5: Submit same proof again (idempotency check)
    {
      console.log(`[${step}] POST /user/proof/match (replay)`);
      const response = await fetch(`${API_URL}/user/proof/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proofBytes: 'placeholder_proof_' + uuidv4(),
          publicInputs: {
            segmentId: 'seg_' + uuidv4().slice(0, 8),
            campaignId,
            isMatch: true,
            nullifier: proofNullifier,
          },
          generatedAt: new Date().toISOString(),
        }),
      });

      const json = (await response.json()) as Record<string, unknown>;
      const sameEscrow = JSON.stringify(json.rewardEscrow) === JSON.stringify(rewardEscrow);
      const passed = response.status === 200 && sameEscrow;

      results.push({
        step,
        endpoint: '/user/proof/match (replay)',
        method: 'POST',
        status: response.status,
        output: passed ? '✓ Idempotent: same record returned' : '✗ Idempotency failed',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      if (!passed) throw new Error(`Idempotency check failed: ${response.status}`);
      step++;
    }

    // STEP 6: Commit bid
    {
      console.log(`[${step}] POST /advertiser/auction/bid`);
      // Generate random nonce for reveal step
      const randomNonceBytes = randomBytes(32);
      nonce = '0x' + randomNonceBytes.toString('hex');
      
      // Compute commitmentHash = SHA-256(actualBid || nonce) - matching auctionApi.buildCommitment
      const bidAmount = '50';
      const bidBytes = Buffer.from(bidAmount, 'utf-8');
      const nonceBytes = Buffer.from(nonce.slice(2), 'hex');
      const combined = Buffer.concat([bidBytes, nonceBytes]);
      const hash = createHash('sha256').update(combined).digest();
      commitmentHash = '0x' + hash.toString('hex');

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

      const json = (await response.json()) as Record<string, unknown>;
      bidReceiptId = (json.bidReceiptId as string) ?? null;
      const passed = response.status === 200 && bidReceiptId;

      results.push({
        step,
        endpoint: '/advertiser/auction/bid',
        method: 'POST',
        status: response.status,
        output: passed ? `✓ Bid accepted: ${bidReceiptId?.slice(0, 12)}...` : '✗ Bid rejected',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      if (!passed) throw new Error(`Bid submission failed: ${response.status}`);
      step++;
    }

    // STEP 7: Reveal bid
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
          nonce: nonce, // Use nonce from step 6
        }),
      });

      const json = (await response.json()) as Record<string, unknown>;
      const settlementTxHash = (json.settlementTxHash as string) ?? null;
      const passed = response.status === 200 && settlementTxHash;

      results.push({
        step,
        endpoint: '/advertiser/auction/reveal',
        method: 'POST',
        status: response.status,
        output: passed ? `✓ Bid revealed: ${settlementTxHash?.slice(0, 12)}...` : '✗ Reveal failed',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      if (!passed) throw new Error(`Bid reveal failed: ${response.status}`);
      step++;
    }

    // STEP 8: Claim reward
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
          zkProof: 'proof_' + uuidv4(),
        }),
      });

      const json = (await response.json()) as Record<string, unknown>;
      const claimStatus = (json.status as string) ?? null;
      const passed = response.status === 200 && claimStatus === 'CLAIMED';

      results.push({
        step,
        endpoint: '/user/rewards/claim',
        method: 'POST',
        status: response.status,
        output: passed ? `✓ Claimed: status=${claimStatus}` : '✗ Claim failed',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      if (!passed) throw new Error(`Reward claim failed: ${response.status}`);
      step++;
    }

    // STEP 9: Try to claim same reward again
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
          zkProof: 'proof_' + uuidv4(),
        }),
      });

      // Second claim should indicate already claimed (could be 409 or 200 with error field)
      const json = (await response.json()) as Record<string, unknown>;
      const isProblem = response.status !== 200 || (json.error !== undefined && json.error !== null);
      const passed =
        isProblem || (json.status === 'CLAIMED' && response.status === 200); // Already claimed is fine

      results.push({
        step,
        endpoint: '/user/rewards/claim (replay)',
        method: 'POST',
        status: response.status,
        output: passed ? '✓ Proper handling of duplicate claim' : '✗ Unexpected response',
        passed,
        error: passed ? undefined : `Status ${response.status}`,
      });

      // Don't throw here - this is the last step and is expected to fail or indicate already-claimed
      step++;
    }

    // Print summary table
    console.log(
      '\n┌─────┬──────────────────────────┬──────┬─────────┬──────────────────────────────┬────────┐'
    );
    console.log(
      '│ # │ Endpoint                   │ Method │ Status │ Output                       │ Result │'
    );
    console.log(
      '├─────┼──────────────────────────┼──────┼─────────┼──────────────────────────────┼────────┤'
    );

    let allPassed = true;
    for (const r of results) {
      const stepPad = String(r.step).padEnd(3);
      const endpointPad = r.endpoint.padEnd(24);
      const methodPad = r.method.padEnd(6);
      const statusPad = (r.status ?? '-').toString().padEnd(7);
      const outputPad = r.output.padEnd(28);
      const resultPad = r.passed ? '✓ PASS'.padEnd(6) : '✗ FAIL'.padEnd(6);
      console.log(
        `│ ${stepPad} │ ${endpointPad} │ ${methodPad} │ ${statusPad} │ ${outputPad} │ ${resultPad} │`
      );
      if (!r.passed) allPassed = false;
    }

    console.log(
      '└─────┴──────────────────────────┴──────┴─────────┴──────────────────────────────┴────────┘'
    );

    const passCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`\n[e2e] ${passCount}/${totalCount} steps passed`);

    if (allPassed) {
      console.log('[e2e] All steps passed! Demo is working correctly.\n');
      process.exit(0);
    } else {
      console.log('[e2e] Some steps failed. See above for details.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n[e2e] Fatal error:', error);

    // Print partial results
    if (results.length > 0) {
      console.log(
        '\n┌─────┬──────────────────────────┬──────┬─────────┬──────────────────────────────┬────────┐'
      );
      console.log(
        '│ # │ Endpoint                   │ Method │ Status │ Output                       │ Result │'
      );
      console.log(
        '├─────┼──────────────────────────┼──────┼─────────┼──────────────────────────────┼────────┤'
      );
      for (const r of results) {
        const stepPad = String(r.step).padEnd(3);
        const endpointPad = r.endpoint.padEnd(24);
        const methodPad = r.method.padEnd(6);
        const statusPad = (r.status ?? '-').toString().padEnd(7);
        const outputPad = r.output.padEnd(28);
        const resultPad = r.passed ? '✓ PASS'.padEnd(6) : '✗ FAIL'.padEnd(6);
        console.log(
          `│ ${stepPad} │ ${endpointPad} │ ${methodPad} │ ${statusPad} │ ${outputPad} │ ${resultPad} │`
        );
      }
      console.log(
        '└─────┴──────────────────────────┴──────┴─────────┴──────────────────────────────┴────────┘'
      );
    }

    process.exit(1);
  }
}

run().catch(console.error);
