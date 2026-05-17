/// ApiService — single HTTP client for all backend calls.
/// DRY: every screen used its own fetch pattern before. Now centralised.
/// SRP: only HTTP concerns live here.
library api_service;

import 'package:dio/dio.dart';

class ApiError implements Exception {
  final int status;
  final String message;
  final String? requestId;

  ApiError({
    required this.status,
    required this.message,
    this.requestId,
  });

  @override
  String toString() => 'ApiError($status): $message${requestId != null ? ' (ID: $requestId)' : ''}';
}

class ApiService {
  late final Dio _dio;

  ApiService({
    required String baseUrl,
    required Future<String?> Function() tokenProvider,
  }) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenProvider();
          if (token != null && token.isNotEmpty) {
            options.headers.putIfAbsent('Authorization', () => 'Bearer $token');
          }
          handler.next(options);
        },
      ),
    );
  }

  Future<T> get<T>(
    String path, {
    required T Function(dynamic data) fromJson,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(path);
      final data = response.data;
      if (data == null) throw ApiError(status: 0, message: 'Empty response from $path');
      // Our API wraps in { success, data, timestamp, requestId }
      return fromJson(data['data']);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  Future<T> post<T>(
    String path, {
    required Map<String, dynamic> body,
    required T Function(dynamic data) fromJson,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: body);
      final data = response.data;
      if (data == null) throw ApiError(status: 0, message: 'Empty response from $path');
      return fromJson(data['data']);
    } on DioException catch (e) {
      throw _handleDioError(e);
    }
  }

  ApiError _handleDioError(DioException e) {
    final message =
        e.response?.data is Map ? (e.response!.data as Map<String, dynamic>)['message'] ?? e.message : e.message;
    return ApiError(
      status: e.response?.statusCode ?? 0,
      message: message?.toString() ?? 'Unknown error',
      requestId: e.response?.headers['x-request-id']?.firstOrNull,
    );
  }
}
