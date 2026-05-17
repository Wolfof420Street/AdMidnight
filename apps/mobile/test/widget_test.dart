// Minimal Flutter widget test scaffold for proof engine
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:admidnight_mobile/features/home/presentation/home_screen.dart';
import 'package:admidnight_mobile/features/profile/domain/user_profile_repository.dart';
import 'package:admidnight_mobile/providers.dart';

class _SmokeProfileRepository implements UserProfileRepository {
  const _SmokeProfileRepository();

  @override
  Future<void> clearProfile() async {}

  @override
  Future<UserProfileSnapshot> loadProfile() async => UserProfileSnapshot(
        topCategories: const ['SPORTS', 'TECH'],
        embeddingDimensions: 128,
        engagementScore: 0.9,
        privacyModeEnabled: true,
        updatedAt: DateTime.utc(2026, 5, 16),
      );

  @override
  Future<UserProfileSnapshot> saveProfile(UserProfileSnapshot profile) async => profile;

  @override
  Future<UserProfileSnapshot> togglePrivacyMode(bool enabled) async =>
      (await loadProfile()).copyWith(privacyModeEnabled: enabled);
}

void main() {
  test('cosine similarity and proof envelope placeholder', () {
    expect(1 + 1, 2);
  });

  testWidgets('main dashboard screen renders without exceptions', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          userProfileRepositoryProvider.overrideWithValue(const _SmokeProfileRepository()),
          dashboardSummaryProvider.overrideWith((ref) async => DashboardSummary(
                profile: await ref.read(userProfileRepositoryProvider).loadProfile(),
                pendingRewards: const [],
              )),
        ],
        child: const MaterialApp(home: HomeScreen()),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Match Ads'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
