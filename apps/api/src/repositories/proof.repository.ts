/**
 * ProofRepository — wraps Prisma ProofRecord queries
 * Enforces: nullifier is unique (no double-spend)
 * Single responsibility: translate domain proof queries to Prisma
 * Used by: ProofService
 */
import { PrismaClient } from '@prisma/client';

export class ProofRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create new proof record or return existing if nullifier already exists
   * Idempotent: calling twice with same nullifier returns same record, doesn't error
   */
  async createOrReturnExisting(data: {
    userId: string;
    campaignId: string;
    nullifier: string;
    proof: string; // JSON-encoded proof
    centroid: number[];
    userVector: number[];
  }) {
    // Check if nullifier already exists
    const existing = await this.prisma.proofRecord.findUnique({
      where: { nullifier: data.nullifier },
    });

    if (existing) {
      return existing; // Idempotent: return existing
    }

    // Create new proof record
    return this.prisma.proofRecord.create({
      data: {
        userId: data.userId,
        campaignId: data.campaignId,
        nullifier: data.nullifier,
        proof: data.proof,
        centroid: data.centroid,
        userVector: data.userVector,
        status: 'VERIFIED',
      },
    });
  }

  async findByNullifier(nullifier: string) {
    return this.prisma.proofRecord.findUnique({
      where: { nullifier },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.proofRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCampaignId(campaignId: string) {
    return this.prisma.proofRecord.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProofCount(campaignId: string): Promise<number> {
    return this.prisma.proofRecord.count({
      where: { campaignId, status: 'VERIFIED' },
    });
  }
}
