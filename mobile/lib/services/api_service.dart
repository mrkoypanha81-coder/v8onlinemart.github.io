import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/constants.dart';
import '../models/user.dart';

class ApiException implements Exception {
  final String message;
  final String code;

  ApiException({required this.message, required this.code});

  @override
  String toString() => 'ApiException: [$code] $message';
}

class ApiService {
  final _storage = const FlutterSecureStorage();
  final http.Client _client = http.Client();

  /// Helper to generate common JSON headers.
  Map<String, String> _getHeaders({String? token}) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Helper to handle JSON responses and parse potential errors.
  dynamic _processResponse(http.Response response) {
    final int statusCode = response.statusCode;
    Map<String, dynamic> body;
    
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      throw ApiException(
        message: 'Unable to parse server response.',
        code: AppErrors.serverError,
      );
    }

    if (statusCode >= 200 && statusCode < 300) {
      return body;
    } else {
      // Server returned an error structure
      final message = body['message'] ?? 'An error occurred';
      final code = body['code'] ?? AppErrors.serverError;
      throw ApiException(message: message, code: code);
    }
  }

  /// Write JWT token securely to storage.
  Future<void> saveToken(String token) async {
    await _storage.write(key: AppConfig.tokenKey, value: token);
  }

  /// Retrieve JWT token from secure storage.
  Future<String?> getToken() async {
    return await _storage.read(key: AppConfig.tokenKey);
  }

  /// Delete JWT token from secure storage (Logout).
  Future<void> deleteToken() async {
    await _storage.delete(key: AppConfig.tokenKey);
  }

  /// POST /api/auth/send-otp
  /// Returns retryAfter duration if successful.
  Future<int> sendOtp(String phone) async {
    try {
      final response = await _client.post(
        Uri.parse('${AppConfig.apiBaseUrl}/send-otp'),
        headers: _getHeaders(),
        body: jsonEncode({'phone': phone}),
      );

      final data = _processResponse(response);
      return data['data']?['retryAfter'] ?? 60;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Connection failed. Please check your internet connection.',
        code: AppErrors.serverError,
      );
    }
  }

  /// POST /api/auth/verify-otp
  /// Verifies OTP code. Stores JWT securely and returns verified User object.
  Future<User> verifyOtp(String phone, String otp) async {
    try {
      final response = await _client.post(
        Uri.parse('${AppConfig.apiBaseUrl}/verify-otp'),
        headers: _getHeaders(),
        body: jsonEncode({'phone': phone, 'otp': otp}),
      );

      final responseBody = _processResponse(response);
      final token = responseBody['data']?['token'];
      final userJson = responseBody['data']?['user'];

      if (token == null || userJson == null) {
        throw ApiException(
          message: 'Invalid server response structure.',
          code: AppErrors.serverError,
        );
      }

      // Securely store access token
      await saveToken(token);

      return User.fromJson(userJson);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Connection failed. Please check your internet connection.',
        code: AppErrors.serverError,
      );
    }
  }

  /// POST /api/auth/resend-otp
  /// Triggers a resend. Returns remaining retry time.
  Future<int> resendOtp(String phone) async {
    try {
      final response = await _client.post(
        Uri.parse('${AppConfig.apiBaseUrl}/resend-otp'),
        headers: _getHeaders(),
        body: jsonEncode({'phone': phone}),
      );

      final data = _processResponse(response);
      return data['data']?['retryAfter'] ?? 60;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Connection failed. Please check your internet connection.',
        code: AppErrors.serverError,
      );
    }
  }

  /// GET /api/auth/me
  /// Fetches profile using stored token. Returns user profile or null if unauthenticated.
  Future<User?> getCurrentUser() async {
    final token = await getToken();
    if (token == null) return null;

    try {
      final response = await _client.get(
        Uri.parse('${AppConfig.apiBaseUrl}/me'),
        headers: _getHeaders(token: token),
      );

      final responseBody = _processResponse(response);
      final userJson = responseBody['data']?['user'];
      
      if (userJson == null) return null;
      return User.fromJson(userJson);
    } catch (e) {
      // If unauthorized (invalid/expired token), wipe local token
      if (e is ApiException && e.code == AppErrors.unauthorized) {
        await deleteToken();
      }
      return null;
    }
  }

  /// Logs out the user by deleting credentials.
  Future<void> logout() async {
    await deleteToken();
  }
}
