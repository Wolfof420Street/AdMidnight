/**
 * PublisherImpressionRepository — wraps Prisma PublisherImpression queries
 * Single responsibility: translate domain impression queries to Prisma
 * Used by: PublisherService
 */
import { PrismaClient } from '@prisma/client';

export class PublisherImpressionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Register impression for a campaign
   * Called when publisher detects user matches audience segment
   */
  async registerImpression(data: {
    publisherId: string;
    campaignId: string;
    userId: string;
    timestamp: Date;
  }) {
    return this.prisma.publisherImpression.create({
      data: {
        publisherId: data.publisherId,
        campaignId: data.campaignId,
        userId: data.userId,
        timestamp: data.timestamp,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.publisherImpression.findUnique({
      where: { id },
    });
  }

  async findByPublisherId(publisherId: string) {
    return this.prisma.publisherImpression.findMany({
      where: { publisherId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getPublisherRevenue(publisherId: string) {
    const impressions = await this.prisma.publisherImpression.findMany({
      where: { publisherId },
      include: { campaign: true },
    });

    // Calculate revenue based on impressions and campaign budgets
    let totalRevenue = 0;
    const campaignCounts: Record<string, number> = {};

    impressions.forEach((imp) => {
      campaignCounts[imp.campaignId] = (campaignCounts[imp.campaignId] || 0) + 1;
    });

    // Revenue = (impressions for campaign / total impressions) * budget
    // This is a simplified model; real implementation may differ
    for (const [campaignId, count] of Object.entries(campaignCounts)) {
      const campaign = impressions.find((i) => i.campaignId === campaignId)?.campaign;
      if (campaign) {
        const totalCampaignImpressions = await this.prisma.publisherImpression.count({
          where: { campaignId },
        });
        const revenue = (count / totalCampaignImpressions) * campaign.budgetUsd;
        totalRevenue += revenue;
      }
    }

    return {
      publisherId,
      totalImpressions: impressions.length,
      totalRevenue,
      byCampaign: campaignCounts,
    };
  }

  async countImpressionsForCampaign(campaignId: string): Promise<number> {
    return this.prisma.publisherImpression.count({
      where: { campaignId },
    });
  }

  async countImpressionsForPublisher(publisherId: string): Promise<number> {
    return this.prisma.publisherImpression.count({
      where: { publisherId },
    });
  }
}
