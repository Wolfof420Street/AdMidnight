/// ProofEntity — pure domain entity for ZK proofs.
/// Represents a generated ZK proof in domain layer.
class ProofEntity {
  final String proofBytes;
  final String nullifier;
  final String segmentId;
  final String campaignId;
  final bool isMatch;
  final DateTime generatedAt;
  final String circuit;

  const ProofEntity({
    required this.proofBytes,
    required this.nullifier,
    required this.segmentId,
    required this.campaignId,
    required this.isMatch,
    required this.generatedAt,
    this.circuit = 'proveSegmentMatch',
  });

  String get proofHash => proofBytes;

  String get timestamp => generatedAt.toIso8601String();

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProofEntity &&
          runtimeType == other.runtimeType &&
          nullifier == other.nullifier &&
          segmentId == other.segmentId;

  @override
  int get hashCode => nullifier.hashCode ^ segmentId.hashCode;
}

/// RewardClaimEntity — pure domain entity for claimed rewards.
class RewardClaimEntity {
  final String claimTxHash;
  final String amount;
  final DateTime claimedAt;

  const RewardClaimEntity({
    required this.claimTxHash,
    required this.amount,
    required this.claimedAt,
  });
}

/// PendingRewardEntity — pure domain entity for unclaimed rewards.
class PendingRewardEntity {
  final String nullifier;
  final String amount;
  final String campaignId;
  final DateTime escrowedAt;

  const PendingRewardEntity({
    required this.nullifier,
    required this.amount,
    required this.campaignId,
    required this.escrowedAt,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PendingRewardEntity &&
          runtimeType == other.runtimeType &&
          nullifier == other.nullifier &&
          campaignId == other.campaignId;

  @override
  int get hashCode => nullifier.hashCode ^ campaignId.hashCode;
}
