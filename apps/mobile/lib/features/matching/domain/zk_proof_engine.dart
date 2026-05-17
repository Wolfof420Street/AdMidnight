import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import '../../../core/ports/proof_submission_port.dart';

class ZKProofEngine {
  double computeCosineSimilarity(
    List<double> userEmbedding,
    List<double> segmentCentroid,
  ) {
    assert(userEmbedding.length == segmentCentroid.length);

    double dotProduct = 0.0;
    double normUser = 0.0;
    double normCentroid = 0.0;

    for (int i = 0; i < userEmbedding.length; i++) {
      dotProduct += userEmbedding[i] * segmentCentroid[i];
      normUser += userEmbedding[i] * userEmbedding[i];
      normCentroid += segmentCentroid[i] * segmentCentroid[i];
    }

    if (normUser == 0.0 || normCentroid == 0.0) {
      return 0.0;
    }

    return dotProduct / (sqrt(normUser) * sqrt(normCentroid));
  }

  Future<ZKMatchProof> generateMatchProof({
    required List<double> userEmbedding,
    required List<double> segmentCentroid,
    required double threshold,
    required String segmentId,
    required String campaignId,
  }) async {
    final generatedAt = DateTime.now().toUtc();
    final similarity = computeCosineSimilarity(userEmbedding, segmentCentroid);
    final isMatch = similarity > threshold;

    if (!isMatch) {
      return ZKMatchProof(
        proofBytes: '',
        isMatch: false,
        nullifier: '',
        segmentId: segmentId,
        campaignId: campaignId,
        generatedAt: generatedAt,
      );
    }

    final salt = _generateRandomBytes(32);
    final nullifierInput = utf8.encode('$segmentId:$campaignId:') + salt;
    final nullifierBytes = sha256.convert(nullifierInput).bytes;
    final nullifier = '0x${_bytesToHex(Uint8List.fromList(nullifierBytes))}';

    final proofCommitment = _buildProofCommitment(
      similarity: similarity,
      threshold: threshold,
      nullifier: nullifier,
      segmentId: segmentId,
      campaignId: campaignId,
      generatedAt: generatedAt,
      circuit: 'proveSegmentMatch',
    );

    return ZKMatchProof(
      proofBytes: base64Encode(proofCommitment),
      isMatch: true,
      nullifier: nullifier,
      segmentId: segmentId,
      campaignId: campaignId,
      generatedAt: generatedAt,
      circuit: 'proveSegmentMatch',
    );
  }

  Uint8List _buildProofCommitment({
    required double similarity,
    required double threshold,
    required String nullifier,
    required String segmentId,
    required String campaignId,
    required DateTime generatedAt,
    required String circuit,
  }) {
    final data = json.encode({
      'circuit': circuit,
      'generatedAt': generatedAt.toIso8601String(),
      'publicInputs': {
        'isMatch': similarity > threshold,
        'nullifier': nullifier,
        'segmentId': segmentId,
        'campaignId': campaignId,
      },
      'witnessCommitment': {
        'similarity': similarity,
        'threshold': threshold,
      },
    });

    return Uint8List.fromList(utf8.encode(data));
  }

  List<int> _generateRandomBytes(int length) {
    final random = Random.secure();
    return List<int>.generate(length, (_) => random.nextInt(256));
  }

  String _bytesToHex(Uint8List bytes) {
    return bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }
}
