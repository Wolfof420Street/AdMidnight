abstract class AuthRepository {
  Future<String?> readSessionToken();
  Future<void> saveSessionToken(String token);
  Future<void> clearSessionToken();
  Future<void> signIn({required String email, required String password});
}
