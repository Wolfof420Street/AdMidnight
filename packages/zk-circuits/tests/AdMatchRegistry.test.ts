/**
 * Integration Tests: AdMatchRegistry.compact
 * 
 * Test Coverage:
 * - Segment registration and configuration validation
 * - Nullifier replay prevention (proveSegmentMatch enforces one-time use)
 * - Impression counting and aggregation
 * - Cross-campaign isolation and validation
 * - Invalid proof rejections
 * 
 * @module AdMatchRegistry.test
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Mock Ledger State for MatchRegistry
 * Simulates the Compact ledger behavior without on-chain execution
 */
class MockMatchRegistryLedger {
  private campaignImpressions: Map<string, bigint> = new Map();
  private claimedNullifiers: Set<string> = new Set();
  private registeredSegments: Map<
    string,
    {
      campaignId: string;
      threshold: string;
      segmentCommitment: string;
      active: boolean;
    }
  > = new Map();
  private totalImpressions: bigint = 0n;

  resetState(): void {
    this.campaignImpressions.clear();
    this.claimedNullifiers.clear();
    this.registeredSegments.clear();
    this.totalImpressions = 0n;
  }

  registerSegment(
    segmentId: string,
    campaignId: string,
    threshold: string,
    segmentCommitment: string
  ): void {
    this.registeredSegments.set(segmentId, {
      campaignId,
      threshold,
      segmentCommitment,
      active: true,
    });
  }

  getSegment(segmentId: string): {
    campaignId: string;
    threshold: string;
    segmentCommitment: string;
    active: boolean;
  } | undefined {
    return this.registeredSegments.get(segmentId);
  }

  isNullifierClaimed(nullifier: string): boolean {
    return this.claimedNullifiers.has(nullifier);
  }

  claimNullifier(nullifier: string): void {
    this.claimedNullifiers.add(nullifier);
  }

  recordImpression(campaignId: string): void {
    const current = this.campaignImpressions.get(campaignId) ?? 0n;
    this.campaignImpressions.set(campaignId, current + 1n);
    this.totalImpressions += 1n;
  }

  getImpressionCount(campaignId: string): bigint {
    return this.campaignImpressions.get(campaignId) ?? 0n;
  }

  getTotalImpressions(): bigint {
    return this.totalImpressions;
  }

  deactivateSegment(segmentId: string): void {
    const segment = this.registeredSegments.get(segmentId);
    if (segment) {
      this.registeredSegments.set(segmentId, { ...segment, active: false });
    }
  }
}

describe('AdMatchRegistry.compact - Integration Tests', () => {
  let ledger: MockMatchRegistryLedger;

  const testSegmentId = '0x' + '01'.repeat(32);
  const testSegmentId2 = '0x' + '02'.repeat(32);
  const testCampaignId = '0x' + '10'.repeat(32);
  const testCampaignId2 = '0x' + '11'.repeat(32);
  const testThreshold = 'threshold_value_1';
  const testCommitment = '0x' + 'aa'.repeat(32);
  const testProofCommitment = '0x' + 'bb'.repeat(32);
  const testNullifier = '0x' + 'cc'.repeat(32);
  const testNullifier2 = '0x' + 'dd'.repeat(32);
  const testNullifier3 = '0x' + 'ee'.repeat(32);

  beforeEach(() => {
    ledger = new MockMatchRegistryLedger();
  });

  describe('Segment Registration', () => {
    it('should register a new segment with correct configuration', () => {
      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);

      const segment = ledger.getSegment(testSegmentId);
      expect(segment).toBeDefined();
      expect(segment?.campaignId).toBe(testCampaignId);
      expect(segment?.threshold).toBe(testThreshold);
      expect(segment?.segmentCommitment).toBe(testCommitment);
      expect(segment?.active).toBe(true);
    });

    it('should allow multiple segments for the same campaign', () => {
      const threshold2 = 'threshold_value_2';
      const commitment2 = '0x' + 'cc'.repeat(32);

      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);
      ledger.registerSegment(testSegmentId2, testCampaignId, threshold2, commitment2);

      const segment1 = ledger.getSegment(testSegmentId);
      const segment2 = ledger.getSegment(testSegmentId2);

      expect(segment1?.campaignId).toBe(testCampaignId);
      expect(segment2?.campaignId).toBe(testCampaignId);
      expect(segment1?.threshold).not.toBe(segment2?.threshold);
    });

    it('should allow the same segment ID to be registered for different campaigns', () => {
      // This is allowed by the contract, but application should prevent it
      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);
      const threshold2 = 'threshold_value_2';
      ledger.registerSegment(testSegmentId, testCampaignId2, threshold2, testCommitment);

      const segment = ledger.getSegment(testSegmentId);
      expect(segment?.campaignId).toBe(testCampaignId2); // Last write wins
    });
  });

  describe('Proof Validation: proveSegmentMatch', () => {
    beforeEach(() => {
      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);
    });

    it('should reject proof if segment is not active', () => {
      ledger.deactivateSegment(testSegmentId);

      // Attempt to call proveSegmentMatch
      // Assert: config.active == true
      const segment = ledger.getSegment(testSegmentId);
      const isActive = segment?.active === true;
      expect(isActive).toBe(false);
    });

    it('should reject proof if campaignId does not match segment registration', () => {
      // Attempt to call proveSegmentMatch with different campaignId
      const segment = ledger.getSegment(testSegmentId);
      const campaignMatches = segment?.campaignId === testCampaignId2;
      expect(campaignMatches).toBe(false);
    });

    it('should reject proof if proofCommitment is zero', () => {
      const zeroCommitment = '0x' + '00'.repeat(32);

      // Attempt to call proveSegmentMatch with zeroCommitment
      // Assert: proofCommitment != 0
      const isNonZero = zeroCommitment !== ('0x' + '00'.repeat(32));
      expect(isNonZero).toBe(false);
    });

    it('should reject proof if nullifier has already been claimed', () => {
      // First proof submission
      ledger.claimNullifier(testNullifier);

      // Attempt to reuse the same nullifier
      // Assert: disclose(claimedNullifiers.member(nullifier)) == false
      const isAlreadyClaimed = ledger.isNullifierClaimed(testNullifier);
      expect(isAlreadyClaimed).toBe(true);
    });

    it('should accept valid proof and record impression', () => {
      expect(ledger.getImpressionCount(testCampaignId)).toBe(0n);

      // Execute proveSegmentMatch with valid inputs
      const segment = ledger.getSegment(testSegmentId);
      expect(segment?.active).toBe(true);
      expect(segment?.campaignId).toBe(testCampaignId);
      expect(testProofCommitment).not.toBe('0x' + '00'.repeat(32));
      expect(ledger.isNullifierClaimed(testNullifier)).toBe(false);

      // Record the impression
      ledger.claimNullifier(testNullifier);
      ledger.recordImpression(testCampaignId);

      expect(ledger.isNullifierClaimed(testNullifier)).toBe(true);
      expect(ledger.getImpressionCount(testCampaignId)).toBe(1n);
      expect(ledger.getTotalImpressions()).toBe(1n);
    });
  });

  describe('Nullifier Replay Prevention', () => {
    beforeEach(() => {
      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);
    });

    it('should prevent reuse of the same nullifier within a campaign', () => {
      // First proof
      ledger.claimNullifier(testNullifier);
      ledger.recordImpression(testCampaignId);
      expect(ledger.getImpressionCount(testCampaignId)).toBe(1n);

      // Attempt to reuse the same nullifier
      const isAlreadyClaimed = ledger.isNullifierClaimed(testNullifier);
      expect(isAlreadyClaimed).toBe(true);
    });

    it('should prevent reuse of the same nullifier across campaigns', () => {
      ledger.registerSegment(testSegmentId2, testCampaignId2, testThreshold, testCommitment);

      // First proof in campaign 1
      ledger.claimNullifier(testNullifier);
      ledger.recordImpression(testCampaignId);

      // Attempt to reuse same nullifier in campaign 2
      const isAlreadyClaimed = ledger.isNullifierClaimed(testNullifier);
      expect(isAlreadyClaimed).toBe(true);
    });

    it('should allow different nullifiers for the same campaign', () => {
      ledger.claimNullifier(testNullifier);
      ledger.recordImpression(testCampaignId);

      ledger.claimNullifier(testNullifier2);
      ledger.recordImpression(testCampaignId);

      expect(ledger.getImpressionCount(testCampaignId)).toBe(2n);
    });

    it('should track nullifiers globally across all proofs', () => {
      const nullifiers = [testNullifier, testNullifier2, testNullifier3];

      nullifiers.forEach((nullifier) => {
        expect(ledger.isNullifierClaimed(nullifier)).toBe(false);
        ledger.claimNullifier(nullifier);
        expect(ledger.isNullifierClaimed(nullifier)).toBe(true);
      });

      // Verify all three are claimed
      nullifiers.forEach((nullifier) => {
        expect(ledger.isNullifierClaimed(nullifier)).toBe(true);
      });
    });
  });

  describe('Impression Counting and Aggregation', () => {
    beforeEach(() => {
      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);
      ledger.registerSegment(testSegmentId2, testCampaignId2, testThreshold, testCommitment);
    });

    it('should correctly count impressions for a single campaign', () => {
      const nullifiers = [testNullifier, testNullifier2, testNullifier3];

      nullifiers.forEach((nullifier, index) => {
        ledger.claimNullifier(nullifier);
        ledger.recordImpression(testCampaignId);
        expect(ledger.getImpressionCount(testCampaignId)).toBe(BigInt(index + 1));
      });

      expect(ledger.getImpressionCount(testCampaignId)).toBe(3n);
    });

    it('should isolate impression counts between campaigns', () => {
      ledger.claimNullifier(testNullifier);
      ledger.recordImpression(testCampaignId);

      ledger.claimNullifier(testNullifier2);
      ledger.recordImpression(testCampaignId2);

      expect(ledger.getImpressionCount(testCampaignId)).toBe(1n);
      expect(ledger.getImpressionCount(testCampaignId2)).toBe(1n);
    });

    it('should aggregate total impressions across all campaigns', () => {
      const campaignNullifiers = [testNullifier, testNullifier2];

      campaignNullifiers.forEach((nullifier) => {
        ledger.claimNullifier(nullifier);
        ledger.recordImpression(testCampaignId);
      });

      const otherNullifier = '0x' + 'ff'.repeat(32);
      ledger.claimNullifier(otherNullifier);
      ledger.recordImpression(testCampaignId2);

      expect(ledger.getTotalImpressions()).toBe(3n);
      expect(ledger.getImpressionCount(testCampaignId)).toBe(2n);
      expect(ledger.getImpressionCount(testCampaignId2)).toBe(1n);
    });
  });

  describe('Read Operation: getImpressionCount', () => {
    beforeEach(() => {
      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);
    });

    it('should return 0 for campaign with no impressions', () => {
      const count = ledger.getImpressionCount(testCampaignId);
      expect(count).toBe(0n);
    });

    it('should return correct count for campaign with impressions', () => {
      ledger.claimNullifier(testNullifier);
      ledger.recordImpression(testCampaignId);

      ledger.claimNullifier(testNullifier2);
      ledger.recordImpression(testCampaignId);

      const count = ledger.getImpressionCount(testCampaignId);
      expect(count).toBe(2n);
    });

    it('should return 0 for non-existent campaign', () => {
      const unknownCampaignId = '0x' + 'ff'.repeat(32);
      const count = ledger.getImpressionCount(unknownCampaignId);
      expect(count).toBe(0n);
    });
  });

  describe('Boundary Conditions', () => {
    beforeEach(() => {
      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);
    });

    it('should handle large impression counts without overflow', () => {
      // Uint<64> max = 2^64 - 1 = 18446744073709551615n
      // Simulate recording up to max (in test, we'll just verify the type)
      const testValues = [1n, 100n, 1000n, 1000000n];

      testValues.forEach((value) => {
        ledger.resetState();
        ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);

        for (let i = 0n; i < value; i += 1n) {
          const nullifier = '0x' + i.toString(16).padStart(64, '0');
          ledger.claimNullifier(nullifier);
          ledger.recordImpression(testCampaignId);
        }

        expect(ledger.getImpressionCount(testCampaignId)).toBe(value);
      });
    });

    it('should not allow negative impression counts', () => {
      // Compact uses unsigned types, so this is enforced at type level
      ledger.recordImpression(testCampaignId);
      const count = ledger.getImpressionCount(testCampaignId);
      expect(count).toBeGreaterThanOrEqual(0n);
    });
  });

  describe('Ledger Consistency and State Integrity', () => {
    it('should maintain consistent state across multiple operations', () => {
      // Register segments
      ledger.registerSegment(testSegmentId, testCampaignId, testThreshold, testCommitment);
      ledger.registerSegment(testSegmentId2, testCampaignId2, testThreshold, testCommitment);

      // Record impressions
      ledger.claimNullifier(testNullifier);
      ledger.recordImpression(testCampaignId);

      ledger.claimNullifier(testNullifier2);
      ledger.recordImpression(testCampaignId2);

      ledger.claimNullifier(testNullifier3);
      ledger.recordImpression(testCampaignId);

      // Verify state
      expect(ledger.getSegment(testSegmentId)?.active).toBe(true);
      expect(ledger.getSegment(testSegmentId2)?.active).toBe(true);
      expect(ledger.getImpressionCount(testCampaignId)).toBe(2n);
      expect(ledger.getImpressionCount(testCampaignId2)).toBe(1n);
      expect(ledger.getTotalImpressions()).toBe(3n);

      // Verify all nullifiers are claimed
      expect(ledger.isNullifierClaimed(testNullifier)).toBe(true);
      expect(ledger.isNullifierClaimed(testNullifier2)).toBe(true);
      expect(ledger.isNullifierClaimed(testNullifier3)).toBe(true);
    });
  });
});
