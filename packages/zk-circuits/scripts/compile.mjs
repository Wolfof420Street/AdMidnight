import { readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync, execSync } from 'child_process';

try {
  const version = execSync('npx compactc --version', {
    encoding: 'utf8',
  }).trim();
  console.log(`[compactc] Using compiler: ${version}`);
} catch {
  console.error(
    '[compactc] ERROR: compactc not found. Install via: yarn workspace @admidnight/zk-circuits add -D @midnight-ntwrk/compact-compiler',
  );
  console.error('[compactc] Skipping contract compilation.');
  process.exit(0);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'src');
const OUT_DIR = join(__dirname, '..', 'managed');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const contracts = readdirSync(SRC_DIR).filter(f => f.endsWith('.compact'));

for (const contract of contracts) {
  const contractName = contract.replace('.compact', '');
  const inputPath = join(SRC_DIR, contract);
  const outputDir = join(OUT_DIR, contractName);

  mkdirSync(outputDir, { recursive: true });

  console.log(`[compactc] Compiling ${contract}...`);

  execFileSync('npx', [
    'compactc',
    inputPath,
    '--output', outputDir,
  ], { stdio: 'inherit' });

  console.log(`[compactc] ✓ ${contractName} → managed/${contractName}/`);
}

console.log('[compactc] All contracts compiled.');
