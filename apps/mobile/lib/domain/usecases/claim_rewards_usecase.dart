import '../usecases/usecase_result.dart';
import '../../core/services/api_service.dart';
import '../../domain/repositories/proof_repositories.dart';
import 'get_pending_rewards_usecase.dart';

class ClaimRewardsUseCase {
  ClaimRewardsUseCase(this._repo, this._getPending);

  final IRewardClaimRepository _repo;
  final GetPendingRewardsUseCase _getPending;

  /// Claims all pending rewards and returns a UseCaseResult wrapping the last claim tx hash.
  Future<UseCaseResult<String?>> call() async {
    final pendingResult = await _getPending.call();
    if (!pendingResult.isSuccess) {
      return UseCaseResult.failure(
        pendingResult.error ?? 'Failed to fetch pending rewards',
        statusCode: pendingResult.statusCode,
      );
    }

    final pending = pendingResult.data ?? [];
    if (pending.isEmpty) return const UseCaseResult.success(null);

    try {
      String? lastTx;
      for (final reward in pending) {
        final result = await _repo.claim(reward.nullifier, '');
        lastTx = result.claimTxHash;
      }
      return UseCaseResult.success(lastTx);
    } on ApiError catch (error) {
      return UseCaseResult.failure(error.message, statusCode: error.status);
    } catch (e) {
      return UseCaseResult.failure(e.toString());
    }
  }
}
