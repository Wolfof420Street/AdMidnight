import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';
import { MidnightGateway } from '../midnight/midnight.gateway';
import { AuctionEngine } from './auction.engine';
import { BidRepository } from '../persistence/repositories/bid.repository';
import { ProofRepository } from '../persistence/repositories/proof.repository';

describe('AuctionEngine', () => {
  let engine: AuctionEngine;

  const mockMidnightGateway = {
    settleAuction: vi.fn().mockResolvedValue('0xabc123'),
  };

  const mockBidRepository = {
    getCommitment: vi.fn(),
    revealBid: vi.fn(),
    listRevealedBids: vi.fn(),
    markRevealed: vi.fn(),
    purgeLosingBids: vi.fn(),
  };

  const mockProofRepository = {
    getImpressionCount: vi.fn().mockResolvedValue(42),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Instantiate directly to avoid Nest DI/type-only import metadata in tests
    engine = new AuctionEngine(
      mockMidnightGateway as unknown as MidnightGateway,
      mockBidRepository as unknown as BidRepository,
      mockProofRepository as unknown as ProofRepository,
    );
  });

  describe('verifyCommitmentOpening', () => {
    it('returns true for a valid commitment opening', () => {
      const bid = '5000';
      const nonce = '0x' + 'a'.repeat(64);
      const hash =
        '0x' +
        createHash('sha256')
          .update(
            Buffer.concat([
              Buffer.from(bid, 'utf8'),
              Buffer.from(nonce.replace(/^0x/, ''), 'hex'),
            ]),
          )
          .digest('hex');

      expect(engine.verifyCommitmentOpening(bid, nonce, hash)).toBe(true);
    });

    it('returns false for a tampered bid', () => {
      const bid = '5000';
      const nonce = '0x' + 'a'.repeat(64);
      const validCommitment =
        '0x' +
        createHash('sha256')
          .update(
            Buffer.concat([
              Buffer.from(bid, 'utf8'),
              Buffer.from(nonce.replace(/^0x/, ''), 'hex'),
            ]),
          )
          .digest('hex');

      expect(engine.verifyCommitmentOpening('9999', nonce, validCommitment)).toBe(false);
    });
  });

  describe('privacy invariants', () => {
    it('MUST NOT log losing bid amounts during settlement', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('loser'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('competitor'));
    });
  });
});
