/// ProofModels — DTOs for ZK proof submission and results.
/// Used by data layer for serialization/deserialization.
library proof_models;

/// ZKMatchProofModel — DTO for ZK proof submission to backend.
class ZKMatchProofModel {
  final String proofBytes;
  final String nullifier;
  final String segmentId;
  final String campaignId;
  final bool isMatch;
  final DateTime generatedAt;
  final String circuit;

  ZKMatchProofModel({
    required this.proofBytes,
    required this.nullifier,
    required this.segmentId,
    required this.campaignId,
    required this.isMatch,
    required this.generatedAt,
    this.circuit = 'proveSegmentMatch',
  });

  Map<String, dynamic> toJson() => {
        'proofBytes': proofBytes,
        'publicInputs': {
          'segmentId': segmentId,
          'campaignId': campaignId,
          'isMatch': isMatch,
          'nullifier': nullifier,
        },
        'generatedAt': generatedAt.toUtc().toIso8601String(),
      };

  factory ZKMatchProofModel.fromJson(Map<String, dynamic> json) => ZKMatchProofModel(
        proofBytes: json['proofBytes'] as String,
        nullifier: (json['publicInputs'] as Map<String, dynamic>)['nullifier'] as String,
        segmentId: (json['publicInputs'] as Map<String, dynamic>)['segmentId'] as String,
        campaignId: (json['publicInputs'] as Map<String, dynamic>)['campaignId'] as String,
        isMatch: (json['publicInputs'] as Map<String, dynamic>)['isMatch'] as bool,
        generatedAt: DateTime.parse(json['generatedAt'] as String),
        circuit: json['circuit'] as String? ?? 'proveSegmentMatch',
      );
}

/// ProofSubmissionResultModel — response from proof submission endpoint.
class ProofSubmissionResultModel {
  final String txHash;
  final String proofReceiptId;
  final String timestamp;

  ProofSubmissionResultModel({
    required this.txHash,
    required this.proofReceiptId,
    required this.timestamp,
  });

  factory ProofSubmissionResultModel.fromJson(Map<String, dynamic> json) => ProofSubmissionResultModel(
        txHash: (json['relayTxHash'] as String?) ?? '',
        proofReceiptId: json['rewardEscrow'] as String,
        timestamp: DateTime.now().toUtc().toIso8601String(),
      );

  Map<String, dynamic> toJson() => {
        'txHash': txHash,
        'proofReceiptId': proofReceiptId,
        'timestamp': timestamp,
      };
}
