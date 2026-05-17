import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/api_service.dart';
import '../../../domain/usecases/submit_matching_proof_usecase.dart';
import '../../../domain/repositories/segment_repository.dart';
import '../../../domain/usecases/derive_embedding_usecase.dart';
import '../../../domain/entities/proof_entities.dart';
import '../../../providers.dart';
import '../../profile/domain/user_profile_repository.dart';

enum MatchingStatus { idle, loadingSegments, generating, matched, noMatch, error }

class MatchingState {
  final MatchingStatus status;
  final ProofEntity? lastProof;
  final String message;
  final String? errorDetail;

  const MatchingState({
    required this.status,
    this.lastProof,
    required this.message,
    this.errorDetail,
  });

  static const idle = MatchingState(
    status: MatchingStatus.idle,
    message: 'Ready to match ads privately',
  );

  MatchingState copyWith({
    MatchingStatus? status,
    ProofEntity? lastProof,
    String? message,
    String? errorDetail,
  }) {
    return MatchingState(
      status: status ?? this.status,
      lastProof: lastProof ?? this.lastProof,
      message: message ?? this.message,
      errorDetail: errorDetail,
    );
  }
}

class MatchingViewModel extends StateNotifier<MatchingState> {
  MatchingViewModel({
    required Ref ref,
    required ISegmentRepository segmentRepository,
    required DeriveEmbeddingUseCase deriveEmbeddingUseCase,
    required UserProfileRepository profileRepo,
    required SubmitMatchingProofUseCase submitMatchingProofUseCase,
  })  : _ref = ref,
        _segmentRepository = segmentRepository,
        _deriveEmbeddingUseCase = deriveEmbeddingUseCase,
        _submitMatchingProofUseCase = submitMatchingProofUseCase,
        _profileRepo = profileRepo,
        super(MatchingState.idle);

  final Ref _ref;
  final ISegmentRepository _segmentRepository;
  final DeriveEmbeddingUseCase _deriveEmbeddingUseCase;
  final SubmitMatchingProofUseCase _submitMatchingProofUseCase;
  final UserProfileRepository _profileRepo;

  Future<void> _clearAuthAndReset(String message) async {
    await _ref.read(authControllerProvider.notifier).signOut(reason: message);
    state = MatchingState.idle.copyWith(
      message: message,
      errorDetail: null,
      lastProof: null,
    );
  }

  Future<void> runMatching() async {
    try {
      state = state.copyWith(
        status: MatchingStatus.loadingSegments,
        message: 'Loading your private profile...',
        errorDetail: null,
      );
      final profile = await _profileRepo.loadProfile();

      state = state.copyWith(
        status: MatchingStatus.loadingSegments,
        message: 'Fetching public segment definitions...',
      );
      final segments = await _segmentRepository.getActiveSegments();

      if (segments.isEmpty) {
        state = state.copyWith(
          status: MatchingStatus.noMatch,
          message: 'No active campaigns to match against',
        );
        return;
      }

      state = state.copyWith(
        status: MatchingStatus.generating,
        message: 'Computing ZK proof on-device...',
      );

      final segment = segments.first;

      // Derive deterministic embedding using domain usecase
      final userEmbedding = _deriveEmbeddingUseCase(
        updatedAtIso: profile.updatedAt.toIso8601String(),
        topCategories: profile.topCategories,
        engagementScore: profile.engagementScore,
        embeddingDimensions: profile.embeddingDimensions,
      );

      final proofResult = await _submitMatchingProofUseCase(
        userEmbedding: userEmbedding,
        segmentCentroid: segment.centroid,
        threshold: segment.threshold,
        segmentId: segment.id,
        campaignId: segment.campaignId,
      );

      if (!proofResult.isSuccess) {
        final errorMessage = proofResult.error ?? 'Match failed';
        if (proofResult.statusCode == 401 || proofResult.statusCode == 403) {
          await _clearAuthAndReset('Session expired. Please sign in again.');
          return;
        }

        await _clearAuthAndReset('Submission failed. Please authenticate again.');
        state = state.copyWith(status: MatchingStatus.error, message: 'Match failed', errorDetail: errorMessage);
        return;
      }

      final outcome = proofResult.data!;

      if (!outcome.proof.isMatch || !outcome.wasSubmitted) {
        state = state.copyWith(
          status: MatchingStatus.noMatch,
          message: 'No match — no data transmitted',
        );
        return;
      }

      state = state.copyWith(
        status: MatchingStatus.matched,
        lastProof: outcome.proof,
        message: 'Match found — reward escrowed',
      );
    } on ApiError catch (error) {
      if (error.status == 401 || error.status == 403) {
        await _clearAuthAndReset('Session expired. Please sign in again.');
        return;
      }

      state = state.copyWith(
        status: MatchingStatus.error,
        message: 'Match failed',
        errorDetail: error.toString(),
      );
    } catch (error) {
      await _clearAuthAndReset('Transaction failed. Please sign in again.');
      state = state.copyWith(
        status: MatchingStatus.error,
        message: 'Match failed',
        errorDetail: error.toString(),
      );
    }
  }
}

final matchingViewModelProvider = StateNotifierProvider<MatchingViewModel, MatchingState>((ref) {
  return MatchingViewModel(
    ref: ref,
    segmentRepository: ref.read(segmentRepositoryProvider),
    deriveEmbeddingUseCase: ref.read(deriveEmbeddingUseCaseProvider),
    profileRepo: ref.read(userProfileRepositoryProvider),
    submitMatchingProofUseCase: ref.read(submitMatchingProofUseCaseProvider),
  );
});
