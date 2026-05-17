/// Repository implementations for proofs and rewards (data layer).
library proof_repositories_impl;

import '../../domain/entities/proof_entities.dart';
import '../../domain/repositories/proof_repositories.dart';
import '../datasources/proof_remote_datasources.dart';
import '../models/proof_models.dart';

class ProofSubmissionRepositoryImpl implements IProofSubmissionRepository {
  final IProofRemoteDataSource _remoteDataSource;

  ProofSubmissionRepositoryImpl(this._remoteDataSource);

  @override
  Future<String> submitProof(ProofEntity proof) async {
    final model = ZKMatchProofModel(
      proofBytes: proof.proofBytes,
      nullifier: proof.nullifier,
      segmentId: proof.segmentId,
      campaignId: proof.campaignId,
      isMatch: proof.isMatch,
      generatedAt: proof.generatedAt,
      circuit: proof.circuit,
    );

    final result = await _remoteDataSource.submitProof(model);
    return result.txHash;
  }
}

/// RewardClaimRepositoryImpl — concrete repository for reward claims.
/// Converts entities to models, calls datasource, returns domain entities.
class RewardClaimRepositoryImpl implements IRewardClaimRepository {
  final IRewardRemoteDataSource _remoteDataSource;

  RewardClaimRepositoryImpl(this._remoteDataSource);

  @override
  Future<RewardClaimEntity> claim(String nullifier, String zkProof) async {
    final result = await _remoteDataSource.claim(nullifier, zkProof);
    return RewardClaimEntity(
      claimTxHash: result.claimTxHash,
      amount: result.amount,
      claimedAt: DateTime.parse(result.timestamp),
    );
  }

  @override
  Future<List<PendingRewardEntity>> getPendingRewards() async {
    final models = await _remoteDataSource.getPendingRewards();
    return models
        .map((model) => PendingRewardEntity(
              nullifier: model.nullifier,
              amount: model.amount,
              campaignId: model.campaignId,
              escrowedAt: DateTime.parse(model.escrowedTimestamp),
            ))
        .toList();
  }
}
