import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  AppConfig._();

  static const String appName = 'FixHub';
  static const String appVersion = '1.0.0';

  /// API base URL — falls back to emulator localhost in development.
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:3000/api/v1';

  static String get googleMapsApiKey =>
      dotenv.env['GOOGLE_MAPS_API_KEY'] ?? '';

  static String get razorpayKeyId => dotenv.env['RAZORPAY_KEY_ID'] ?? '';

  /// True in debug builds or when explicitly set via env variable.
  static bool get isDevelopment =>
      kDebugMode || (dotenv.env['ENVIRONMENT'] ?? '').toLowerCase() == 'dev';

  /// True only in release builds with ENVIRONMENT=production.
  static bool get isProduction =>
      kReleaseMode &&
      (dotenv.env['ENVIRONMENT'] ?? '').toLowerCase() == 'production';
}
