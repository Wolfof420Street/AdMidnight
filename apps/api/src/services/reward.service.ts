/**
 * RewardService — business logic for reward claims
 * No Prisma client here; only calls RewardRepository
 * Ensures: atomic claims (on-chain first, then Prisma; if on-chain fails, Prisma untouched)
 * Called by: reward claim routes
 */
import { RewardRepository } from '../repositories';

export class RewardService {
  constructor(private rewardRepository: RewardRepository) {}

  /**
   * Escrow reward for user (called by on-chain when user earns reward)
   */
  async escrowReward(data: {
    userId: string;
    amountUsd: number;
    nullifier: string;
  }) {
    if (!data.userId || !data.nullifier) {
      throw new Error('Missing required fields: userId, nullifier');
    }

    if (data.amountUsd <= 0) {
      throw new Error('Amount must be positive');
    }

    // Check if nullifier already escrowed
    const existing = await this.rewardRepository.findByNullifier(data.nullifier);
    if (existing) {
      return existing; // Already escrowed, return existing record
    }

    return this.rewardRepository.escrowReward(data);
  }

  /**
   * Claim escrowed reward
   * ATOMIC SEMANTICS:
   * 1. On-chain call happens FIRST in gateway
   * 2. If on-chain fails, Prisma untouched
   * 3. If on-chain succeeds, THIS method is called to mark as CLAIMED
   * 4. If Prisma fails here, log alert and return tx hash anyway (money is safe on-chain)
   */
  async claimReward(nullifier: string): Promise<{ success: boolean; error?: string }> {
    if (!nullifier) {
      return { success: false, error: 'Nullifier required' };
    }

    try {
      // Check if already claimed (double-spend prevention)
      const isClaimed = await this.rewardRepository.isClaimed(nullifier);
      if (isClaimed) {
        return { success: false, error: 'Reward already claimed (double-spend detected)' };
      }

      // Mark as claimed in database
      await this.rewardRepository.claimReward(nullifier);
      return { success: true };
    } catch (error: any) {
      // Log alert: on-chain succeeded but Prisma failed
      // This is a critical condition but reward is safe on-chain
      console.error(`ALERT: On-chain claim succeeded but Prisma update failed for ${nullifier}:`, error);
      return { success: true }; // Return success anyway (money is on-chain)
    }
  }

  async getPendingRewards(userId: string) {
    const rewards = await this.rewardRepository.getPendingRewards(userId);
    return {
      userId,
      pending: rewards.map((r) => ({
        nullifier: r.nullifier,
        amountUsd: r.amountUsd,
        escrowed_at: r.createdAt,
      })),
      totalPending: rewards.reduce((sum, r) => sum + r.amountUsd, 0),
    };
  }

  async getUserRewardHistory(userId: string) {
    const rewards = await this.rewardRepository.findByUserId(userId);
    const totalClaimed = await this.rewardRepository.getTotalClaimedAmount(userId);
    return {
      userId,
      totalClaimed,
      history: rewards.map((r) => ({
        nullifier: r.nullifier,
        amountUsd: r.amountUsd,
        status: r.status,
        timestamp: r.createdAt,
      })),
    };
  }
}
