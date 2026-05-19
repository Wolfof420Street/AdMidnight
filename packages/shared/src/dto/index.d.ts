export interface LoginDto {
    email: string;
    password: string;
}
export interface SessionDto {
    userId: string;
    email: string;
    role: 'USER' | 'ADVERTISER' | 'PUBLISHER' | 'INTERNAL';
    token?: string;
}
export interface LogoutResponseDto {
    cleared: boolean;
}
export interface CreateCampaignDto {
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
export interface CampaignDto {
    id: string;
    title: string;
    description: string;
    status: 'ACTIVE' | 'PAUSED' | 'ENDED';
    budgetMidnight: string;
    cpmBidMidnight: string;
    segmentCentroid: number[];
    similarityThreshold: number;
    targetCategories: string[];
    startTime: string;
    endTime: string;
}
export interface CampaignResponseDto {
    id: string;
    segment: {
        id: string;
        centroid: number[];
        similarityThreshold: number;
        targetCategories: string[];
    };
    creative: {
        id: string;
        title: string;
        description: string;
        imageUrl: string;
        clickUrl: string;
        advertiserName: string;
    };
    status: string;
    budgetMidnight: string;
    startTime: string;
    endTime: string;
}
export interface CampaignDetailResponseDto extends CampaignResponseDto {
    auctionStatus: 'OPEN' | 'CLOSED' | 'SETTLED';
    winnerAdvertiserId?: string;
    settlementTxHash?: string;
}
export interface AnalyticsDto {
    campaignId: string;
    impressions: number;
    bids: number;
    budgetRemaining: string;
    ctr: number;
    averageCpm: string;
}
export interface PaginatedResponseDto<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
export interface SubmitMatchProofDto {
    proofBytes: string;
    publicInputs: {
        segmentId: string;
        campaignId: string;
        isMatch: boolean;
        nullifier: string;
    };
    generatedAt: string;
}
export interface ProofResultDto {
    success: boolean;
    proofId: string;
    rewardEscrow: {
        amount: string;
        escrowedAt: string;
    };
    relayTxHash?: string;
    error?: string;
}
export interface ProofValidationDto {
    proofBytes: string;
    publicInputs: {
        segmentId: string;
        campaignId: string;
        isMatch: boolean;
        nullifier: string;
    };
}
export interface ProofValidationResultDto {
    valid: boolean;
    nullifier: string;
    campaignId: string;
    isMatch: boolean;
}
export interface ProofVerificationResponseDto {
    valid: boolean;
    campaignId: string;
    rewardEscrow: string;
    relayTxHash?: string;
}
export interface ClaimRewardDto {
    nullifier: string;
    zkProof: string;
}
export interface RewardClaimResultDto {
    success: boolean;
    status: 'CLAIMED' | 'PENDING' | 'FAILED';
    amount: string;
    claimTxHash?: string;
    error?: string;
}
export interface RewardClaimResponseDto {
    txHash: string;
    amountMidnight: string;
    status: 'CLAIMED' | 'PENDING' | 'FAILED';
}
export interface PendingRewardDto {
    nullifier: string;
    amount: string;
    campaignId: string;
    escrowedAt: string;
}
export interface SealedBidDto {
    campaignId: string;
    commitmentHash: string;
}
export interface BidReceiptDto {
    bidReceiptId: string;
    campaignId: string;
    status: 'COMMITTED';
    committedAt: string;
}
export interface RevealBidDto {
    campaignId: string;
    actualBid: string;
    nonce: string;
}
export interface AuctionResultDto {
    campaignId: string;
    winnerAdvertiserId: string;
    winningBid: string;
    settlementTxHash: string;
    settledAt: string;
}
export interface AuctionResultResponseDto {
    campaignId: string;
    winnerAdvertiserId: string;
    impressionCount: number;
    totalSpend: string;
    settlementTxHash: string;
    settledAt: string;
}
export interface RegisterImpressionDto {
    nullifier: string;
    proofHash: string;
    campaignId: string;
}
export interface ImpressionReceiptDto {
    success: boolean;
    impressionId: string;
    campaignId: string;
    recordedAt: string;
}
export interface RevenueDashboardDto {
    publisherId: string;
    totalImpressions: number;
    totalPayoutMidnight: string;
    campaignRevenue: Array<{
        campaignId: string;
        impressions: number;
        payout: string;
    }>;
    period: {
        startDate: string;
        endDate: string;
    };
}
export interface SegmentDto {
    segmentId: string;
    campaignId: string;
    centroid: number[];
    similarityThreshold: number;
    targetCategories: string[];
    active: boolean;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    timestamp: string;
    requestId: string;
}
export interface ErrorResponseDto {
    success: false;
    error: {
        message: string;
        code: string;
        statusCode: number;
    };
    timestamp: string;
    requestId: string;
}
//# sourceMappingURL=index.d.ts.map