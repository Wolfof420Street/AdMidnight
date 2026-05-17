/**
 * AdMidnight Midnight Provider Factory
 *
 * Assembles the 7-provider MidnightProviders object using the real SDK.
 */

import {
  setNetworkId,
  type NetworkId,
} from '@midnight-ntwrk/midnight-js-network-id';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { nodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { pinoLoggerProvider } from '@midnight-ntwrk/midnight-js-logger-provider';
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

export function initMidnightNetwork(networkId: MidnightNetworkId): void {
  setNetworkId(networkId);
}

export async function buildMidnightProviders(
  config: MidnightProviderConfig,
): Promise<MidnightProviders> {
  if (config.privateStatePassword.length < 16) {
    throw new Error('privateStatePassword must be at least 16 characters (SDK requirement)');
  }

  const privateStateProvider = await levelPrivateStateProvider({
    privateStateStoreName: config.privateStateStoreName,
    privateStoragePasswordProvider: () => config.privateStatePassword,
    accountId: config.accountId,
  });

  const publicDataProvider = indexerPublicDataProvider(
    config.indexerGraphQlUrl,
    config.indexerWsUrl,
  );

  const proofProvider = httpClientProofProvider(config.proofServerUrl);

  const zkConfigProvider = nodeZkConfigProvider(config.zkArtifactsDir);

  const loggerProvider = pinoLoggerProvider();

  return {
    privateStateProvider,
    publicDataProvider,
    proofProvider,
    zkConfigProvider,
    loggerProvider,
  } as unknown as MidnightProviders;
}
