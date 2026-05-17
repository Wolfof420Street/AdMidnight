/**
 * ProofService — business logic for segment match proofs
 * No Prisma client here; only calls ProofRepository
 * Ensures: idempotent submission (same nullifier = same result, no error)
 * Called by: proof submission routes
 */
import { ProofRepository } from '../repositories';

export class ProofService {
  constructor(private proofRepository: ProofRepository) {}

  /**
   * Submit proof of segment match
   * Idempotent: if nullifier already exists, return existing proof without error
   */
  async submitProof(data: {
    userId: string;
    campaignId: string;
    nullifier: string;
    proof: string; // JSON-encoded proof
    centroid: number[];
    userVector: number[];
  }) {
    // Validate inputs
    if (!data.userId || !data.campaignId || !data.nullifier) {
      throw new Error('Missing required proof fields: userId, campaignId, nullifier');
    }

    if (!data.centroid || data.centroid.length !== 128) {
      throw new Error('Centroid must be 128-dimensional vector');
    }

    if (!data.userVector || data.userVector.length !== 128) {
      throw new Error('User vector must be 128-dimensional vector');
    }

    // Validate nullifier format (should be hex)
    if (!/^0x[a-f0-9]+$/i.test(data.nullifier)) {
      throw new Error('Nullifier must be hex format (0x...)');
    }

    // Idempotent: returns existing record if nullifier already exists
    return this.proofRepository.createOrReturnExisting(data);
  }

  async getProofByNullifier(nullifier: string) {
    const proof = await this.proofRepository.findByNullifier(nullifier);
    if (!proof) {
      throw new Error(`Proof not found: ${nullifier}`);
    }
    return proof;
  }

  async getUserProofs(userId: string) {
    return this.proofRepository.findByUserId(userId);
  }

  async getCampaignProofCount(campaignId: string) {
    return this.proofRepository.getProofCount(campaignId);
  }

  async getAvailableSegments(userId: string) {
    const userProofs = await this.proofRepository.findByUserId(userId);
    return userProofs.map((p) => ({
      campaignId: p.campaignId,
      nullifier: p.nullifier,
      verifiedAt: p.createdAt,
    }));
  }
}
