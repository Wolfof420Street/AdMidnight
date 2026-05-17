declare module '@midnight-ntwrk/midnight-js-contracts' {
  export function deployContract(...args: unknown[]): Promise<unknown>;
  export function findDeployedContract(...args: unknown[]): Promise<unknown>;
}

declare module '@midnight-ntwrk/midnight-js-types' {
  export type MidnightProviders = unknown;
}

declare module '@midnight-ntwrk/midnight-js-network-id' {
  export type NetworkId = 'undeployed' | 'devnet' | 'testnet' | 'mainnet';
  export function setNetworkId(networkId: NetworkId): void;
}

declare module '@midnight-ntwrk/midnight-js-level-private-state-provider' {
  export function levelPrivateStateProvider(...args: unknown[]): Promise<unknown>;
}

declare module '@midnight-ntwrk/midnight-js-indexer-public-data-provider' {
  export function indexerPublicDataProvider(...args: unknown[]): unknown;
}

declare module '@midnight-ntwrk/midnight-js-http-client-proof-provider' {
  export function httpClientProofProvider(...args: unknown[]): unknown;
}

declare module '@midnight-ntwrk/midnight-js-node-zk-config-provider' {
  export function nodeZkConfigProvider(...args: unknown[]): unknown;
}

declare module '@midnight-ntwrk/midnight-js-logger-provider' {
  export function pinoLoggerProvider(...args: unknown[]): unknown;
}
