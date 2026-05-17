export const PROTOCOL_CONSTANTS = {
  PUBLISHER_REVENUE_SHARE: 0.7,
  USER_REWARD_SHARE: 0.2,
  PROTOCOL_FEE_SHARE: 0.1,
  EMBEDDING_DIMENSIONS: 128,
  MAX_BIDS_PER_AUCTION: 10,
  PROOF_EXPIRY_SECONDS: 300,
  REWARD_EXPIRY_DAYS: 30,
} as const;

export const CONTRACT_CIRCUITS = {
  PROVE_SEGMENT_MATCH: 'proveSegmentMatch',
  COMMIT_BID: 'commitBid',
  SETTLE_AUCTION: 'settleAuction',
  CLAIM_REWARD: 'claimReward',
} as const;

export const API_ROUTES = {
  USER_PROOF_MATCH: '/user/proof/match',
  USER_REWARDS_CLAIM: '/user/rewards/claim',
  USER_SEGMENTS_AVAILABLE: '/user/segments/available',
  ADVERTISER_CAMPAIGN_CREATE: '/advertiser/campaign/create',
  ADVERTISER_CAMPAIGN_LIST: '/advertiser/campaign',
  ADVERTISER_CAMPAIGN_ANALYTICS: '/advertiser/campaign/:id/analytics',
  ADVERTISER_AUCTION_BID: '/advertiser/auction/bid',
  ADVERTISER_AUCTION_REVEAL: '/advertiser/auction/reveal',
  ADVERTISER_AUCTION_RESULT: '/advertiser/auction/:id/result',
  PUBLISHER_IMPRESSION_REGISTER: '/publisher/impression/register',
  PUBLISHER_REVENUE: '/publisher/revenue/dashboard',
  INTERNAL_PROOF_VALIDATE: '/internal/proof/validate',
  INTERNAL_MIDNIGHT_RELAY: '/internal/midnight/relay',
} as const;

