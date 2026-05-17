/**
 * CampaignsApi — all campaign-related API calls in one place.
 * SRP: only campaign API calls live here.
 * DRY: components never call fetch directly.
 */
import { apiFetch } from './client';
import type { CampaignResponseDto } from '@admidnight/shared';
import type { CreateCampaignFormData } from '@/features/campaigns/types';
import { EmbeddingFactory } from '@admidnight/shared';

export const campaignsApi = {
  list: () =>
    apiFetch<CampaignResponseDto[]>('/advertiser/campaign'),

  create: (data: CreateCampaignFormData) => {
    // DRY: centroid generation centralised in shared EmbeddingFactory
    const centroid = EmbeddingFactory.normalise(
      EmbeddingFactory.generateRandomCentroid()
    );
    return apiFetch<CampaignResponseDto>('/advertiser/campaign/create', {
      method: 'POST',
      timeoutMs: 120_000,
      body: {
        segmentConfig: {
          centroid,
          similarityThreshold: data.similarityThreshold,
          targetCategories: data.targetCategories,
        },
        creative: {
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          clickUrl: data.clickUrl,
          advertiserName: data.advertiserName,
        },
        budgetMidnight: data.budgetMidnight,
        cpmBidMidnight: data.cpmBidMidnight,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
  },

  getAnalytics: (campaignId: string) =>
    apiFetch<{ impressions: number; estimatedCtr: number; totalSpend: string }>(
      `/advertiser/campaign/${campaignId}/analytics`,
      { timeoutMs: 45_000 },
    ),
} as const;
