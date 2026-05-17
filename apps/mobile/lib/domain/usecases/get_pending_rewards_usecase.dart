import '../usecases/usecase_result.dart';
import '../../domain/repositories/proof_repositories.dart';
import '../../domain/entities/proof_entities.dart';
import '../../core/services/api_service.dart';

class GetPendingRewardsUseCase {
  GetPendingRewardsUseCase(this._repo);

  final IRewardClaimRepository _repo;

  Future<UseCaseResult<List<PendingRewardEntity>>> call() async {
    try {
      final rewards = await _repo.getPendingRewards();
      return UseCaseResult.success(rewards);
    } on ApiError catch (error) {
      return UseCaseResult.failure(error.message, statusCode: error.status);
    } catch (e) {
      return UseCaseResult.failure(e.toString());
    }
  }
}
