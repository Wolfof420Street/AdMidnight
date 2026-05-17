/// RewardModels — DTOs for reward claims and pending rewards.
/// Used by data layer for serialization/deserialization.
library reward_models;

/// RewardClaimResultModel — response from reward claim endpoint.
class RewardClaimResultModel {
  final String claimTxHash;
  final String amount;
  final String timestamp;

  RewardClaimResultModel({
    required this.claimTxHash,
    required this.amount,
    required this.timestamp,
  });

  factory RewardClaimResultModel.fromJson(Map<String, dynamic> json) => RewardClaimResultModel(
        claimTxHash: json['txHash'] as String,
        amount: json['amountMidnight'] as String,
        timestamp: DateTime.now().toUtc().toIso8601String(),
      );

  Map<String, dynamic> toJson() => {
        'claimTxHash': claimTxHash,
        'amount': amount,
        'timestamp': timestamp,
      };
}

/// PendingRewardModel — DTO for pending rewards from backend.
class PendingRewardModel {
  final String nullifier;
  final String amount;
  final String campaignId;
  final String escrowedTimestamp;

  PendingRewardModel({
    required this.nullifier,
    required this.amount,
    required this.campaignId,
    required this.escrowedTimestamp,
  });

  factory PendingRewardModel.fromJson(Map<String, dynamic> json) => PendingRewardModel(
        nullifier: json['nullifier'] as String,
        amount: json['amount'] as String,
        campaignId: json['campaignId'] as String,
        escrowedTimestamp: json['escrowedTimestamp'] as String,
      );

  Map<String, dynamic> toJson() => {
        'nullifier': nullifier,
        'amount': amount,
        'campaignId': campaignId,
        'escrowedTimestamp': escrowedTimestamp,
      };
}
