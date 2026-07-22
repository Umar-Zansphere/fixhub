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
  static const String bookingDraft = '/bookings/draft';
  static const String bookingSummary = '/bookings/summary';
  static const String availableSlots = '/bookings/available-slots';
  static String bookingConfirm(String id) => '/bookings/$id/confirm';
  static String bookingDetail(String id) => '/bookings/$id';
  static String bookingMedia(String id) => '/bookings/$id/media';
  static String bookingMediaBatch(String id) => '/bookings/$id/media/batch';
  static String bookingStatus(String id) => '/bookings/$id/status';
  static const String bookingHistory = '/bookings/history';
  static String bookingReview(String id) => '/bookings/$id/review';
  static String bookingApproveRevision(String id) => '/bookings/$id/approve-revision';
  static String bookingRejectRevision(String id) => '/bookings/$id/reject-revision';

  // ── Service Catalog ─────────────────────────────────────────
  // Backend CatalogController is registered under @Controller('catalog')
  // → Full paths: /catalog/categories, /catalog/services, /catalog/services/:id
  static const String categories = '/catalog/categories';
  static const String services = '/catalog/services';
  static String categoryServices(String categoryId) =>
      '/catalog/services?categoryId=$categoryId';
  static String subServiceDetail(String id) => '/catalog/services/$id';

  // ── Payments ────────────────────────────────────────────────
  static String createOrder(String bookingId) =>
      '/payments/create-order/$bookingId';
  static const String verifyPayment = '/payments/verify';

  // ── Notifications ───────────────────────────────────────────
  static const String notifications = '/notifications';
  static String notificationRead(String id) => '/notifications/$id/read';
  static const String notificationReadAll = '/notifications/read-all';
  static const String notificationPreferences = '/notifications/preferences';

  // ── Media ───────────────────────────────────────────────────
  static const String uploadUrl = '/media/upload-url';

  // ── Service Areas ───────────────────────────────────────────
  static const String serviceAreas = '/service-areas';
  static const String validateServiceArea = '/service-areas/validate';
}
