import 'package:flutter/material.dart';

class AppConfig {
  // Use 10.0.2.2 to connect from Android Emulator to the local development server.
  // Use localhost (127.0.0.1) if running on iOS Simulators.
  static const String apiBaseUrl = 'http://10.0.2.2:5000/api/auth';
  // static const String apiBaseUrl = 'http://localhost:5000/api/auth';

  // Secure Storage keys
  static const String tokenKey = 'jwt_auth_token';
}

/// Premium Custom Color Palette
class AppColors {
  static const Color primary = Color(0xFF0F172A); // Slate 900
  static const Color primaryLight = Color(0xFF1E293B); // Slate 800
  static const Color accent = Color(0xFFD97706); // Amber 600
  static const Color background = Color(0xFFF8FAFC); // Slate 50
  static const Color cardBg = Colors.white;
  static const Color textDark = Color(0xFF0F172A);
  static const Color textLight = Color(0xFF64748B); // Slate 500
  static const Color border = Color(0xFFE2E8F0); // Slate 200
  static const Color success = Color(0xFF10B981); // Emerald 500
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color disabled = Color(0xFFCBD5E1); // Slate 300
}

/// Standardized error codes matching server
class AppErrors {
  static const String invalidPhone = 'INVALID_PHONE';
  static const String otpSendFailed = 'OTP_SEND_FAILED';
  static const String otpRateLimited = 'OTP_RATE_LIMITED';
  static const String otpExpired = 'OTP_EXPIRED';
  static const String otpInvalid = 'OTP_INVALID';
  static const String otpTooManyAttempts = 'OTP_TOO_MANY_ATTEMPTS';
  static const String phoneAlreadyVerified = 'PHONE_ALREADY_VERIFIED';
  static const String unauthorized = 'UNAUTHORIZED';
  static const String serverError = 'SERVER_ERROR';

  static String getFriendlyMessage(String errorCode, {String defaultMessage = 'An error occurred'}) {
    switch (errorCode) {
      case invalidPhone:
        return 'Please check your phone number. It must be in a valid format.';
      case otpSendFailed:
        return 'Failed to send SMS code. Please verify your connection and try again.';
      case otpRateLimited:
        return 'Too many requests. Please wait a bit before requesting a new code.';
      case otpExpired:
        return 'The code has expired. Please request a new verification code.';
      case otpInvalid:
        return 'Incorrect verification code. Please check and try again.';
      case otpTooManyAttempts:
        return 'Too many incorrect attempts. This verification code has been locked.';
      case phoneAlreadyVerified:
        return 'This phone number is already verified.';
      case unauthorized:
        return 'Session expired. Please log in again.';
      case serverError:
        return 'Server error. Please try again later.';
      default:
        return defaultMessage;
    }
  }
}
