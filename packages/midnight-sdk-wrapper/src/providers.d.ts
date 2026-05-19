/**
 * AdMidnight Midnight Provider Factory
 *
 * Assembles the 7-provider MidnightProviders object using the real SDK.
 */
import { type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
export type MidnightNetworkId = NetworkId;
export type BackendProviders = MidnightProviders;
export interface MidnightProviderConfig {
    readonly networkId: MidnightNetworkId;
    readonly indexerGraphQlUrl: string;
    readonly indexerWsUrl: string;
    readonly proofServerUrl: string;
    readonly zkArtifactsDir: string;
    readonly privateStateStoreName: string;
    readonly privateStatePassword: string;
    readonly accountId: string;
    readonly nodeUrl?: string;
}
export declare function initMidnightNetwork(networkId: MidnightNetworkId): void;
export declare function buildMidnightProviders(config: MidnightProviderConfig): Promise<MidnightProviders>;
//# sourceMappingURL=providers.d.ts.map