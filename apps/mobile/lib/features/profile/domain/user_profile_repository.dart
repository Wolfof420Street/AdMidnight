// Domain: pure Dart entity and repository interface for user profile.

class UserProfileSnapshot {
  final List<String> topCategories;
  final int embeddingDimensions;
  final double engagementScore;
  final bool privacyModeEnabled;
  final DateTime updatedAt;

  const UserProfileSnapshot({
    required this.topCategories,
    required this.embeddingDimensions,
    required this.engagementScore,
    required this.privacyModeEnabled,
    required this.updatedAt,
  });

  Map<String, Object?> toJson() {
    return {
      'topCategories': topCategories,
      'embeddingDimensions': embeddingDimensions,
      'engagementScore': engagementScore,
      'privacyModeEnabled': privacyModeEnabled,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory UserProfileSnapshot.fromJson(Map<String, dynamic> json) {
    return UserProfileSnapshot(
      topCategories: List<String>.from(json['topCategories'] as List<dynamic>),
      embeddingDimensions: json['embeddingDimensions'] as int,
      engagementScore: (json['engagementScore'] as num).toDouble(),
      privacyModeEnabled: json['privacyModeEnabled'] as bool,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  UserProfileSnapshot copyWith({
    List<String>? topCategories,
    int? embeddingDimensions,
    double? engagementScore,
    bool? privacyModeEnabled,
    DateTime? updatedAt,
  }) {
    return UserProfileSnapshot(
      topCategories: topCategories ?? this.topCategories,
      embeddingDimensions: embeddingDimensions ?? this.embeddingDimensions,
      engagementScore: engagementScore ?? this.engagementScore,
      privacyModeEnabled: privacyModeEnabled ?? this.privacyModeEnabled,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

abstract class UserProfileRepository {
  Future<UserProfileSnapshot> loadProfile();
  Future<UserProfileSnapshot> saveProfile(UserProfileSnapshot profile);
  Future<UserProfileSnapshot> togglePrivacyMode(bool enabled);
  Future<void> clearProfile();
}
