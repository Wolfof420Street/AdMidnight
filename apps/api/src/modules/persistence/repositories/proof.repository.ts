import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProofRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: {
    campaignId: string;
    segmentId: string;
    nullifier: string;
    proofHash: string;
    publicInputHash: string;
    isMatch: boolean;
    relayTxHash?: string;
  }): Promise<void> {
    await this.prisma.proofRecord.create({
      data: {
        nullifier: params.nullifier,
        campaignId: params.campaignId,
        segmentId: params.segmentId,
        proofHash: params.proofHash,
        publicInputHash: params.publicInputHash,
        isMatch: params.isMatch,
        relayTxHash: params.relayTxHash ?? null,
        createdAt: new Date(),
      },
    });
  }

  async isNullifierUsed(nullifier: string): Promise<boolean> {
    const count = await this.prisma.proofRecord.count({ where: { nullifier } });
    return count > 0;
  }

  async getImpressionCount(campaignId: string): Promise<number> {
    const count = await this.prisma.proofRecord.count({ where: { campaignId, isMatch: true } });
    return count;
  }

  async deleteByNullifier(nullifier: string): Promise<void> {
    await this.prisma.proofRecord.deleteMany({ where: { nullifier } });
  }
}
