/**
 * CampaignService — business logic for campaigns
 * No Prisma client here; only calls CampaignRepository
 * Called by: campaign routes
 */
import { CampaignRepository } from '../repositories';

export class CampaignService {
  constructor(private campaignRepository: CampaignRepository) {}

  async createCampaign(data: {
    advertiserId: string;
    name: string;
    description?: string;
    centroid: number[];
    budgetUsd: number;
  }) {
    // Validate centroid is 128-dimensional
    if (!data.centroid || data.centroid.length !== 128) {
      throw new Error('Centroid must be 128-dimensional vector');
    }

    // Validate budget
    if (data.budgetUsd <= 0) {
      throw new Error('Budget must be positive');
    }

    return this.campaignRepository.create(data);
  }

  async getCampaignById(id: string) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new Error(`Campaign not found: ${id}`);
    }
    return campaign;
  }

  async getAdvertiserCampaigns(advertiserId: string) {
    return this.campaignRepository.findByAdvertiserId(advertiserId);
  }

  async getCampaignAnalytics(campaignId: string) {
    const analytics = await this.campaignRepository.getAnalytics(campaignId);
    if (!analytics) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    return analytics;
  }

  async pauseCampaign(id: string) {
    return this.campaignRepository.update(id, { status: 'PAUSED' });
  }

  async resumeCampaign(id: string) {
    return this.campaignRepository.update(id, { status: 'ACTIVE' });
  }
}
