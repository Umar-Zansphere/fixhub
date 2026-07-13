class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String sendOtp = '/auth/otp/send';
  static const String verifyOtp = '/auth/otp/verify';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';

  // Customer
  static const String customerProfile = '/customers/profile';
  static const String customerAddresses = '/customers/addresses';

  // Bookings
  static const String bookings = '/bookings';
  static String bookingDetail(String id) => '/bookings/$id';

  // Services
  static const String categories = '/categories';
  static String subServices(String categoryId) => '/categories/$categoryId/sub-services';

  // Payments
  static String createOrder(String bookingId) => '/payments/create-order/$bookingId';
  static const String verifyPayment = '/payments/verify';

  // Notifications
  static const String notifications = '/notifications';

  // Media
  static const String uploadUrl = '/media/upload-url';
}
