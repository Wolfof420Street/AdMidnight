import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import 'matching_view_model.dart';

class MatchingScreen extends ConsumerWidget {
  const MatchingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(matchingViewModelProvider);
    final controller = ref.read(matchingViewModelProvider.notifier);
    final isBusy = state.status == MatchingStatus.loadingSegments || state.status == MatchingStatus.generating;

    return Scaffold(
      appBar: AppBar(title: const Text('Private Ad Matching')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.proofPurple.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.proofPurple.withValues(alpha: 0.3)),
              ),
              child: const Text(
                'Zero-knowledge privacy active. Raw browsing data never leaves the device.',
              ),
            ),
            const SizedBox(height: 24),
            Container(
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: (state.status == MatchingStatus.matched
                        ? AppTheme.accent
                        : state.status == MatchingStatus.noMatch
                            ? Colors.redAccent
                            : AppTheme.proofPurple)
                    .withValues(alpha: 0.12),
              ),
              child: Center(
                child: Text(
                  state.status == MatchingStatus.matched
                      ? 'OK'
                      : state.status == MatchingStatus.noMatch
                          ? 'NO'
                          : 'ZK',
                  style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              state.message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: isBusy ? null : controller.runMatching,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.accent,
                foregroundColor: AppTheme.midnight,
              ),
              child: Text(
                isBusy ? 'Computing...' : 'Find Matching Ads Privately',
              ),
            ),
            const SizedBox(height: 24),
            if (state.errorDetail != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(
                  state.errorDetail!,
                  style: const TextStyle(color: Colors.redAccent),
                  textAlign: TextAlign.center,
                ),
              ),
            if (state.lastProof != null && state.lastProof!.isMatch)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'ZK Proof Generated',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text('Campaign: ${state.lastProof!.campaignId.substring(0, 10)}...'),
                      Text('Nullifier: ${state.lastProof!.nullifier.substring(0, 14)}...'),
                      const Text('User data transmitted: none'),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
