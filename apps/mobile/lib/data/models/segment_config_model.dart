/// SegmentConfigModel — DTO for ad segment definitions from backend.
/// Used by data layer; domain layer uses SegmentEntity.
class SegmentConfigModel {
  final String id;
  final String campaignId;
  final List<double> centroid;
  final double threshold;
  final List<String> targetCategories;

  SegmentConfigModel({
    required this.id,
    required this.campaignId,
    required this.centroid,
    required this.threshold,
    required this.targetCategories,
  });

  factory SegmentConfigModel.fromJson(Map<String, dynamic> json) => SegmentConfigModel(
        id: json['id'] as String,
        campaignId: json['campaignId'] as String,
        centroid: List<double>.from(json['centroid'] as List),
        threshold: (json['threshold'] as num).toDouble(),
        targetCategories: List<String>.from(json['targetCategories'] as List),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'campaignId': campaignId,
        'centroid': centroid,
        'threshold': threshold,
        'targetCategories': targetCategories,
      };
}
