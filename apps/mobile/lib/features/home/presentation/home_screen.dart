import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(dashboardSummaryProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              dashboardAsync.when(
                data: (summary) => Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.proofPurple.withValues(alpha: 0.18),
                        AppTheme.accent.withValues(alpha: 0.08),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Your data stays on your device. AdMidnight matches locally with ZK proofs.'),
                      const SizedBox(height: 10),
                      Text(
                        'Profile: ${summary.profile.topCategories.join(', ')}',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                      Text(
                        'Claimable rewards: ${summary.claimableMidnight} tMIDN',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ],
                  ),
                ),
                loading: () => Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.midnightCard,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const SizedBox(
                    height: 56,
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ),
                error: (error, _) => Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.midnightCard,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Colors.redAccent.withValues(alpha: 0.35)),
                  ),
                  child: Text(
                    'Failed to load dashboard summary: $error',
                    style: const TextStyle(color: Colors.redAccent),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.3,
                  children: [
                    _ActionCard(
                      title: 'Match Ads',
                      subtitle: 'Private on-device',
                      color: AppTheme.accent,
                      onTap: () => context.go('/match'),
                    ),
                    _ActionCard(
                      title: 'My Rewards',
                      subtitle: 'Anonymous claim',
                      color: AppTheme.proofPurple,
                      onTap: () => context.go('/rewards'),
                    ),
                    _ActionCard(
                      title: 'My Profile',
                      subtitle: 'Local only',
                      color: Colors.blueAccent,
                      onTap: () => context.go('/profile'),
                    ),
                    const _ActionCard(
                      title: 'ZK Stats',
                      subtitle: 'Public proofs',
                      color: Colors.orangeAccent,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback? onTap;

  const _ActionCard({
    required this.title,
    required this.subtitle,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.midnightCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(color: AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }
}
