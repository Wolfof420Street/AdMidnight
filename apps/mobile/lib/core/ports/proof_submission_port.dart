/// IProofSubmissionPort — submits ZK proofs to the backend.
/// SoC: proof submission separated from proof generation.
abstract class IProofSubmissionPort {
  Future<ProofSubmissionResult> submit(ZKMatchProof proof);
}

class ZKMatchProof {
  final String proofBytes;
  final String nullifier;
  final String segmentId;
  final String campaignId;
  final bool isMatch;
  final DateTime generatedAt;
  final String circuit;

  ZKMatchProof({
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
}

class ProofSubmissionResult {
  final String txHash;
  final String proofReceiptId;
  final String timestamp;

  ProofSubmissionResult({
    required this.txHash,
    required this.proofReceiptId,
    required this.timestamp,
  });

  factory ProofSubmissionResult.fromJson(Map<String, dynamic> json) => ProofSubmissionResult(
        txHash: json['txHash'] as String,
        proofReceiptId: json['proofReceiptId'] as String,
        timestamp: json['timestamp'] as String,
      );
}
