/**
 * PublisherService — business logic for publishers
 * No Prisma client here; only calls PublisherImpressionRepository
 * Called by: publisher routes
 */
import { PublisherImpressionRepository } from '../repositories';

export class PublisherService {
  constructor(private impressionRepository: PublisherImpressionRepository) {}

  async registerImpression(data: {
    publisherId: string;
    campaignId: string;
    userId: string;
    timestamp: Date;
  }) {
    if (!data.publisherId || !data.campaignId || !data.userId) {
      throw new Error('Missing required fields: publisherId, campaignId, userId');
    }

    return this.impressionRepository.registerImpression(data);
  }

  async getPublisherRevenue(publisherId: string) {
    return this.impressionRepository.getPublisherRevenue(publisherId);
  }

  async getPublisherDashboard(publisherId: string) {
    const revenue = await this.impressionRepository.getPublisherRevenue(publisherId);
    const totalImpressions = await this.impressionRepository.countImpressionsForPublisher(publisherId);

    return {
      publisherId,
      totalImpressions,
      totalRevenue: revenue.totalRevenue,
      averageRevenuePerImpression: totalImpressions > 0 ? revenue.totalRevenue / totalImpressions : 0,
      byCampaign: revenue.byCampaign,
    };
  }

  async getCampaignImpressionCount(campaignId: string) {
    return this.impressionRepository.countImpressionsForCampaign(campaignId);
  }
}
