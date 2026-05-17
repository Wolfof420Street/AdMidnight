/**
 * Jest Test Setup & Helpers
 * 
 * This file initializes the Jest test environment with custom matchers
 * and shared utilities for contract testing.
 * 
 * @module tests/setup
 */

// Custom matchers for contract testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidNullifier(): R;
      toBeValidCommitment(): R;
    }
  }

  var generateRandomBytes32: () => string;
  var generateRandomUint64: () => bigint;
}

expect.extend({
  toBeValidNullifier(received: string) {
    const pass =
      typeof received === 'string' &&
      received.startsWith('0x') &&
      received.length === 66 && // 0x + 64 hex chars
      received !== '0x' + '00'.repeat(32); // Not zero

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid nullifier`
          : `expected ${received} to be a valid nullifier (non-zero, 32-byte hex)`,
    };
  },

  toBeValidCommitment(received: string) {
    const pass =
      typeof received === 'string' &&
      received.startsWith('0x') &&
      received.length === 66; // 0x + 64 hex chars

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid commitment`
          : `expected ${received} to be a valid commitment (32-byte hex)`,
    };
  },
});

// Global test utilities
globalThis.generateRandomBytes32 = (): string => {
  const randomHex = Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('');
  return '0x' + randomHex;
};

globalThis.generateRandomUint64 = (): bigint => {
  return BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
};

// Test environment setup
beforeAll(() => {
  console.log('🧪 AdMidnight Smart Contract Test Suite Initialized');
  console.log(`📅 Test Run: ${new Date().toISOString()}`);
});

afterAll(() => {
  console.log('✅ Test Suite Complete');
});

// Per-test logging (optional - comment out to reduce noise)
// beforeEach(() => {
//   console.log(`  ▶ ${expect.getState().currentTestName}`);
// });

export {};
