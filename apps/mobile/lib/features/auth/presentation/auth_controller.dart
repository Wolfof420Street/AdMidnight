import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/auth_repository.dart';

enum AuthStatus { unknown, authenticated, unauthenticated, loading }

class AuthState {
  final AuthStatus status;
  final String? error;

  const AuthState({required this.status, this.error});

  const AuthState.unknown() : this(status: AuthStatus.unknown);

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isReady => status != AuthStatus.unknown && status != AuthStatus.loading;

  AuthState copyWith({AuthStatus? status, String? error}) {
    return AuthState(
      status: status ?? this.status,
      error: error,
    );
  }
}

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._repo) : super(const AuthState.unknown()) {
    Future<void>.microtask(bootstrap);
  }

  final AuthRepository _repo;

  Future<void> bootstrap() async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    final token = await _repo.readSessionToken();
    state = state.copyWith(
      status: token == null || token.isEmpty ? AuthStatus.unauthenticated : AuthStatus.authenticated,
      error: null,
    );
  }

  Future<void> signIn({required String email, required String password}) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      await _repo.signIn(email: email, password: password);
      state = state.copyWith(status: AuthStatus.authenticated, error: null);
    } catch (error) {
      await _repo.clearSessionToken();
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: error is Error ? error.toString() : 'Unable to sign in',
      );
    }
  }

  Future<void> signOut({String? reason}) async {
    await _repo.clearSessionToken();
    state = state.copyWith(
      status: AuthStatus.unauthenticated,
      error: reason,
    );
  }
}
