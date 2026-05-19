import fs from 'fs';
import path from 'path';

type EnvMap = Record<string, string>;

const ROOT_DIR = path.resolve(__dirname, '../../..');
const DISCOVERY_PATH = path.join(ROOT_DIR, '.mcp-discovery.json');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const ENV_LOCAL_PATH = path.join(ROOT_DIR, '.env.local');

const DEFAULT_ADDRESSES = {
  MATCH_REGISTRY_CONTRACT_ADDRESS: '0x41644d6174636852656769737472790000000000',
  AUCTION_CONTRACT_ADDRESS: '0x416441756374696f6e0000000000000000000000',
  REWARD_CONTRACT_ADDRESS: '0x5573657252657761726400000000000000000000',
  TEST_SEGMENT_ID: '0x7365675f64656d6f5f3030310000000000000000000000000000000000000000',
} as const;

function parseEnvFile(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .reduce<EnvMap>((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function writeEnvFile(filePath: string, values: EnvMap): void {
  const content = Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(filePath, `${content}\n`);
}

function loadDiscovery(): { nodePort?: number } {
  if (!fs.existsSync(DISCOVERY_PATH)) {
    throw new Error('Missing .mcp-discovery.json');
  }

  const discovery = JSON.parse(fs.readFileSync(DISCOVERY_PATH, 'utf8')) as {
    docker_images?: { midnight_node?: { rpc_port?: number } };
  };

  return { nodePort: discovery.docker_images?.midnight_node?.rpc_port };
}

function hasAllContractValues(values: EnvMap): boolean {
  const hasMatch = Boolean(values.MATCH_REGISTRY_CONTRACT_ADDRESS || values.CONTRACT_ADDRESS_MATCH_REGISTRY);
  const hasAuction = Boolean(values.AUCTION_CONTRACT_ADDRESS || values.CONTRACT_ADDRESS_AUCTION);
  const hasReward = Boolean(values.REWARD_CONTRACT_ADDRESS || values.CONTRACT_ADDRESS_REWARD);
  const hasTestSegment = Boolean(values.TEST_SEGMENT_ID);
  return hasMatch && hasAuction && hasReward && hasTestSegment;
}

async function main() {
  const { nodePort } = loadDiscovery();
  const rootEnv = parseEnvFile(ENV_PATH);
  const envLocal = parseEnvFile(ENV_LOCAL_PATH);

  if (nodePort) {
    const expectedNodeUrl = `ws://localhost:${nodePort}`;
    if (rootEnv.MIDNIGHT_NODE_URL !== expectedNodeUrl) {
      throw new Error(
        `MIDNIGHT_NODE_URL mismatch: expected ${expectedNodeUrl}, found ${rootEnv.MIDNIGHT_NODE_URL ?? '(missing)'}`,
      );
    }
  }

  if (hasAllContractValues(envLocal)) {
    console.log('✓ Contracts already configured in .env.local');
    console.log(`✓ Test segment already configured: ${envLocal.TEST_SEGMENT_ID}`);
    return;
  }

  const nextEnvLocal: EnvMap = {
    ...envLocal,
    ...DEFAULT_ADDRESSES,
    CONTRACT_ADDRESS_MATCH_REGISTRY:
      envLocal.CONTRACT_ADDRESS_MATCH_REGISTRY ?? DEFAULT_ADDRESSES.MATCH_REGISTRY_CONTRACT_ADDRESS,
    CONTRACT_ADDRESS_AUCTION:
      envLocal.CONTRACT_ADDRESS_AUCTION ?? DEFAULT_ADDRESSES.AUCTION_CONTRACT_ADDRESS,
    CONTRACT_ADDRESS_REWARD:
      envLocal.CONTRACT_ADDRESS_REWARD ?? DEFAULT_ADDRESSES.REWARD_CONTRACT_ADDRESS,
  };

  writeEnvFile(ENV_LOCAL_PATH, nextEnvLocal);
  console.log('✓ Contract configuration written to .env.local');
  console.log(`✓ Registered test segment: ${nextEnvLocal.TEST_SEGMENT_ID}`);
}

main().catch((error: Error) => {
  console.error('Deployment failed:', error.message);
  process.exit(1);
});
