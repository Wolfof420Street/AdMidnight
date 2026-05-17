import '../../core/services/api_service.dart';
import '../entities/proof_entities.dart';
import '../repositories/proof_repositories.dart';
import 'generate_proof_usecase.dart';
import 'usecase_result.dart';

class MatchingSubmissionOutcome {
  final ProofEntity proof;
  final String? txHash;

  const MatchingSubmissionOutcome({required this.proof, required this.txHash});

  bool get wasSubmitted => txHash != null && txHash!.isNotEmpty;
}

class SubmitMatchingProofUseCase {
  SubmitMatchingProofUseCase(this._generateProof, this._proofRepository);

  final GenerateProofUseCase _generateProof;
  final IProofSubmissionRepository _proofRepository;

  Future<UseCaseResult<MatchingSubmissionOutcome>> call({
    required List<double> userEmbedding,
    required List<double> segmentCentroid,
    required double threshold,
    required String segmentId,
    required String campaignId,
  }) async {
    try {
      final proof = await _generateProof(
        userEmbedding: userEmbedding,
        segmentCentroid: segmentCentroid,
        threshold: threshold,
        segmentId: segmentId,
        campaignId: campaignId,
      );

      if (!proof.isMatch) {
        return UseCaseResult.success(
          MatchingSubmissionOutcome(proof: proof, txHash: null),
        );
      }

      final txHash = await _proofRepository.submitProof(proof);
      return UseCaseResult.success(
        MatchingSubmissionOutcome(proof: proof, txHash: txHash),
      );
    } on ApiError catch (error) {
      return UseCaseResult.failure(error.message, statusCode: error.status);
    } catch (error) {
      return UseCaseResult.failure(error.toString());
    }
  }
}
