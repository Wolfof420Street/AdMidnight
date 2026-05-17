/// ISegmentRepository — domain-layer interface for segment operations.
/// Implemented by data layer; depends on ISegmentRemoteDataSource.
library segment_repository;

import '../entities/segment_entity.dart';

abstract class ISegmentRepository {
  /// Fetch active campaign segments from backend.
  Future<List<SegmentEntity>> getActiveSegments();
}
