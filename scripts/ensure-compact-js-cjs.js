#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { transformSync } = require('esbuild');

function findCompactJsPackage(repoRoot) {
  const pnpmDir = path.join(repoRoot, 'node_modules', '.pnpm');
  if (!fs.existsSync(pnpmDir)) return null;

  const entries = fs.readdirSync(pnpmDir);
  const match = entries.find((entry) => entry.startsWith('@midnight-ntwrk+compact-js@'));
  if (!match) return null;

  return path.join(
    pnpmDir,
    match,
    'node_modules',
    '@midnight-ntwrk',
    'compact-js',
  );
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const compactJsRoot = findCompactJsPackage(repoRoot);
  if (!compactJsRoot) return;

  const cjsSentinel = path.join(compactJsRoot, 'dist', 'cjs', 'effect', 'index.js');
  if (fs.existsSync(cjsSentinel)) {
    const content = fs.readFileSync(cjsSentinel, 'utf8');
    // If the file does NOT contain ESM tokens, treat it as already CJS and exit.
    if (!/\b(import|export)\b/.test(content)) {
      return;
    }
  }

  const esmDir = path.join(compactJsRoot, 'dist', 'esm');
  if (!fs.existsSync(esmDir)) return;

  const cjsDir = path.join(compactJsRoot, 'dist', 'cjs');
  if (fs.existsSync(cjsDir)) {
    fs.rmSync(cjsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(cjsDir, { recursive: true });

  const stack = [esmDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith('.js')) {
        continue;
      }

      const relFromEsm = path.relative(esmDir, fullPath);
      const outFile = path.join(cjsDir, relFromEsm);
      fs.mkdirSync(path.dirname(outFile), { recursive: true });

      const source = fs.readFileSync(fullPath, 'utf8');
      const transpiled = transformSync(source, {
        sourcefile: fullPath,
        loader: 'js',
        format: 'cjs',
        platform: 'node',
        target: 'es2022',
        sourcemap: false,
      });

      fs.writeFileSync(outFile, transpiled.code);
    }
  }
}

main();