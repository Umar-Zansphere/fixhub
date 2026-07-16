class RouteNames {
  RouteNames._();

  // Auth Routes
  static const splash = '/splash';
  static const welcome = '/welcome';
  static const login = '/login';
  static const otp = '/otp';

  // Shell Routes (Bottom Navigation)
  static const home = '/home';
  static const bookings = '/bookings';
  static const support = '/support';
  static const profile = '/profile';

  // Feature Routes
  static const categoryServices = '/services/:id';
  static const serviceDetail = '/service-detail/:id';

  // Booking Flow Routes
  static const selectAddress = '/booking/address';
  static const selectSlot = '/booking/slot';
  static const bookingSummary = '/booking/summary';
  static const payment = '/booking/payment';
  static const bookingSuccess = '/booking/success';

  // Profile Routes
  static const editProfile = '/profile/edit';
  static const savedAddresses = '/profile/addresses';
}
