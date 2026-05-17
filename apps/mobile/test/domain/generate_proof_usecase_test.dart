import 'package:admidnight_mobile/domain/entities/proof_entities.dart';
import 'package:admidnight_mobile/core/ports/proof_submission_port.dart';
import 'package:admidnight_mobile/domain/usecases/generate_proof_usecase.dart';
import 'package:admidnight_mobile/features/matching/domain/zk_proof_engine.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeZKProofEngine extends ZKProofEngine {
  FakeZKProofEngine(this.result);

  final ProofEntity result;

  @override
  Future<ZKMatchProof> generateMatchProof({
    required List<double> userEmbedding,
    required List<double> segmentCentroid,
    required double threshold,
    required String segmentId,
    required String campaignId,
  }) async {
    return ZKMatchProof(
      proofBytes: result.proofBytes,
      nullifier: result.nullifier,
      segmentId: segmentId,
      campaignId: campaignId,
      isMatch: result.isMatch,
      generatedAt: result.generatedAt,
      circuit: result.circuit,
    );
  }
}

void main() {
  test('maps the ZK proof engine output into a domain proof entity', () async {
    final proof = ProofEntity(
      proofBytes: 'proof-bytes',
      nullifier: '0xabc',
      segmentId: 'segment-1',
      campaignId: 'campaign-1',
      isMatch: true,
      generatedAt: DateTime.utc(2026, 5, 16),
    );

    final useCase = GenerateProofUseCase(FakeZKProofEngine(proof));

    final result = await useCase(
      userEmbedding: const [0.1, 0.2],
      segmentCentroid: const [0.1, 0.2],
      threshold: 0.5,
      segmentId: 'segment-1',
      campaignId: 'campaign-1',
    );

    expect(result.proofBytes, proof.proofBytes);
    expect(result.nullifier, proof.nullifier);
    expect(result.isMatch, isTrue);
    expect(result.campaignId, 'campaign-1');
  });
}
