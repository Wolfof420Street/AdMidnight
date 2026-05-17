/**
 * CampaignRepository — wraps Prisma Campaign queries
 * Single responsibility: translate domain queries to Prisma
 * Used by: CampaignService
 */
import { PrismaClient } from '@prisma/client';

export class CampaignRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    advertiserId: string;
    name: string;
    description?: string;
    centroid: number[]; // 128-dimensional vector
    budgetUsd: number;
  }) {
    return this.prisma.campaign.create({
      data: {
        advertiserId: data.advertiserId,
        name: data.name,
        description: data.description,
        centroid: data.centroid,
        budgetUsd: data.budgetUsd,
        status: 'ACTIVE',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.campaign.findUnique({
      where: { id },
    });
  }

  async findByAdvertiserId(advertiserId: string) {
    return this.prisma.campaign.findMany({
      where: { advertiserId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: { status?: string; budgetUsd?: number }) {
    return this.prisma.campaign.update({
      where: { id },
      data,
    });
  }

  async getAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) return null;

    const impressions = await this.prisma.publisherImpression.count({
      where: { campaignId },
    });

    const bids = await this.prisma.bid.findMany({
      where: { campaignId },
      select: { amountUsd: true },
    });

    const totalBidAmount = bids.reduce((sum, bid) => sum + bid.amountUsd, 0);

    return {
      campaignId,
      impressions,
      bids: bids.length,
      totalBidAmount,
      budgetRemaining: campaign.budgetUsd - totalBidAmount,
    };
  }
}
