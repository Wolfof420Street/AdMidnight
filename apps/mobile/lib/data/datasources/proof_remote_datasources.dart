/// Data sources for proof and reward operations (data layer).
/// All imports must be at the top of the file per Dart rules.
library proof_remote_datasources;

import 'dart:convert';

import '../../core/services/api_service.dart';
import '../models/proof_models.dart';
import '../models/reward_models.dart';

/// IProofRemoteDataSource — data layer interface for remote proof operations.
/// Handles HTTP calls to proof submission endpoint; returns models.
abstract class IProofRemoteDataSource {
  /// Submit a ZK proof to /user/proof/match endpoint.
  Future<ProofSubmissionResultModel> submitProof(ZKMatchProofModel proof);
}

/// ProofRemoteDataSource — concrete implementation using ApiService.
class ProofRemoteDataSource implements IProofRemoteDataSource {
  final ApiService _api;

  ProofRemoteDataSource(this._api);

  @override
  Future<ProofSubmissionResultModel> submitProof(ZKMatchProofModel proof) async {
    return _api.post<ProofSubmissionResultModel>(
      '/user/proof/match',
      body: proof.toJson(),
      fromJson: (data) {
        final json = data as Map<String, dynamic>;
        return ProofSubmissionResultModel.fromJson(json);
      },
    );
  }
}

/// IRewardRemoteDataSource — data layer interface for remote reward operations.
/// Handles HTTP calls to reward endpoints; returns models.
abstract class IRewardRemoteDataSource {
  /// Claim a reward at /user/rewards/claim endpoint.
  Future<RewardClaimResultModel> claim(String nullifier, String zkProof);

  /// Fetch pending rewards from /user/rewards/pending endpoint.
  Future<List<PendingRewardModel>> getPendingRewards();
}

/// RewardRemoteDataSource — concrete implementation using ApiService.
class RewardRemoteDataSource implements IRewardRemoteDataSource {
  final ApiService _api;

  RewardRemoteDataSource(this._api);

  @override
  Future<RewardClaimResultModel> claim(String nullifier, String zkProof) async {
    // Build proof envelope if not provided
    final proofEnvelope = {
      'circuit': 'claimReward',
      'generatedAt': DateTime.now().toUtc().toIso8601String(),
      'publicInputs': {
        'segmentId': '0x${'0' * 64}',
        'campaignId': '0x${'0' * 64}',
        'isMatch': true,
        'nullifier': nullifier,
      },
    };

    return _api.post<RewardClaimResultModel>(
      '/user/rewards/claim',
      body: {
        'nullifier': nullifier,
        'zkProof': zkProof.isNotEmpty ? zkProof : base64Encode(utf8.encode(jsonEncode(proofEnvelope))),
      },
      fromJson: (data) {
        final json = data as Map<String, dynamic>;
        return RewardClaimResultModel.fromJson(json);
      },
    );
  }

  @override
  Future<List<PendingRewardModel>> getPendingRewards() async {
    return _api.get<List<PendingRewardModel>>(
      '/user/rewards/pending',
      fromJson: (data) {
        final rewards = (data as List<dynamic>? ?? const []);
        return rewards.cast<Map<String, dynamic>>().map(PendingRewardModel.fromJson).toList();
      },
    );
  }
}
