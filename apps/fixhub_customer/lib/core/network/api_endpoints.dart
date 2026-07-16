/// FixHub API Endpoint Constants
///
/// All paths are relative to the base URL configured in AppConfig.
/// Base URL: http://localhost:3000/api/v1
class ApiEndpoints {
  ApiEndpoints._();

  // ── Auth ────────────────────────────────────────────────────
  static const String sendOtp = '/auth/send-otp';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String registerDevice = '/auth/device';

  // ── Customer ────────────────────────────────────────────────
  static const String customerProfile = '/customers/profile';
  static const String customerAddresses = '/customers/addresses';
  static String customerAddress(String id) => '/customers/addresses/$id';

  // ── Bookings ────────────────────────────────────────────────
  static const String bookings = '/bookings';
  static String bookingDetail(String id) => '/bookings/$id';
  static String cancelBooking(String id) => '/bookings/$id/cancel';
  static String bookingMedia(String id) => '/bookings/$id/media';

  // ── Service Catalog ─────────────────────────────────────────
  static const String categories = '/categories';
  static String categoryServices(String categoryId) =>
      '/categories/$categoryId/sub-services';
  static String subServiceDetail(String id) => '/sub-services/$id';

  // ── Payments ────────────────────────────────────────────────
  static String createOrder(String bookingId) =>
      '/payments/create-order/$bookingId';
  static const String verifyPayment = '/payments/verify';

  // ── Notifications ───────────────────────────────────────────
  static const String notifications = '/notifications';

  // ── Media ───────────────────────────────────────────────────
  static const String uploadUrl = '/media/upload-url';
}
