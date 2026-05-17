import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../domain/entities/proof_entities.dart';
import '../../../domain/usecases/claim_rewards_usecase.dart';
import '../../../domain/usecases/get_pending_rewards_usecase.dart';
import '../../../providers.dart';

class RewardsState {
  final List<PendingRewardEntity> pendingRewards;
  final bool isLoading;
  final bool isClaiming;
  final String? error;
  final String? lastClaimTxHash;

  const RewardsState({
    required this.pendingRewards,
    required this.isLoading,
    required this.isClaiming,
    this.error,
    this.lastClaimTxHash,
  });

  static const initial = RewardsState(
    pendingRewards: [],
    isLoading: true,
    isClaiming: false,
  );

  RewardsState copyWith({
    List<PendingRewardEntity>? pendingRewards,
    bool? isLoading,
    bool? isClaiming,
    String? error,
    String? lastClaimTxHash,
  }) {
    return RewardsState(
      pendingRewards: pendingRewards ?? this.pendingRewards,
      isLoading: isLoading ?? this.isLoading,
      isClaiming: isClaiming ?? this.isClaiming,
      error: error,
      lastClaimTxHash: lastClaimTxHash ?? this.lastClaimTxHash,
    );
  }

  String get claimableMidnight =>
      pendingRewards.fold<double>(0, (sum, reward) => sum + double.parse(reward.amount)).toStringAsFixed(0);
}

class RewardsViewModel extends StateNotifier<RewardsState> {
  RewardsViewModel(this._ref, this._getPendingUseCase, this._claimRewardsUseCase) : super(RewardsState.initial) {
    Future<void>.microtask(load);
  }

  final Ref _ref;
  final GetPendingRewardsUseCase _getPendingUseCase;
  final ClaimRewardsUseCase _claimRewardsUseCase;

  Future<void> _clearAuth(String reason) async {
    await _ref.read(authControllerProvider.notifier).signOut(reason: reason);
    state = state.copyWith(
      pendingRewards: const [],
      isLoading: false,
      isClaiming: false,
      error: reason,
      lastClaimTxHash: null,
    );
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await _getPendingUseCase.call();
    if (result.isSuccess) {
      state = state.copyWith(
        pendingRewards: result.data ?? [],
        isLoading: false,
        error: null,
      );
    } else {
      state = state.copyWith(
        isLoading: false,
        error: result.error,
      );
      if (result.statusCode == 401 || result.statusCode == 403) {
        await _clearAuth('Session expired. Please sign in again.');
      }
    }
  }

  Future<void> claimAll() async {
    if (state.pendingRewards.isEmpty || state.isClaiming) {
      return;
    }
    state = state.copyWith(isClaiming: true, error: null);
    final result = await _claimRewardsUseCase.call();
    if (result.isSuccess) {
      state = state.copyWith(
        pendingRewards: const [],
        isClaiming: false,
        lastClaimTxHash: result.data,
        error: null,
      );
    } else {
      state = state.copyWith(
        isClaiming: false,
        error: result.error,
      );
      if (result.statusCode == 401 || result.statusCode == 403) {
        await _clearAuth('Session expired. Please sign in again.');
      } else {
        await _clearAuth('Transaction failed. Please sign in again.');
      }
    }
  }
}

final rewardsViewModelProvider = StateNotifierProvider<RewardsViewModel, RewardsState>((ref) {
  return RewardsViewModel(
    ref,
    ref.read(getPendingRewardsUseCaseProvider),
    ref.read(claimRewardsUseCaseProvider),
  );
});
