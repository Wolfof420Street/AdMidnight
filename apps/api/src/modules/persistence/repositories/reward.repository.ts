import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';

type RewardRow = {
  nullifier: string;
  campaignId: string;
  amountMidnight: string;
  status: string;
  createdAt?: Date;
};

@Injectable()
export class RewardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPending(params: {
    nullifier: string;
    campaignId: string;
    amountMidnight: string;
  }): Promise<void> {
    const now = new Date();
    await this.prisma.rewardClaim.create({
      data: {
        nullifier: params.nullifier,
        campaignId: params.campaignId,
        amountMidnight: params.amountMidnight,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async findPending(nullifier: string): Promise<RewardRow | null> {
    const row = await this.prisma.rewardClaim.findFirst({
      where: { nullifier, status: 'PENDING' },
      select: { nullifier: true, campaignId: true, amountMidnight: true, status: true, createdAt: true },
    });

    return (row as unknown as RewardRow) ?? null;
  }

  async listPending(): Promise<RewardRow[]> {
    const rows = await this.prisma.rewardClaim.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: { nullifier: true, campaignId: true, amountMidnight: true, status: true, createdAt: true },
    });

    return rows as unknown as RewardRow[];
  }

  async markClaimed(nullifier: string, txHash: string): Promise<void> {
    await this.prisma.rewardClaim.updateMany({
      where: { nullifier },
      data: { status: 'CLAIMED', claimTxHash: txHash, updatedAt: new Date() },
    });
  }

  async deleteByNullifier(nullifier: string): Promise<void> {
    await this.prisma.rewardClaim.deleteMany({ where: { nullifier } });
  }
}
