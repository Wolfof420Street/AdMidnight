export declare const PROTOCOL_CONSTANTS: {
    readonly PUBLISHER_REVENUE_SHARE: 0.7;
    readonly USER_REWARD_SHARE: 0.2;
    readonly PROTOCOL_FEE_SHARE: 0.1;
    readonly EMBEDDING_DIMENSIONS: 128;
    readonly MAX_BIDS_PER_AUCTION: 10;
    readonly PROOF_EXPIRY_SECONDS: 300;
    readonly REWARD_EXPIRY_DAYS: 30;
};
export declare const CONTRACT_CIRCUITS: {
    readonly PROVE_SEGMENT_MATCH: "proveSegmentMatch";
    readonly COMMIT_BID: "commitBid";
    readonly SETTLE_AUCTION: "settleAuction";
    readonly CLAIM_REWARD: "claimReward";
};
export declare const API_ROUTES: {
    readonly USER_PROOF_MATCH: "/user/proof/match";
    readonly USER_REWARDS_CLAIM: "/user/rewards/claim";
    readonly USER_SEGMENTS_AVAILABLE: "/user/segments/available";
    readonly ADVERTISER_CAMPAIGN_CREATE: "/advertiser/campaign/create";
    readonly ADVERTISER_CAMPAIGN_LIST: "/advertiser/campaign";
    readonly ADVERTISER_CAMPAIGN_ANALYTICS: "/advertiser/campaign/:id/analytics";
    readonly ADVERTISER_AUCTION_BID: "/advertiser/auction/bid";
    readonly ADVERTISER_AUCTION_REVEAL: "/advertiser/auction/reveal";
    readonly ADVERTISER_AUCTION_RESULT: "/advertiser/auction/:id/result";
    readonly PUBLISHER_IMPRESSION_REGISTER: "/publisher/impression/register";
    readonly PUBLISHER_REVENUE: "/publisher/revenue/dashboard";
    readonly INTERNAL_PROOF_VALIDATE: "/internal/proof/validate";
    readonly INTERNAL_MIDNIGHT_RELAY: "/internal/midnight/relay";
};
//# sourceMappingURL=index.d.ts.map