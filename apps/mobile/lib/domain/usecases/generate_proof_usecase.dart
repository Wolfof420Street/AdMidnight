/// GenerateProofUseCase — orchestrates ZK proof generation.
/// Encapsulates the complete proof workflow from similarity computation to nullifier.
library generate_proof_usecase;

import '../../features/matching/domain/zk_proof_engine.dart';
import '../entities/proof_entities.dart';

class GenerateProofUseCase {
  final ZKProofEngine _proofEngine;

  GenerateProofUseCase(this._proofEngine);

  Future<ProofEntity> call({
    required List<double> userEmbedding,
    required List<double> segmentCentroid,
    required double threshold,
    required String segmentId,
    required String campaignId,
  }) async {
    final proof = await _proofEngine.generateMatchProof(
      userEmbedding: userEmbedding,
      segmentCentroid: segmentCentroid,
      threshold: threshold,
      segmentId: segmentId,
      campaignId: campaignId,
    );

    return ProofEntity(
      proofBytes: proof.proofBytes,
      nullifier: proof.nullifier,
      segmentId: proof.segmentId,
      campaignId: proof.campaignId,
      isMatch: proof.isMatch,
      generatedAt: proof.generatedAt,
      circuit: proof.circuit,
    );
  }
}
