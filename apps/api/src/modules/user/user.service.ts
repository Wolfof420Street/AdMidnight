import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import {
  type CampaignResponseDto,
  type ProofVerificationResponseDto,
  type RewardClaimResponseDto,
} from '@admidnight/shared';
import type { MidnightGateway } from '../midnight/midnight.gateway';
import type { CampaignRepository } from '../persistence/repositories/campaign.repository';
import type { ProofRepository } from '../persistence/repositories/proof.repository';
import type { RewardRepository } from '../persistence/repositories/reward.repository';
import type { ClaimRewardRequestDto } from './dto/claim-reward.request.dto';
import type { SubmitMatchProofRequestDto } from './dto/submit-match-proof.request.dto';
import { ProofMapper } from './mappers/proof.mapper';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly midnightGateway: MidnightGateway,
    private readonly campaignRepository: CampaignRepository,
    private readonly proofRepository: ProofRepository,
    private readonly rewardRepository: RewardRepository,
  ) {}

  async processMatchProof(
    dto: SubmitMatchProofRequestDto,
  ): Promise<ProofVerificationResponseDto> {
    const proof = ProofMapper.toDomain(dto);
    const alreadyUsed = await this.proofRepository.isNullifierUsed(
      proof.publicInputs.nullifier,
    );

    if (alreadyUsed) {
      this.logger.warn('Duplicate nullifier attempt rejected');
      return { valid: false, campaignId: '', rewardEscrow: '' };
    }

    const relay = await this.midnightGateway.submitMatchProof(proof);
    await this.proofRepository.record({
      campaignId: proof.publicInputs.campaignId,
      segmentId: proof.publicInputs.segmentId,
      nullifier: proof.publicInputs.nullifier,
      proofHash: relay.proofHash,
      publicInputHash: relay.publicInputHash,
      isMatch: true,
      relayTxHash: relay.txHash,
    });

    await this.rewardRepository.createPending({
      nullifier: proof.publicInputs.nullifier,
      campaignId: proof.publicInputs.campaignId,
      amountMidnight: '1',
    });

    try {
      await this.midnightGateway.escrowReward(proof.publicInputs.nullifier, '1');
    } catch (err) {
      this.logger.error('Escrow failed after recording DB entries; attempting compensation', err as any);
      // Compensation: remove any DB rows that were created so the system remains consistent.
      try {
        await this.proofRepository.deleteByNullifier(proof.publicInputs.nullifier);
        await this.rewardRepository.deleteByNullifier(proof.publicInputs.nullifier);
      } catch (compErr) {
        this.logger.error('Compensation failed; manual reconciliation required', compErr as any);
      }
      throw new ServiceUnavailableException('Failed to escrow reward on Midnight ledger');
    }

    return {
      valid: true,
      campaignId: proof.publicInputs.campaignId,
      rewardEscrow: proof.publicInputs.nullifier,
      relayTxHash: relay.txHash,
    };
  }

  async claimReward(dto: ClaimRewardRequestDto): Promise<RewardClaimResponseDto> {
    const pending = await this.rewardRepository.findPending(dto.nullifier);
    if (!pending) {
      throw new NotFoundException('No pending reward found for the provided nullifier');
    }

    const txHash = await this.midnightGateway.claimReward(
      dto.nullifier,
      dto.zkProof,
    );
    await this.rewardRepository.markClaimed(dto.nullifier, txHash);
    return {
      txHash,
      amountMidnight: pending.amountMidnight,
      status: 'CLAIMED',
    };
  }

  async getPendingRewards(): Promise<Array<{
    nullifier: string;
    amount: string;
    campaignId: string;
    escrowedTimestamp: string;
  }>> {
    const rewards = await this.rewardRepository.listPending();
    return rewards.map((reward) => ({
      nullifier: reward.nullifier,
      amount: reward.amountMidnight,
      campaignId: reward.campaignId,
      escrowedTimestamp: reward.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  }

  async getAvailableSegments(): Promise<CampaignResponseDto[]> {
    return this.campaignRepository.listActive();
  }
}
