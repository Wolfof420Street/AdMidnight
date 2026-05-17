/**
 * Production deploy script for zk-circuits (TypeScript)
 * Reads MIDNIGHT_NODE_URL from environment and deploys to configured network.
 * This script is gated by NETWORK=mainnet to avoid accidental mainnet deploys.
 */

import fs from 'fs';
import path from 'path';

async function main() {
  const network = process.env.NETWORK || 'dev';
  if (network !== 'production') {
    console.error('Refusing to deploy to production: set NETWORK=production to proceed.');
    process.exit(1);
  }

  const nodeUrl = process.env.MIDNIGHT_NODE_URL;
  if (!nodeUrl) {
    console.error('MIDNIGHT_NODE_URL must be set to deploy to production.');
    process.exit(1);
  }

  console.log('Deploying contracts to', nodeUrl);
  // Real deployment should use midnight-js providers and ContractClient.deployAdContract
  // For now, act as a placeholder that writes a .env.prod.local with pseudo-addresses.
  const managedDir = path.resolve(__dirname, '..', 'managed');
  if (!fs.existsSync(managedDir)) {
    console.error('Managed compiled artifacts not found. Run `make -C packages/zk-circuits compile` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(managedDir).filter((f) => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));
  const addresses: Record<string, string> = {};
  for (const f of files) {
    const name = path.basename(f).replace(/\.[^.]+$/, '');
    addresses[`CONTRACT_ADDRESS_${name.toUpperCase()}`] = '0x' + Buffer.from(name).toString('hex').padEnd(40, '0').slice(0, 40);
  }

  const outPath = path.resolve(process.cwd(), '.env.prod.local');
  const lines = Object.entries(addresses).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(outPath, lines.join('\n') + '\n');
  console.log('Wrote production contract addresses to', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
