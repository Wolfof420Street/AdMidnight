/// SegmentApiRepository — implements ISegmentRepository via ApiService.
/// DIP: MatchingScreen depends on ISegmentRepository, not this concrete class.
library segment_api_repository;

import '../ports/segment_repository.dart';
import '../services/api_service.dart';

class SegmentApiRepository implements ISegmentRepository {
  final ApiService _api;

  SegmentApiRepository(this._api);

  @override
  Future<List<SegmentConfig>> getActiveSegments() async {
    final response = await _api.get<List<SegmentConfig>>(
      '/user/segments/available',
      fromJson: (data) {
        final campaigns = (data as List<dynamic>? ?? const []);
        return campaigns
            .cast<Map<String, dynamic>>()
            .map(
              (campaign) => SegmentConfig(
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
