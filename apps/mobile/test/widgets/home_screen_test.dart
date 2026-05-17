import 'dart:async';

import 'package:admidnight_mobile/features/home/presentation/home_screen.dart';
import 'package:admidnight_mobile/providers.dart';
import 'package:admidnight_mobile/domain/entities/proof_entities.dart';
import 'package:admidnight_mobile/features/profile/domain/user_profile_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeProfileRepository implements UserProfileRepository {
  FakeProfileRepository(this.profile);

  final UserProfileSnapshot profile;

  @override
  Future<void> clearProfile() async {}

  @override
  Future<UserProfileSnapshot> loadProfile() async => profile;

  @override
  Future<UserProfileSnapshot> saveProfile(UserProfileSnapshot profile) async => profile;

  @override
  Future<UserProfileSnapshot> togglePrivacyMode(bool enabled) async => profile.copyWith(privacyModeEnabled: enabled);
}

Widget _wrap(Widget child, List<Override> overrides) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(home: child),
  );
}

void main() {
  final profile = UserProfileSnapshot(
    topCategories: const ['SPORTS', 'TECH'],
    embeddingDimensions: 128,
    engagementScore: 0.92,
    privacyModeEnabled: true,
    updatedAt: DateTime.utc(2026, 5, 16),
  );

  final summary = DashboardSummary(
    profile: profile,
    pendingRewards: [
      PendingRewardEntity(
        nullifier: '0x1',
        amount: '5',
        campaignId: 'campaign-1',
        escrowedAt: DateTime.utc(2026, 5, 16),
      ),
    ],
  );

  testWidgets('renders success state without throwing', (tester) async {
    await tester.pumpWidget(
      _wrap(
        const HomeScreen(),
        [
          userProfileRepositoryProvider.overrideWithValue(FakeProfileRepository(profile)),
          dashboardSummaryProvider.overrideWith((ref) async => summary),
        ],
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Match Ads'), findsOneWidget);
    expect(find.textContaining('Claimable rewards: 5 tMIDN'), findsOneWidget);
  });

  testWidgets('renders loading state without throwing', (tester) async {
    final completer = Completer<DashboardSummary>();

    await tester.pumpWidget(
      _wrap(
        const HomeScreen(),
        [
          dashboardSummaryProvider.overrideWith((ref) => completer.future),
        ],
      ),
    );

    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('renders error state without throwing', (tester) async {
    await tester.pumpWidget(
      _wrap(
        const HomeScreen(),
        [
          dashboardSummaryProvider.overrideWith((ref) => Future<DashboardSummary>.error(StateError('boom'))),
        ],
      ),
    );

    await tester.pumpAndSettle();

    expect(find.textContaining('Failed to load dashboard summary'), findsOneWidget);
  });
}
