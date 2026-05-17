import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../domain/auth_repository.dart';
import 'auth_remote_datasource.dart';

const _sessionTokenKey = 'admidnight.session_token';

class SecureAuthRepository implements AuthRepository {
  const SecureAuthRepository(this._remote, this._storage);

  final AuthRemoteDataSource _remote;
  final FlutterSecureStorage _storage;

  @override
  Future<String?> readSessionToken() => _storage.read(key: _sessionTokenKey);

  @override
  Future<void> saveSessionToken(String token) => _storage.write(key: _sessionTokenKey, value: token);

  @override
  Future<void> clearSessionToken() => _storage.delete(key: _sessionTokenKey);

  @override
  Future<void> signIn({required String email, required String password}) async {
    final token = await _remote.signIn(email: email, password: password);
    if (token.isEmpty) {
      throw StateError('Login did not return a session token');
    }

    await saveSessionToken(token);
  }
}
