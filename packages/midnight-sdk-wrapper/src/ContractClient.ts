/**
 * ContractClient — wraps the real Midnight.js contract deployment and invocation API.
 */

import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

export interface DeployedContractHandle {
  readonly address: string;
  readonly callTx: Record<string, (...args: unknown[]) => Promise<unknown>>;
}

export interface ContractDeployConfig {
  readonly compiledContractModule: string;
  readonly privateStateId: string;
  readonly initialPrivateState: Record<string, unknown>;
}

export async function deployAdContract(
  providers: MidnightProviders,
  config: ContractDeployConfig,
): Promise<DeployedContractHandle> {
  const { deployContract } = await import('@midnight-ntwrk/midnight-js-contracts');
  const compiledContract = await import(config.compiledContractModule) as { default: unknown };

  const deployed = await deployContract(providers, {
    compiledContract: compiledContract.default,
    privateStateId: config.privateStateId,
    initialPrivateState: config.initialPrivateState,
  });

  return {
    address: (deployed as any).deployTxData.public.contractAddress,
    callTx: (deployed as any).callTx as Record<string, (...args: unknown[]) => Promise<unknown>>,
  };
}

export async function connectToContract(
  providers: MidnightProviders,
  contractAddress: string,
  compiledContractModule: string,
  privateStateId: string,
): Promise<DeployedContractHandle> {
  const { findDeployedContract } = await import('@midnight-ntwrk/midnight-js-contracts');
  const compiledContract = await import(compiledContractModule) as { default: unknown };

  const found = await findDeployedContract(providers, {
    contractAddress,
    compiledContract: compiledContract.default,
    privateStateId,
    initialPrivateState: {},
  });

  return {
    address: contractAddress,
    callTx: (found as any).callTx as Record<string, (...args: unknown[]) => Promise<unknown>>,
  };
}
