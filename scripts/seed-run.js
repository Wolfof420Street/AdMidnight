#!/usr/bin/env node
try {
  require('ts-node/register');
} catch (err) {
  console.error('ts-node not found. Please install ts-node to run TypeScript seed scripts.');
  process.exit(1);
}
require('./seed.ts');
