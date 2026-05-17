/**
 * AuctionService — business logic for ad auctions
 * No Prisma client here; only calls AuctionRepository
 * Called by: auction routes
 */
import { AuctionRepository } from '../repositories';

export class AuctionService {
  constructor(private auctionRepository: AuctionRepository) {}

  async createAuction(data: {
    campaignId: string;
    startTime: Date;
    endTime: Date;
    impairmentValue: number;
  }) {
    // Validate times
    if (data.endTime <= data.startTime) {
      throw new Error('End time must be after start time');
    }

    if (data.impairmentValue <= 0 || data.impairmentValue > 1) {
      throw new Error('Impairment value must be between 0 and 1');
    }

    return this.auctionRepository.createAuction(data);
  }

  async getAuctionById(id: string) {
    const auction = await this.auctionRepository.findById(id);
    if (!auction) {
      throw new Error(`Auction not found: ${id}`);
    }
    return auction;
  }

  async getCampaignAuctions(campaignId: string) {
    return this.auctionRepository.findByCampaignId(campaignId);
  }

  async submitBid(data: {
    auctionId: string;
    advertiserId: string;
    amountUsd: number;
    nullifier: string;
    sealedBid: string;
  }) {
    if (data.amountUsd <= 0) {
      throw new Error('Bid amount must be positive');
    }

    return this.auctionRepository.addBid(data);
  }

  async revealBid(auctionId: string, nullifier: string, revealedAmount: number) {
    // TODO: Verify sealed bid matches revealed amount
    // For now, just update status to REVEALED
    const bid = await this.auctionRepository.findBidByNullifier(nullifier);
    if (!bid) {
      throw new Error(`Bid not found: ${nullifier}`);
    }

    return this.auctionRepository.updateBidStatus(bid.id, 'REVEALED');
  }

  async settleAuction(auctionId: string) {
    const winningBid = await this.auctionRepository.getWinningBid(auctionId);
    if (!winningBid) {
      throw new Error('No valid bids to settle');
    }

    await this.auctionRepository.updateStatus(auctionId, 'SETTLED');
    return {
      auctionId,
      winnerBid: winningBid.amountUsd,
      winnerId: winningBid.advertiserId,
    };
  }
}
