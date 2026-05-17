/// Segment data source implementations.
library segment_remote_datasource;

import '../../core/services/api_service.dart';
import '../models/segment_config_model.dart';

/// ISegmentRemoteDataSource — data layer interface for remote segment operations.
/// Handles HTTP calls to backend; returns models.
abstract class ISegmentRemoteDataSource {
  /// Fetch active segments from /user/segments/available endpoint.
  Future<List<SegmentConfigModel>> getActiveSegments();
}

/// SegmentRemoteDataSource — concrete implementation using ApiService.
class SegmentRemoteDataSource implements ISegmentRemoteDataSource {
  final ApiService _api;

  SegmentRemoteDataSource(this._api);

  @override
  Future<List<SegmentConfigModel>> getActiveSegments() async {
    final response = await _api.get<List<SegmentConfigModel>>(
      '/user/segments/available',
      fromJson: (data) {
        final campaigns = (data as List<dynamic>? ?? const []);
        return campaigns
            .cast<Map<String, dynamic>>()
            .map(
              (campaign) => SegmentConfigModel(
                id: campaign['segment']['id'] as String,
                campaignId: campaign['id'] as String,
                centroid: List<double>.from(
                  campaign['segment']['centroid'] as List<dynamic>,
                ),
                threshold: (campaign['segment']['similarityThreshold'] as num).toDouble(),
                targetCategories: List<String>.from(
                  campaign['segment']['targetCategories'] as List<dynamic>,
                ),
              ),
            )
            .toList();
      },
    );
    return response;
  }
}
