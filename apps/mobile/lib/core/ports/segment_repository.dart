/// ISegmentRepository — fetches public segment definitions from backend.
/// SRP: only segment fetching. DIP: screens depend on this, not ApiService.
abstract class ISegmentRepository {
  Future<List<SegmentConfig>> getActiveSegments();
}

class SegmentConfig {
  final String id;
  final String campaignId;
  final List<double> centroid;
  final double threshold;
  final List<String> targetCategories;

  SegmentConfig({
    required this.id,
    required this.campaignId,
    required this.centroid,
    required this.threshold,
    required this.targetCategories,
  });

  factory SegmentConfig.fromJson(Map<String, dynamic> json) => SegmentConfig(
        id: json['id'] as String,
        campaignId: json['campaignId'] as String,
        centroid: List<double>.from(json['centroid'] as List),
        threshold: (json['threshold'] as num).toDouble(),
        targetCategories: List<String>.from(json['targetCategories'] as List),
      );
}
