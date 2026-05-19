import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { RegisterImpressionRequestDto } from './dto/register-impression.request.dto';
import { ProofRepository } from '../persistence/repositories/proof.repository';
import { PublisherRepository } from '../persistence/repositories/publisher.repository';

@Injectable()
export class PublisherService {
  constructor(
    private readonly proofRepository: ProofRepository,
    private readonly publisherRepository: PublisherRepository,
  ) {}

  async registerImpression(
    dto: RegisterImpressionRequestDto,
  ): Promise<{ auctionId: string; estimatedPayout: string }> {
    const proofHash = `0x${createHash('sha256').update(dto.matchProofBytes).digest('hex')}`;
    const alreadyUsed = await this.proofRepository.isNullifierUsed(
      dto.matchProofNullifier,
    );
    if (!alreadyUsed) {
      throw new UnauthorizedException('Impression proof nullifier has not been validated');
    }

    try {
      const auctionId = await this.publisherRepository.recordImpression({
        slotId: dto.slotId,
        nullifier: dto.matchProofNullifier,
        proofHash,
        payoutMidnight: '1',
      });
      return {
        auctionId,
        estimatedPayout: '1',
      };
    } catch {
      throw new ConflictException('Impression already registered for this proof nullifier');
    }
  }

  async getRevenueDashboard(): Promise<{
    totalEarned: string;
    pendingSettlement: string;
    impressionCount: number;
  }> {
    return this.publisherRepository.getRevenueDashboard();
  }
}
