class AppConfig {
  AppConfig._();

  static const String appName = 'FixHub';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://sculpture-confider-reconvene.ngrok-free.dev/api/v1', // Android emulator localhost
  );
  static const String googleMapsApiKey = String.fromEnvironment('GOOGLE_MAPS_API_KEY');
  static const String razorpayKeyId = String.fromEnvironment('RAZORPAY_KEY_ID');
}

