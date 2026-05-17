/**
 * Port interfaces — the boundary between domain and infrastructure.
 *
 * SOLID application:
 *   D — Domain services depend on these interfaces (DIP).
 *   I — Each interface is focused on one concern (ISP).
 *   O — New relay implementations extend without modifying callers (OCP).
 *
 * Nothing in this file imports from NestJS, Midnight SDK, Prisma, or Redis.
 * These are pure TypeScript interface definitions.
 */

import type {
  ZKProof,
  Campaign,
  BidCommitment,
  AuctionResult,
  NullifierHex,
  TxHashHex,
} from '../domain/ad.types.js';

// ─── Branded types (from CLAUDE.md: "Use branded types") ─────────────────────

export type TxHash = TxHashHex;
export type CampaignId = string & { readonly _brand: 'CampaignId' };
export type AdvertiserId = string & { readonly _brand: 'AdvertiserId' };

export function asTxHash(s: string): TxHash {
  return s as TxHash;
}
export function asNullifier(s: string): NullifierHex {
  return s as NullifierHex;
}
export function asCampaignId(s: string): CampaignId {
  return s as CampaignId;
}
export function asAdvertiserId(s: string): AdvertiserId {
  return s as AdvertiserId;
}

// ─── Proof Port ───────────────────────────────────────────────────────────────

export interface IProofPort {
  verify(proof: ZKProof): Promise<boolean>;
  relay(proof: ZKProof): Promise<TxHash>;
  isNullifierSpent(nullifier: NullifierHex): Promise<boolean>;
}

// ─── Auction Port ─────────────────────────────────────────────────────────────

export interface IAuctionPort {
  commitBid(advertiserId: AdvertiserId, campaignId: CampaignId, commitmentHash: string): Promise<TxHash>;
  closeBidding(campaignId: CampaignId): Promise<TxHash>;
  settle(campaignId: CampaignId, winnerId: AdvertiserId, settlementProof: ZKProof): Promise<TxHash>;
  getAuctionState(campaignId: CampaignId): Promise<'OPEN' | 'CLOSED' | 'SETTLED' | 'UNKNOWN'>;
}

// ─── Reward Port ──────────────────────────────────────────────────────────────

export interface IRewardPort {
  escrow(nullifier: NullifierHex, amountMidnight: bigint): Promise<void>;
  claim(nullifier: NullifierHex, claimProof: ZKProof): Promise<TxHash>;
  getPendingAmount(nullifier: NullifierHex): Promise<bigint>;
}

// ─── Indexer Query Port ───────────────────────────────────────────────────────

export interface IIndexerQueryPort {
  getImpressionCount(campaignId: CampaignId): Promise<number>;
  getContractState<T>(contractAddress: string, field: string): Promise<T>;
  subscribeToContractEvents(contractAddress: string, onEvent: (event: unknown) => void): () => void;
}

// ─── Campaign Repository Port ─────────────────────────────────────────────────

export interface ICampaignRepository {
  create(campaign: Omit<Campaign, 'id'>): Promise<Campaign>;
  findById(id: CampaignId): Promise<Campaign | null>;
  findByAdvertiser(advertiserId: AdvertiserId): Promise<Campaign[]>;
  findActive(): Promise<Campaign[]>;
  updateStatus(id: CampaignId, status: Campaign['status']): Promise<Campaign>;
  recordMidnightTx(id: CampaignId, txHash: TxHash): Promise<void>;
}

// ─── Proof Repository Port ────────────────────────────────────────────────────

export interface IProofRepository {
  record(params: {
    campaignId: CampaignId;
    nullifier: NullifierHex;
    proofHash: string;
    isMatch: boolean;
    relayTxHash?: TxHash;
  }): Promise<void>;
  isNullifierUsed(nullifier: NullifierHex): Promise<boolean>;
  getImpressionCount(campaignId: CampaignId): Promise<number>;
  getProtocolStats(): Promise<{ totalProofs: number; totalMatches: number; activeCampaigns: number }>;
}

// ─── Bid Repository Port ──────────────────────────────────────────────────────

export interface IBidRepository {
  saveCommitment(params: {
    advertiserId: AdvertiserId;
    campaignId: CampaignId;
    commitmentHash: string;
  }): Promise<void>;
  getCommitment(advertiserId: AdvertiserId, campaignId: CampaignId): Promise<string | null>;
  markRevealed(advertiserId: AdvertiserId, campaignId: CampaignId, won: boolean): Promise<void>;
  purgeLosingBids(campaignId: CampaignId, winnerId: AdvertiserId): Promise<void>;
}

// ─── Auction Strategy (Strategy Pattern / OCP) ───────────────────────────────

export interface IAuctionStrategy {
  readonly name: string;
  determineWinner(bids: Map<AdvertiserId, bigint>): {
    winnerId: AdvertiserId;
    winningBid: bigint;
    priceToPay: bigint;
  };
}

// ─── Domain Events ────────────────────────────────────────────────────────────

export interface IDomainEventBus {
  publish(event: DomainEvent): void;
  subscribe<T extends DomainEvent>(eventType: T['type'], handler: (event: T) => void): () => void;
}

export type DomainEvent =
  | ProofRelayedEvent
  | AuctionSettledEvent
  | RewardEscrowedEvent
  | CampaignCreatedEvent;

export interface ProofRelayedEvent {
  readonly type: 'ProofRelayed';
  readonly campaignId: CampaignId;
  readonly nullifier: NullifierHex;
  readonly txHash: TxHash;
  readonly timestamp: Date;
}

export interface AuctionSettledEvent {
  readonly type: 'AuctionSettled';
  readonly campaignId: CampaignId;
  readonly winnerAdvertiserId: AdvertiserId;
  readonly txHash: TxHash;
  readonly timestamp: Date;
}

export interface RewardEscrowedEvent {
  readonly type: 'RewardEscrowed';
  readonly nullifier: NullifierHex;
  readonly amountMidnight: bigint;
  readonly timestamp: Date;
}

export interface CampaignCreatedEvent {
  readonly type: 'CampaignCreated';
  readonly campaignId: CampaignId;
  readonly advertiserId: AdvertiserId;
  readonly timestamp: Date;
}
