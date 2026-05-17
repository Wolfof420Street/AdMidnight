import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../domain/user_profile_repository.dart';

const _profileKey = 'admidnight.user_profile';
const FlutterSecureStorage _storage = FlutterSecureStorage();

class SecureUserProfileRepository implements UserProfileRepository {
  const SecureUserProfileRepository();

  @override
  Future<UserProfileSnapshot> loadProfile() async {
    final raw = await _storage.read(key: _profileKey);
    if (raw == null) {
      final seeded = _defaultProfile();
      await saveProfile(seeded);
      return seeded;
    }

    return UserProfileSnapshot.fromJson(
      jsonDecode(raw) as Map<String, dynamic>,
    );
  }

  @override
  Future<UserProfileSnapshot> saveProfile(UserProfileSnapshot profile) async {
    final next = profile.copyWith(updatedAt: DateTime.now());
    await _storage.write(key: _profileKey, value: jsonEncode(next.toJson()));
    return next;
  }

  @override
  Future<UserProfileSnapshot> togglePrivacyMode(bool enabled) async {
    final current = await loadProfile();
    return saveProfile(
      current.copyWith(
        privacyModeEnabled: enabled,
        updatedAt: DateTime.now(),
      ),
    );
  }

  @override
  Future<void> clearProfile() async {
    await _storage.delete(key: _profileKey);
  }

  UserProfileSnapshot _defaultProfile() {
    return UserProfileSnapshot(
      topCategories: const ['SPORTS', 'TECH', 'GAMING'],
      embeddingDimensions: 128,
      engagementScore: 0.82,
      privacyModeEnabled: true,
      updatedAt: DateTime.now(),
    );
  }
}
