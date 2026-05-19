#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const ENV_LOCAL_PATH = path.join(ROOT_DIR, '.env.local');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }
      acc[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
      return acc;
    }, {});
}

const env = {
  ...parseEnvFile(ENV_PATH),
  ...parseEnvFile(ENV_LOCAL_PATH),
};

const DEMO_EMAIL = 'demo@admidnight.io';
const DEMO_PASSWORD = env.SEED_PASSWORD || process.env.SEED_PASSWORD || 'demo_password_123';
const TEST_SEGMENT_ID =
  env.TEST_SEGMENT_ID ||
  '0x7365675f64656d6f5f3030310000000000000000000000000000000000000000';

const results = [];

function bytes32FromAscii(input) {
  return `0x${Buffer.from(input, 'utf8').toString('hex').padEnd(64, '0').slice(0, 64)}`;
}

function computeCommitment(actualBid, nonce) {
  const bidBytes = Buffer.from(actualBid, 'utf8');
  const nonceBytes = Buffer.from(nonce.replace(/^0x/, ''), 'hex');
  return `0x${crypto.createHash('sha256').update(Buffer.concat([bidBytes, nonceBytes])).digest('hex')}`;
}

async function apiRequest(step, method, endpoint, { token, headers = {}, body } = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!response.ok) {
    console.error(`[e2e] step ${step} failed response body:`);
    console.error(typeof json === 'string' ? json : JSON.stringify(json, null, 2));
  }

  return { response, json };
}

function successData(json) {
  if (json && typeof json === 'object' && json.success === true && 'data' in json) {
    return json.data;
  }
  return json;
}

async function run() {
  console.log(`\n[e2e] Starting end-to-end demo against ${API_URL}\n`);

  let step = 1;
  let token = null;
  let campaignId = null;
  let rewardEscrow = null;
  let proofNullifier = null;
  let commitmentHash = null;
  let nonce = null;
  const actualBid = '50';

  try {
    {
      console.log(`[${step}] POST /auth/login`);
      const { response, json } = await apiRequest(step, 'POST', '/auth/login', {
        headers: { 'x-client': 'mobile' },
        body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
      });
      const data = successData(json);
      token = data?.token ?? null;
      const passed = response.status === 200 && typeof token === 'string';
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
      const { response, json } = await apiRequest(step, 'POST', '/advertiser/campaign/create', {
        token,
        body: {
          segmentConfig: {
            centroid: new Array(128).fill(0.125),
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
        },
      });
      const data = successData(json);
      campaignId = data?.id ?? null;
      const passed = response.status === 201 && typeof campaignId === 'string';
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
      const { response, json } = await apiRequest(step, 'GET', '/user/segments/available', { token });
      const data = successData(json);
      const passed = response.status === 200 && Array.isArray(data) && data.length > 0;
      results.push({
        step,
        endpoint: '/user/segments/available',
        method: 'GET',
        status: response.status,
        output: passed ? `${data.length} segments available` : 'No segments',
        passed,
      });
      if (!passed) throw new Error(`Get segments failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /user/proof/match`);
      proofNullifier = `0x${crypto.randomBytes(32).toString('hex')}`;
      const { response, json } = await apiRequest(step, 'POST', '/user/proof/match', {
        token,
        body: {
          proofBytes: `placeholder_proof_${crypto.randomUUID()}`,
          publicInputs: {
            segmentId: TEST_SEGMENT_ID,
            campaignId,
            isMatch: true,
            nullifier: proofNullifier,
          },
          generatedAt: new Date().toISOString(),
        },
      });
      const data = successData(json);
      rewardEscrow = data?.rewardEscrow ?? null;
      const passed = response.status === 200 && rewardEscrow === proofNullifier;
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
      const { response, json } = await apiRequest(step, 'POST', '/user/proof/match', {
        token,
        body: {
          proofBytes: `placeholder_proof_${crypto.randomUUID()}`,
          publicInputs: {
            segmentId: TEST_SEGMENT_ID,
            campaignId,
            isMatch: true,
            nullifier: proofNullifier,
          },
          generatedAt: new Date().toISOString(),
        },
      });
      const data = successData(json);
      const passed =
        response.status === 200 &&
        data?.rewardEscrow === rewardEscrow &&
        data?.campaignId === campaignId;
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
      nonce = `0x${crypto.randomBytes(32).toString('hex')}`;
      commitmentHash = computeCommitment(actualBid, nonce);
      const { response, json } = await apiRequest(step, 'POST', '/advertiser/auction/bid', {
        token,
        body: {
          campaignId,
          commitmentHash,
        },
      });
      const data = successData(json);
      const passed = response.status === 200 && typeof data?.bidReceiptId === 'string';
      results.push({
        step,
        endpoint: '/advertiser/auction/bid',
        method: 'POST',
        status: response.status,
        output: passed ? `Bid accepted ${data.bidReceiptId}` : 'Bid rejected',
        passed,
      });
      if (!passed) throw new Error(`Bid submission failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /advertiser/auction/reveal`);
      const { response, json } = await apiRequest(step, 'POST', '/advertiser/auction/reveal', {
        token,
        body: {
          campaignId,
          actualBid,
          nonce,
        },
      });
      const data = successData(json);
      const passed = response.status === 200 && typeof data?.settlementTxHash === 'string';
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
      const { response, json } = await apiRequest(step, 'POST', '/user/rewards/claim', {
        token,
        body: {
          nullifier: proofNullifier,
          zkProof: bytes32FromAscii('claim-proof'),
        },
      });
      const data = successData(json);
      const passed = response.status === 200 && data?.status === 'CLAIMED';
      results.push({
        step,
        endpoint: '/user/rewards/claim',
        method: 'POST',
        status: response.status,
        output: passed ? `Claimed ${data.status}` : 'Claim failed',
        passed,
      });
      if (!passed) throw new Error(`Reward claim failed: ${response.status}`);
      step++;
    }

    {
      console.log(`[${step}] POST /user/rewards/claim (replay)`);
      const { response, json } = await apiRequest(step, 'POST', '/user/rewards/claim', {
        token,
        body: {
          nullifier: proofNullifier,
          zkProof: bytes32FromAscii('claim-proof-replay'),
        },
      });
      const bodyText = typeof json === 'string' ? json : JSON.stringify(json);
      const passed = bodyText.toLowerCase().includes('already claimed');
      results.push({
        step,
        endpoint: '/user/rewards/claim (replay)',
        method: 'POST',
        status: response.status,
        output: passed ? 'Duplicate claim handled' : 'Unexpected replay response',
        passed,
      });
    }

    let allPassed = true;
    for (const result of results) {
      console.log(
        `[e2e] step ${result.step}: ${result.passed ? 'PASS' : 'FAIL'} ${result.method} ${result.endpoint} (${result.status}) ${result.output}`,
      );
      if (!result.passed) {
        allPassed = false;
      }
    }

    console.log(`\n[e2e] ${results.filter((result) => result.passed).length}/${results.length} steps passed`);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error(`\n[e2e] Fatal error: ${error.message || error}`);
    for (const result of results) {
      console.log(
        `[e2e] step ${result.step}: ${result.passed ? 'PASS' : 'FAIL'} ${result.method} ${result.endpoint} (${result.status}) ${result.output}`,
      );
    }
    process.exit(1);
  }
}

run();
