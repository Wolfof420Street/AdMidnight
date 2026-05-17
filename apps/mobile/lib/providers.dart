/// providers.dart — Centralized Riverpod dependency injection.
/// All provider definitions in one place for easy maintenance and discoverability.
library providers;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'core/config/app_config.dart';
import 'core/services/api_service.dart';

// Data layer: Remote data sources
import 'data/datasources/segment_remote_datasource.dart';
import 'data/datasources/proof_remote_datasources.dart';

// Auth
import 'features/auth/data/auth_remote_datasource.dart';
import 'features/auth/data/secure_auth_repository.dart';
import 'features/auth/domain/auth_repository.dart';
import 'features/auth/presentation/auth_controller.dart';

// Data layer: Repositories
import 'data/repositories/segment_repository_impl.dart';
import 'data/repositories/proof_repositories_impl.dart';

// Domain layer: Repositories (interfaces)
import 'domain/repositories/segment_repository.dart';
import 'domain/repositories/proof_repositories.dart';

// Domain layer: Use cases
import 'domain/usecases/derive_embedding_usecase.dart';
import 'domain/usecases/generate_proof_usecase.dart';
import 'domain/usecases/submit_matching_proof_usecase.dart';
import 'domain/usecases/claim_rewards_usecase.dart';
import 'domain/usecases/get_pending_rewards_usecase.dart';

// Features
import 'features/matching/domain/zk_proof_engine.dart';
import 'features/profile/domain/user_profile_repository.dart';
import 'features/profile/data/secure_user_profile_repository.dart';
import 'features/profile/presentation/profile_view_model.dart';
import 'domain/entities/proof_entities.dart';

// ============================================================================
// LAYER 1: CORE SERVICES
// ============================================================================

const _secureStorage = FlutterSecureStorage();

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSource(baseUrl: AppConfig.apiBaseUrl);
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return SecureAuthRepository(
    ref.read(authRemoteDataSourceProvider),
    _secureStorage,
  );
});

final apiServiceProvider = Provider<ApiService>((ref) {
  final authRepository = ref.read(authRepositoryProvider);
  return ApiService(
    baseUrl: AppConfig.apiBaseUrl,
    tokenProvider: authRepository.readSessionToken,
  );
});

// ============================================================================
// LAYER 2: DATA LAYER - REMOTE DATA SOURCES
// ============================================================================

final segmentRemoteDataSourceProvider = Provider<ISegmentRemoteDataSource>((ref) {
  return SegmentRemoteDataSource(ref.read(apiServiceProvider));
});

final proofRemoteDataSourceProvider = Provider<IProofRemoteDataSource>((ref) {
  return ProofRemoteDataSource(ref.read(apiServiceProvider));
});

final rewardRemoteDataSourceProvider = Provider<IRewardRemoteDataSource>((ref) {
  return RewardRemoteDataSource(ref.read(apiServiceProvider));
});

// ============================================================================
// LAYER 2: DATA LAYER - REPOSITORIES (Implementations)
// ============================================================================

final segmentRepositoryProvider = Provider<ISegmentRepository>((ref) {
  return SegmentRepositoryImpl(ref.read(segmentRemoteDataSourceProvider));
});

final proofSubmissionRepositoryProvider = Provider<IProofSubmissionRepository>((ref) {
  return ProofSubmissionRepositoryImpl(ref.read(proofRemoteDataSourceProvider));
});

final rewardClaimRepositoryProvider = Provider<IRewardClaimRepository>((ref) {
  return RewardClaimRepositoryImpl(ref.read(rewardRemoteDataSourceProvider));
});

// ============================================================================
// LAYER 3: DOMAIN LAYER - USE CASES
// ============================================================================

final deriveEmbeddingUseCaseProvider = Provider<DeriveEmbeddingUseCase>((ref) {
  return DeriveEmbeddingUseCase();
});

final generateProofUseCaseProvider = Provider<GenerateProofUseCase>((ref) {
  return GenerateProofUseCase(ref.read(zkProofEngineProvider));
});

final submitMatchingProofUseCaseProvider = Provider<SubmitMatchingProofUseCase>((ref) {
  return SubmitMatchingProofUseCase(
    ref.read(generateProofUseCaseProvider),
    ref.read(proofSubmissionRepositoryProvider),
  );
});

// ============================================================================
// LAYER 3: DOMAIN LAYER - OTHER SERVICES
// ============================================================================

final zkProofEngineProvider = Provider<ZKProofEngine>((ref) {
  return ZKProofEngine();
});

// Claim rewards usecase
final claimRewardsUseCaseProvider = Provider<ClaimRewardsUseCase>((ref) {
  return ClaimRewardsUseCase(
    ref.read(rewardClaimRepositoryProvider),
    ref.read(getPendingRewardsUseCaseProvider),
  );
});

// Get pending rewards usecase
final getPendingRewardsUseCaseProvider = Provider<GetPendingRewardsUseCase>((ref) {
  return GetPendingRewardsUseCase(ref.read(rewardClaimRepositoryProvider));
});

// Already defined in user_profile_repository.dart:
// final userProfileRepositoryProvider = Provider<UserProfileRepository>
// final userProfileProvider = FutureProvider<UserProfileSnapshot>

// Profile repository and provider (data layer implementation wired to domain interface)
final userProfileRepositoryProvider = Provider<UserProfileRepository>((ref) {
  return const SecureUserProfileRepository();
});

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>((ref) {
  return AuthController(ref.read(authRepositoryProvider));
});

final userProfileProvider = FutureProvider<UserProfileSnapshot>((ref) async {
  return ref.read(userProfileRepositoryProvider).loadProfile();
});

final profileControllerProvider = StateNotifierProvider<ProfileController, bool>((ref) {
  return ProfileController(ref);
});

class DashboardSummary {
  final UserProfileSnapshot profile;
  final List<PendingRewardEntity> pendingRewards;

  const DashboardSummary({required this.profile, required this.pendingRewards});

  int get pendingRewardCount => pendingRewards.length;
  String get claimableMidnight =>
      pendingRewards.fold<double>(0, (sum, reward) => sum + double.parse(reward.amount)).toStringAsFixed(0);
}

final dashboardSummaryProvider = FutureProvider<DashboardSummary>((ref) async {
  final profile = await ref.read(userProfileRepositoryProvider).loadProfile();
  final pending = await ref.read(getPendingRewardsUseCaseProvider).call();
  if (!pending.isSuccess) {
    throw StateError(pending.error ?? 'Failed to load dashboard summary');
  }

  return DashboardSummary(profile: profile, pendingRewards: pending.data ?? const []);
});
