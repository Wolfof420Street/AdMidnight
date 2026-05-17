import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/matching/presentation/matching_screen.dart';
import '../../features/auth/presentation/auth_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/rewards/presentation/rewards_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/auth',
    redirect: (context, state) {
      final isOnAuthRoute = state.matchedLocation == '/auth';
      if (!authState.isReady) {
        return isOnAuthRoute ? null : '/auth';
      }

      if (!authState.isAuthenticated) {
        return isOnAuthRoute ? null : '/auth';
      }

      if (isOnAuthRoute) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/auth', builder: (_, __) => const AuthScreen()),
      GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/match', builder: (_, __) => const MatchingScreen()),
      GoRoute(path: '/rewards', builder: (_, __) => const RewardsScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    ],
  );
});
