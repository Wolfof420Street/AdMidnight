import 'package:dio/dio.dart';

class AuthRemoteDataSource {
  AuthRemoteDataSource({required String baseUrl})
      : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 20),
            headers: {'Content-Type': 'application/json'},
          ),
        );

  final Dio _dio;

  Future<String> signIn({required String email, required String password}) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/auth/login',
      options: Options(headers: {'X-Client': 'mobile'}),
      data: {
        'email': email,
        'password': password,
      },
    );

    final data = response.data?['data'];
    if (data is Map<String, dynamic>) {
      return data['token'] as String? ?? '';
    }

    return '';
  }
}
