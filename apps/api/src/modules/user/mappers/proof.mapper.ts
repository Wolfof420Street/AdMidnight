import type { ContractAddressHex, NullifierHex, ZKProof } from '@admidnight/shared';
import type { ClaimRewardRequestDto } from '../dto/claim-reward.request.dto';
import type { SubmitMatchProofRequestDto } from '../dto/submit-match-proof.request.dto';

export class ProofMapper {
  static toDomain(dto: SubmitMatchProofRequestDto): ZKProof {
    return {
      proofBytes: dto.proofBytes,
      publicInputs: {
        segmentId: dto.publicInputs.segmentId as ContractAddressHex,
        campaignId: dto.publicInputs.campaignId as ContractAddressHex,
        isMatch: dto.publicInputs.isMatch,
        nullifier: dto.publicInputs.nullifier as NullifierHex,
      },
      circuit: 'proveSegmentMatch',
      generatedAt: new Date(dto.generatedAt),
    };
  }

  static toRewardDomain(dto: ClaimRewardRequestDto): ZKProof {
    return {
      proofBytes: dto.zkProof,
      publicInputs: {
        segmentId: (`0x${'0'.repeat(64)}`) as ContractAddressHex,
        campaignId: (`0x${'0'.repeat(64)}`) as ContractAddressHex,
        isMatch: true,
        nullifier: dto.nullifier as NullifierHex,
      },
      circuit: 'claimReward',
      generatedAt: new Date(),
    };
  }
}
