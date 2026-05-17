import type {
  OnModuleInit } from '@nestjs/common';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { connectToContract, type DeployedContractHandle } from '@admidnight/midnight-sdk-wrapper';
import type { ZKProof } from '@admidnight/shared';
import { resolve } from 'path';
import type { MidnightProviderService } from './midnight-provider.service';
import type { ProofCryptoService } from './proof-crypto.service';

/**
 * Result type for all gateway calls
 * Every method returns this union type (no throws)
 */
export type GatewayResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

@Injectable()
export class MidnightGateway implements OnModuleInit {
  private readonly logger = new Logger(MidnightGateway.name);
  private matchRegistryContract: DeployedContractHandle | null = null;
  private auctionContract: DeployedContractHandle | null = null;
  private rewardContract: DeployedContractHandle | null = null;

  constructor(
    private readonly providerService: MidnightProviderService,
    private readonly config: ConfigService,
    private readonly proofCrypto: ProofCryptoService,
  ) {}

  async onModuleInit(): Promise<void> {
    const managedDir = resolve(
      this.config.get(
        'MIDNIGHT_ZK_ARTIFACTS_DIR',
        '../../packages/zk-circuits/managed',
      ),
    );

    this.matchRegistryContract = await connectToContract(
      this.providerService.getProviders(),
      this.config.getOrThrow<string>('MATCH_REGISTRY_CONTRACT_ADDRESS'),
      `${managedDir}/AdMatchRegistry/index.js`,
      'match-registry-state',
    );

    this.auctionContract = await connectToContract(
      this.providerService.getProviders(),
      this.config.getOrThrow<string>('AUCTION_CONTRACT_ADDRESS'),
      `${managedDir}/AdAuction/index.js`,
      'auction-state',
    );

    this.rewardContract = await connectToContract(
      this.providerService.getProviders(),
      this.config.getOrThrow<string>('REWARD_CONTRACT_ADDRESS'),
      `${managedDir}/UserReward/index.js`,
      'reward-state',
    );

    this.logger.log('Midnight contracts connected');
  }

  async registerSegment(params: {
    segmentId: string;
    campaignId: string;
    similarityThreshold: number;
    segmentCommitment: string;
  }): Promise<string> {
    const contract = this.requireContract(this.matchRegistryContract, 'MatchRegistry');
    // Convert threshold to Field (BigInt in SDK)
    const thresholdField = BigInt(Math.floor(params.similarityThreshold * 1e18));
    const result = (await contract.callTx.registerSegment(
      params.segmentId,
      params.campaignId,
      thresholdField,
      params.segmentCommitment,
    )) as { txHash: string };
    return result.txHash;
  }

  async submitMatchProof(proof: ZKProof): Promise<{
    txHash: string;
    proofHash: string;
    publicInputHash: string;
  }> {
    const contract = this.requireContract(this.matchRegistryContract, 'MatchRegistry');
    const bound = this.proofCrypto.verifyAndBind(proof);
    const result = (await contract.callTx.proveSegmentMatch(
      proof.publicInputs.segmentId,
      proof.publicInputs.campaignId,
      proof.publicInputs.nullifier,
      bound.commitmentHash,
    )) as { txHash: string };

    return {
      txHash: result.txHash,
      proofHash: bound.proofHash,
      publicInputHash: bound.publicInputHash,
    };
  }

  async commitBid(
    advertiserId: string,
    campaignId: string,
    commitmentHash: string,
  ): Promise<string> {
    const contract = this.requireContract(this.auctionContract, 'AdAuction');
    const result = (await contract.callTx.commitBid(
      advertiserId,
      campaignId,
      commitmentHash,
    )) as { txHash: string };
    return result.txHash;
  }

  async lockBudget(
    campaignId: string,
    budgetMidnight: string,
  ): Promise<string> {
    const contract = this.requireContract(this.auctionContract, 'AdAuction');
    const budgetBigInt = BigInt(budgetMidnight);
    const result = (await contract.callTx.lockBudget(
      campaignId,
      budgetBigInt,
    )) as { txHash: string };
    return result.txHash;
  }

  async closeBidding(campaignId: string): Promise<string> {
    const contract = this.requireContract(this.auctionContract, 'AdAuction');
    const result = (await contract.callTx.closeBidding(campaignId)) as { txHash: string };
    return result.txHash;
  }

  async settleAuction(params: {
    campaignId: string;
    winnerId: string;
    priceToPay: string;
    impressionProofNullifier: string;
  }): Promise<string> {
    const contract = this.requireContract(this.auctionContract, 'AdAuction');
    const priceBigInt = BigInt(params.priceToPay);
    const result = (await contract.callTx.settleAuction(
      params.campaignId,
      params.winnerId,
      priceBigInt,
      params.impressionProofNullifier,
    )) as { txHash: string };
    return result.txHash;
  }

  async getImpressionCount(campaignId: string): Promise<bigint> {
    const contract = this.requireContract(this.matchRegistryContract, 'MatchRegistry');
    const result = (await contract.callTx.getImpressionCount(campaignId)) as bigint;
    return result;
  }

  async escrowReward(nullifier: string, amountMidnight: string): Promise<string> {
    const contract = this.requireContract(this.rewardContract, 'UserReward');
    // Convert amount string to Uint<64> (BigInt in JS)
    const amountBigInt = BigInt(amountMidnight);
    const result = (await contract.callTx.escrowReward(
      nullifier,
      amountBigInt,
    )) as { txHash: string };
    return result.txHash;
  }

  async claimReward(nullifier: string, proofBytes: string): Promise<string> {
    const contract = this.requireContract(this.rewardContract, 'UserReward');
    const claimCommitment = this.proofCrypto.createClaimCommitment(
      proofBytes,
      nullifier,
    );
    const result = (await contract.callTx.claimReward(
      nullifier,
      claimCommitment,
    )) as { txHash: string };
    return result.txHash;
  }

  private requireContract(
    contract: DeployedContractHandle | null,
    name: string,
  ): DeployedContractHandle {
    if (!contract) {
      throw new ServiceUnavailableException(`${name} contract is not connected`);
    }
    return contract;
  }
}
