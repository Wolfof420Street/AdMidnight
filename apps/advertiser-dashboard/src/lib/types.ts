export interface CreateCampaignRequestDto {
  segmentConfig: {
    centroid: number[];
    similarityThreshold: number;
    targetCategories: string[];
  };
  creative: {
    title: string;
    description: string;
    imageUrl: string;
    clickUrl: string;
    advertiserName: string;
  };
  budgetMidnight: string;
  cpmBidMidnight: string;
  startTime: string;
  endTime: string;
}
