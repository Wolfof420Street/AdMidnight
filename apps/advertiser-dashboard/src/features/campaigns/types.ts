/**
 * Campaign feature types — colocated with the feature, not scattered globally.
 * DRY: single source of form data shape.
 */
import type { InterestCategory } from '@admidnight/shared';

export interface CreateCampaignFormData {
  targetCategories: InterestCategory[];
  similarityThreshold: number;
  title: string;
  description: string;
  imageUrl: string;
  clickUrl: string;
  advertiserName: string;
  budgetMidnight: string;
  cpmBidMidnight: string;
  startTime: string;
  endTime: string;
}

export type CampaignFormStep = 'segment' | 'creative' | 'budget' | 'review';
export const CAMPAIGN_FORM_STEPS: CampaignFormStep[] = ['segment', 'creative', 'budget', 'review'];
