/// IProofSubmissionRepository — domain-layer interface for proof submission.
/// Implemented by data layer; depends on IProofRemoteDataSource.
library proof_repositories;

import '../entities/proof_entities.dart';

abstract class IProofSubmissionRepository {
  /// Submit a ZK proof to the backend for verification and escrow.
  Future<String> submitProof(ProofEntity proof);
}

/// IRewardClaimRepository — domain-layer interface for reward claims.
/// Implemented by data layer; depends on IRewardRemoteDataSource.
abstract class IRewardClaimRepository {
  /// Claim a reward using nullifier and proof.
  Future<RewardClaimEntity> claim(String nullifier, String zkProof);

  /// Fetch pending (escrowed) rewards for the user.
  Future<List<PendingRewardEntity>> getPendingRewards();
}
