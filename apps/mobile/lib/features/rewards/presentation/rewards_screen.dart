import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import 'rewards_view_model.dart';

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(rewardsViewModelProvider);
    final controller = ref.read(rewardsViewModelProvider.notifier);
    final claimableCount = state.pendingRewards.length;

    return Scaffold(
      appBar: AppBar(title: const Text('Anonymous Rewards')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppTheme.accent.withValues(alpha: 0.18),
                  AppTheme.proofPurple.withValues(alpha: 0.10),
                ],
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.accent.withValues(alpha: 0.2)),
            ),
            child: state.isLoading
                ? const SizedBox(
                    height: 140,
                    child: Center(child: CircularProgressIndicator()),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Available to Claim',
                        style: TextStyle(color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${state.claimableMidnight} tMIDN',
                        style: const TextStyle(
                          fontSize: 30,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        '$claimableCount rewards escrowed behind anonymous nullifiers.',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                      if (state.error != null) ...[
                        const SizedBox(height: 10),
                        Text(
                          state.error!,
                          style: const TextStyle(color: Colors.redAccent),
                        ),
                      ],
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: state.isClaiming
                            ? null
                            : () async {
                                await controller.claimAll();
                                if (!context.mounted) {
                                  return;
                                }

                                final latestState = ref.read(rewardsViewModelProvider);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      latestState.lastClaimTxHash == null
                                          ? 'Claim submitted.'
                                          : 'Claim submitted: ${latestState.lastClaimTxHash}',
                                    ),
                                  ),
                                );
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.accent,
                          foregroundColor: AppTheme.midnight,
                        ),
                        child: Text(
                          state.isClaiming ? 'Claiming...' : 'Claim Anonymously',
                        ),
                      ),
                    ],
                  ),
          ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Reward History',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 12),
                  if (state.isLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (state.pendingRewards.isEmpty)
                    const Text(
                      'No pending rewards. Claimed rewards remain unlinkable to your identity.',
                      style: TextStyle(color: AppTheme.textSecondary),
                    )
                  else
                    Column(
                      children: state.pendingRewards
                          .map(
                            (item) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 10,
                                    height: 10,
                                    margin: const EdgeInsets.only(top: 6),
                                    decoration: const BoxDecoration(
                                      color: AppTheme.accent,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.campaignId,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                        Text(
                                          '${item.amount} tMIDN • CLAIMABLE',
                                          style: const TextStyle(
                                            color: AppTheme.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    _formatDate(item.escrowedAt.toIso8601String()),
                                    style: const TextStyle(
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                          .toList(),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Privacy Note',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Rewards are linked to proof nullifiers, not your identity. Claim operations should submit only ZK proof material and the anonymous reward identifier.',
                    style: TextStyle(color: AppTheme.textSecondary, height: 1.5),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String isoTimestamp) {
    final earnedAt = DateTime.tryParse(isoTimestamp);
    if (earnedAt == null) {
      return '--/--';
    }
    return '${earnedAt.month}/${earnedAt.day}';
  }
}
