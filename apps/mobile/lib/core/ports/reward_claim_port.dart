/// IRewardClaimPort — claims rewards using nullifiers.
abstract class IRewardClaimPort {
  Future<RewardClaimResult> claim(String nullifier, String zkProof);
  Future<List<PendingReward>> getPendingRewards();
}

class RewardClaimResult {
  final String claimTxHash;
  final String amount;
  final String timestamp;

  RewardClaimResult({
    required this.claimTxHash,
    required this.amount,
    required this.timestamp,
  });

  factory RewardClaimResult.fromJson(Map<String, dynamic> json) => RewardClaimResult(
        claimTxHash: json['claimTxHash'] as String,
        amount: json['amount'] as String,
        timestamp: json['timestamp'] as String,
      );
}

class PendingReward {
  final String nullifier;
  final String amount;
  final String campaignId;
  final String escrowedTimestamp;

  PendingReward({
    required this.nullifier,
    required this.amount,
    required this.campaignId,
    required this.escrowedTimestamp,
  });

  factory PendingReward.fromJson(Map<String, dynamic> json) => PendingReward(
        nullifier: json['nullifier'] as String,
        amount: json['amount'] as String,
        campaignId: json['campaignId'] as String,
        escrowedTimestamp: json['escrowedTimestamp'] as String,
      );
}
