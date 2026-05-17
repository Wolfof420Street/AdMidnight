#!/usr/bin/env node
// Lightweight runner: uses ts-node/register if available to run deploy.ts
try {
  require('ts-node/register');
} catch (err) {
  console.error('ts-node not found. Please install ts-node in the workspace (pnpm -w add -D ts-node typescript)');
  process.exit(1);
}
require('./deploy.ts');
