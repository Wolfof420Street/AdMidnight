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
import type { ZKProof, Campaign, NullifierHex, TxHashHex } from '../domain/ad.types.js';
export type TxHash = TxHashHex;
export type CampaignId = string & {
    readonly _brand: 'CampaignId';
};
export type AdvertiserId = string & {
    readonly _brand: 'AdvertiserId';
};
export declare function asTxHash(s: string): TxHash;
export declare function asNullifier(s: string): NullifierHex;
export declare function asCampaignId(s: string): CampaignId;
export declare function asAdvertiserId(s: string): AdvertiserId;
export interface IProofPort {
    verify(proof: ZKProof): Promise<boolean>;
    relay(proof: ZKProof): Promise<TxHash>;
    isNullifierSpent(nullifier: NullifierHex): Promise<boolean>;
}
export interface IAuctionPort {
    commitBid(advertiserId: AdvertiserId, campaignId: CampaignId, commitmentHash: string): Promise<TxHash>;
    closeBidding(campaignId: CampaignId): Promise<TxHash>;
    settle(campaignId: CampaignId, winnerId: AdvertiserId, settlementProof: ZKProof): Promise<TxHash>;
    getAuctionState(campaignId: CampaignId): Promise<'OPEN' | 'CLOSED' | 'SETTLED' | 'UNKNOWN'>;
}
export interface IRewardPort {
    escrow(nullifier: NullifierHex, amountMidnight: bigint): Promise<void>;
    claim(nullifier: NullifierHex, claimProof: ZKProof): Promise<TxHash>;
    getPendingAmount(nullifier: NullifierHex): Promise<bigint>;
}
export interface IIndexerQueryPort {
    getImpressionCount(campaignId: CampaignId): Promise<number>;
    getContractState<T>(contractAddress: string, field: string): Promise<T>;
    subscribeToContractEvents(contractAddress: string, onEvent: (event: unknown) => void): () => void;
}
export interface ICampaignRepository {
    create(campaign: Omit<Campaign, 'id'>): Promise<Campaign>;
    findById(id: CampaignId): Promise<Campaign | null>;
    findByAdvertiser(advertiserId: AdvertiserId): Promise<Campaign[]>;
    findActive(): Promise<Campaign[]>;
    updateStatus(id: CampaignId, status: Campaign['status']): Promise<Campaign>;
    recordMidnightTx(id: CampaignId, txHash: TxHash): Promise<void>;
}
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
    getProtocolStats(): Promise<{
        totalProofs: number;
        totalMatches: number;
        activeCampaigns: number;
    }>;
}
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
export interface IAuctionStrategy {
    readonly name: string;
    determineWinner(bids: Map<AdvertiserId, bigint>): {
        winnerId: AdvertiserId;
        winningBid: bigint;
        priceToPay: bigint;
    };
}
export interface IDomainEventBus {
    publish(event: DomainEvent): void;
    subscribe<T extends DomainEvent>(eventType: T['type'], handler: (event: T) => void): () => void;
}
export type DomainEvent = ProofRelayedEvent | AuctionSettledEvent | RewardEscrowedEvent | CampaignCreatedEvent;
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
//# sourceMappingURL=index.d.ts.map