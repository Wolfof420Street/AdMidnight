import 'package:admidnight_mobile/domain/entities/proof_entities.dart';
import 'package:admidnight_mobile/domain/repositories/proof_repositories.dart';
import 'package:admidnight_mobile/domain/usecases/generate_proof_usecase.dart';
import 'package:admidnight_mobile/domain/usecases/submit_matching_proof_usecase.dart';
import 'package:admidnight_mobile/features/matching/domain/zk_proof_engine.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeGenerateProofUseCase extends GenerateProofUseCase {
  FakeGenerateProofUseCase(this.result) : super(_NoopZKProofEngine());

  final ProofEntity result;

  @override
  Future<ProofEntity> call({
    required List<double> userEmbedding,
    required List<double> segmentCentroid,
    required double threshold,
    required String segmentId,
    required String campaignId,
  }) async {
    return result;
  }
}

class _NoopZKProofEngine extends ZKProofEngine {}

class RecordingProofRepository implements IProofSubmissionRepository {
  int submitCallCount = 0;
  ProofEntity? lastSubmittedProof;

  @override
  Future<String> submitProof(ProofEntity proof) async {
    submitCallCount += 1;
    lastSubmittedProof = proof;
    return 'tx-123';
  }
}

void main() {
  test('submits the generated proof when the segment matches', () async {
    final generatedAt = DateTime.utc(2026, 5, 16);
    final proof = ProofEntity(
      proofBytes: 'proof-bytes',
      nullifier: '0xabc',
      segmentId: 'segment-1',
      campaignId: 'campaign-1',
      isMatch: true,
      generatedAt: generatedAt,
    );
    final repo = RecordingProofRepository();
    final useCase = SubmitMatchingProofUseCase(
      FakeGenerateProofUseCase(proof),
      repo,
    );

    final result = await useCase(
      userEmbedding: const [0.2, 0.8],
      segmentCentroid: const [0.2, 0.8],
      threshold: 0.1,
      segmentId: 'segment-1',
      campaignId: 'campaign-1',
    );

    expect(result.isSuccess, isTrue);
    expect(result.data?.wasSubmitted, isTrue);
    expect(result.data?.txHash, 'tx-123');
    expect(repo.submitCallCount, 1);
    expect(repo.lastSubmittedProof?.nullifier, '0xabc');
  });

  test('does not submit when the generated proof is a non-match', () async {
    final proof = ProofEntity(
      proofBytes: '',
      nullifier: '',
      segmentId: 'segment-1',
      campaignId: 'campaign-1',
      isMatch: false,
      generatedAt: DateTime.utc(2026, 5, 16),
    );
    final repo = RecordingProofRepository();
    final useCase = SubmitMatchingProofUseCase(
      FakeGenerateProofUseCase(proof),
      repo,
    );

    final result = await useCase(
      userEmbedding: const [0.0, 0.0],
      segmentCentroid: const [1.0, 1.0],
      threshold: 0.9,
      segmentId: 'segment-1',
      campaignId: 'campaign-1',
    );

    expect(result.isSuccess, isTrue);
    expect(result.data?.wasSubmitted, isFalse);
    expect(repo.submitCallCount, 0);
  });
}
