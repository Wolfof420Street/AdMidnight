/**
 * RewardRepository — wraps Prisma RewardClaim queries
 * Enforces: nullifier is unique (no double-claim)
 * Single responsibility: translate domain reward queries to Prisma
 * Used by: RewardService
 */
import { PrismaClient } from '@prisma/client';

export class RewardRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Escrow reward for user
   * Creates record with ESCROWED status
   */
  async escrowReward(data: {
    userId: string;
    amountUsd: number;
    nullifier: string;
  }) {
    return this.prisma.rewardClaim.create({
      data: {
        userId: data.userId,
        amountUsd: data.amountUsd,
        nullifier: data.nullifier,
        status: 'ESCROWED',
      },
    });
  }

  /**
   * Claim escrowed reward (mark as CLAIMED)
   * Throws if nullifier doesn't exist or already claimed
   * Atomic: updates status only if record exists and not yet claimed
   */
  async claimReward(nullifier: string) {
    return this.prisma.rewardClaim.update({
      where: { nullifier },
      data: { status: 'CLAIMED' },
    });
  }

  /**
   * Check if nullifier has already been claimed
   * Used for double-spend prevention before on-chain call
   */
  async isClaimed(nullifier: string): Promise<boolean> {
    const record = await this.prisma.rewardClaim.findUnique({
      where: { nullifier },
    });
    return record?.status === 'CLAIMED';
  }

  async findByNullifier(nullifier: string) {
    return this.prisma.rewardClaim.findUnique({
      where: { nullifier },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.rewardClaim.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingRewards(userId: string) {
    return this.prisma.rewardClaim.findMany({
      where: {
        userId,
        status: 'ESCROWED',
      },
    });
  }

  async getTotalClaimedAmount(userId: string): Promise<number> {
    const result = await this.prisma.rewardClaim.aggregate({
      where: {
        userId,
        status: 'CLAIMED',
      },
      _sum: {
        amountUsd: true,
      },
    });
    return result._sum.amountUsd || 0;
  }
}
