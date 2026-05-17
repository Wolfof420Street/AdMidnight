/// SegmentRepositoryImpl — concrete repository implementing domain interface.
/// Converts models from data sources to domain entities.
library segment_repository_impl;

import '../../domain/entities/segment_entity.dart';
import '../../domain/repositories/segment_repository.dart';
import '../datasources/segment_remote_datasource.dart';

class SegmentRepositoryImpl implements ISegmentRepository {
  final ISegmentRemoteDataSource _remoteDataSource;

  SegmentRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<SegmentEntity>> getActiveSegments() async {
    final models = await _remoteDataSource.getActiveSegments();
    return models
        .map((model) => SegmentEntity(
              id: model.id,
              campaignId: model.campaignId,
              centroid: model.centroid,
              threshold: model.threshold,
              targetCategories: model.targetCategories,
            ))
        .toList();
  }
}
