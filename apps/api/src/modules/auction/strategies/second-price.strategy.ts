/**
 * SecondPriceStrategy — Vickrey (second-price) auction.
 *
 * OCP: New auction types (first-price, Dutch) implement IAuctionStrategy
 *      without modifying AuctionEngine.
 * SRP: This class only computes the winner — no I/O, no logging, no caching.
 */
import type { IAuctionStrategy, AdvertiserId } from '@admidnight/shared';

export class SecondPriceStrategy implements IAuctionStrategy {
  readonly name = 'second-price-vickrey';

  determineWinner(bids: Map<AdvertiserId, bigint>): {
    winnerId: AdvertiserId;
    winningBid: bigint;
    priceToPay: bigint;
  } {
    if (bids.size === 0) throw new Error('Cannot determine winner: no bids');

    const sorted = [...bids.entries()].sort(
      ([, a], [, b]) => (b > a ? 1 : b < a ? -1 : 0),
    );

    const [winnerId, highestBid] = sorted[0];
    const secondHighest = sorted.length > 1 ? sorted[1][1] : highestBid;

    return {
      winnerId,
      winningBid: highestBid,
      priceToPay: secondHighest,
    };
  }
}
