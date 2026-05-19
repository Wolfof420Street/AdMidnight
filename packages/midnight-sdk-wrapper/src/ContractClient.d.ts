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
export declare function deployAdContract(providers: MidnightProviders, config: ContractDeployConfig): Promise<DeployedContractHandle>;
export declare function connectToContract(providers: MidnightProviders, contractAddress: string, compiledContractModule: string, privateStateId: string): Promise<DeployedContractHandle>;
//# sourceMappingURL=ContractClient.d.ts.map