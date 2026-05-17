/**
 * AuctionRepository — wraps Prisma Auction and Bid queries
 * Single responsibility: translate domain auction queries to Prisma
 * Used by: AuctionService
 */
import { PrismaClient } from '@prisma/client';

export class AuctionRepository {
  constructor(private prisma: PrismaClient) {}

  async createAuction(data: {
    campaignId: string;
    startTime: Date;
    endTime: Date;
    impairmentValue: number;
  }) {
    return this.prisma.auction.create({
      data: {
        campaignId: data.campaignId,
        startTime: data.startTime,
        endTime: data.endTime,
        impairmentValue: data.impairmentValue,
        status: 'OPEN',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.auction.findUnique({
      where: { id },
      include: { bids: true },
    });
  }

  async findByCampaignId(campaignId: string) {
    return this.prisma.auction.findMany({
      where: { campaignId },
      orderBy: { startTime: 'desc' },
      include: { bids: true },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.auction.update({
      where: { id },
      data: { status },
    });
  }

  async addBid(data: {
    auctionId: string;
    advertiserId: string;
    amountUsd: number;
    nullifier: string;
    sealedBid: string; // JSON-encoded sealed bid
  }) {
    return this.prisma.bid.create({
      data: {
        auctionId: data.auctionId,
        advertiserId: data.advertiserId,
        amountUsd: data.amountUsd,
        nullifier: data.nullifier,
        sealedBid: data.sealedBid,
        status: 'COMMITTED',
      },
    });
  }

  async findBidByNullifier(nullifier: string) {
    return this.prisma.bid.findUnique({
      where: { nullifier },
    });
  }

  async updateBidStatus(id: string, status: string) {
    return this.prisma.bid.update({
      where: { id },
      data: { status },
    });
  }

  async getWinningBid(auctionId: string) {
    return this.prisma.bid.findFirst({
      where: {
        auctionId,
        status: 'REVEALED',
      },
      orderBy: { amountUsd: 'desc' },
    });
  }

  async getBidsByAuctionId(auctionId: string) {
    return this.prisma.bid.findMany({
      where: { auctionId },
      orderBy: { amountUsd: 'desc' },
    });
  }
}
