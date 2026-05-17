/// SegmentEntity — pure domain entity for ad segments.
/// No serialization; used internally by domain layer and ViewModels.
class SegmentEntity {
  final String id;
  final String campaignId;
  final List<double> centroid;
  final double threshold;
  final List<String> targetCategories;

  const SegmentEntity({
    required this.id,
    required this.campaignId,
    required this.centroid,
    required this.threshold,
    required this.targetCategories,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SegmentEntity &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          campaignId == other.campaignId &&
          threshold == other.threshold;

  @override
  int get hashCode => id.hashCode ^ campaignId.hashCode;
}
