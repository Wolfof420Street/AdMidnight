import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

type BidRow = {
  advertiser_id: string;
  actual_bid: string | null;
};

@Injectable()
export class BidRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveCommitment(params: {
    advertiserId: string;
    campaignId: string;
    commitmentHash: string;
  }): Promise<void> {
    const now = new Date();
    await this.prisma.bid.create({
      data: {
        id: randomUUID(),
        campaignId: params.campaignId,
        advertiserId: params.advertiserId,
        commitmentHash: params.commitmentHash,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async getCommitment(advertiserId: string, campaignId: string): Promise<string | null> {
    const row = await this.prisma.bid.findFirst({
      where: { advertiserId, campaignId },
      select: { commitmentHash: true },
    });

    return row?.commitmentHash ?? null;
  }

  async revealBid(params: {
    advertiserId: string;
    campaignId: string;
    actualBid: string;
    nonce: string;
  }): Promise<void> {
    await this.prisma.bid.updateMany({
      where: { advertiserId: params.advertiserId, campaignId: params.campaignId },
      data: { actualBid: params.actualBid, nonce: params.nonce, revealedAt: new Date(), updatedAt: new Date() },
    });
  }

  async listRevealedBids(campaignId: string): Promise<Map<string, bigint>> {
    const rows = await this.prisma.bid.findMany({
      where: { campaignId, actualBid: { not: null } },
      select: { advertiserId: true, actualBid: true },
    });

    return new Map(rows.map((r: { advertiserId: string; actualBid: string | null }) => [r.advertiserId, BigInt(r.actualBid as string)]));
  }

  async markRevealed(advertiserId: string, campaignId: string, won: boolean): Promise<void> {
    await this.prisma.bid.updateMany({
      where: { advertiserId, campaignId },
      data: { won, updatedAt: new Date() },
    });
  }

  async getRevealData(advertiserId: string, campaignId: string): Promise<{
    actualBid: string;
    nonce: string;
  } | null> {
    const row = await this.prisma.bid.findFirst({
      where: { advertiserId, campaignId },
      select: { actualBid: true, nonce: true },
    });

    if (!row?.actualBid || !row.nonce) return null;
    return { actualBid: row.actualBid, nonce: row.nonce };
  }

  async purgeLosingBids(campaignId: string, winnerId: string): Promise<void> {
    await this.prisma.bid.deleteMany({ where: { campaignId, NOT: { advertiserId: winnerId } } as any });
  }
}
