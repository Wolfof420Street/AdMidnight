/**
 * Core domain types for the AdMidnight protocol.
 * These are pure TypeScript — no framework dependencies.
 */

export type ContractAddressHex = string & {
  readonly _brand: 'ContractAddressHex';
};
export type NullifierHex = string & { readonly _brand: 'NullifierHex' };
export type TxHashHex = string & { readonly _brand: 'TxHashHex' };
export type JubJubFieldElement = bigint & {
  readonly _brand: 'JubJubFieldElement';
};

const JUBJUB_ORDER =
  2736030358979909402780800718157159386076813972158567259200215660948447373041n;
const EMBEDDING_SCALE = 1_048_576n;

export function scaleToField(value: number): JubJubFieldElement {
  const scaled = BigInt(Math.round(value * Number(EMBEDDING_SCALE)));
  return (((scaled % JUBJUB_ORDER) + JUBJUB_ORDER) %
    JUBJUB_ORDER) as JubJubFieldElement;
}

export type BehavioralEmbedding = readonly number[] & { length: 128 };

export const INTEREST_CATEGORIES = [
  'SPORTS',
  'TECH',
  'FINANCE',
  'HEALTH',
  'TRAVEL',
  'FASHION',
  'GAMING',
  'FOOD',
  'AUTO',
  'ENTERTAINMENT',
] as const;

export type InterestCategory = (typeof INTEREST_CATEGORIES)[number];

export interface PrivateUserProfile {
  readonly interestEmbedding: JubJubFieldElement[];
  readonly topCategories: InterestCategory[];
  readonly engagementScore: number;
}

export interface AdCreative {
  readonly id: ContractAddressHex;
  readonly campaignId: ContractAddressHex;
  readonly title: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly clickUrl: string;
  readonly advertiserName: string;
}

export interface TargetingSegment {
  readonly id: ContractAddressHex;
  readonly campaignId: ContractAddressHex;
  readonly centroid: JubJubFieldElement[];
  readonly similarityThreshold: number;
  readonly targetCategories: InterestCategory[];
}

export interface Campaign {
  readonly id: ContractAddressHex;
  readonly advertiserId: ContractAddressHex;
  readonly segment: TargetingSegment;
  readonly creative: AdCreative;
  readonly budgetMidnight: bigint;
  readonly cpmBidMidnight: bigint;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly status: CampaignStatus;
}

export type CampaignStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'SETTLED';

export interface ZKProof {
  readonly proofBytes: string;
  readonly publicInputs: ZKPublicInputs;
  readonly circuit: CircuitName;
  readonly generatedAt: Date;
}

export interface ZKPublicInputs {
  readonly segmentId: ContractAddressHex;
  readonly campaignId: ContractAddressHex;
  readonly isMatch: boolean;
  readonly nullifier: NullifierHex;
}

export type CircuitName =
  | 'proveSegmentMatch'
  | 'settleAuction'
  | 'claimReward'
  | 'commitBid';

export interface BidCommitment {
  readonly advertiserId: ContractAddressHex;
  readonly campaignId: ContractAddressHex;
  readonly commitmentHash: TxHashHex;
  readonly submittedAt: Date;
}

export interface AuctionResult {
  readonly campaignId: ContractAddressHex;
  readonly winnerAdvertiserId: ContractAddressHex;
  readonly impressionCount: number;
  readonly totalSpend: bigint;
  readonly settledAt: Date;
  readonly settlementTxHash: TxHashHex;
}

export interface UserReward {
  readonly nullifier: NullifierHex;
  readonly campaignId: ContractAddressHex;
  readonly amountMidnight: bigint;
  readonly status: 'PENDING' | 'CLAIMED' | 'EXPIRED';
  readonly expiresAt: Date;
}
