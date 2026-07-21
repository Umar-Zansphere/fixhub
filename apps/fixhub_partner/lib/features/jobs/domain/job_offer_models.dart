/// Domain models for job offers (broadcast eligibility system)

class OfferBookingAddress {
  final String? label;
  final String line1;
  final String city;
  final String pincode;
  final double? latitude;
  final double? longitude;

  const OfferBookingAddress({
    this.label,
    required this.line1,
    required this.city,
    required this.pincode,
    this.latitude,
    this.longitude,
  });

  factory OfferBookingAddress.fromJson(Map<String, dynamic> json) =>
      OfferBookingAddress(
        label: json['label'] as String?,
        line1: json['line1'] as String? ?? '',
        city: json['city'] as String? ?? '',
        pincode: json['pincode'] as String? ?? '',
        latitude: json['latitude'] != null
            ? double.tryParse(json['latitude'].toString())
            : null,
        longitude: json['longitude'] != null
            ? double.tryParse(json['longitude'].toString())
            : null,
      );

  String get shortAddress => '$line1, $city — $pincode';
}

class OfferSubService {
  final String id;
  final String name;
  final String? categoryName;
  final double? basePrice;
  final int? estimatedDurationMins;

  const OfferSubService({
    required this.id,
    required this.name,
    this.categoryName,
    this.basePrice,
    this.estimatedDurationMins,
  });

  factory OfferSubService.fromJson(Map<String, dynamic> json) {
    final cat = json['category'] as Map<String, dynamic>?;
    return OfferSubService(
      id: json['id'] as String,
      name: json['name'] as String,
      categoryName: cat?['name'] as String?,
      basePrice: json['basePrice'] != null
          ? double.tryParse(json['basePrice'].toString())
          : null,
      estimatedDurationMins: json['estimatedDurationMins'] as int?,
    );
  }
}

class OfferBooking {
  final String id;
  final String bookingNumber;
  final DateTime scheduledDate;
  final String scheduledSlot;
  final double totalAmount;
  final OfferSubService subService;
  final OfferBookingAddress address;

  const OfferBooking({
    required this.id,
    required this.bookingNumber,
    required this.scheduledDate,
    required this.scheduledSlot,
    required this.totalAmount,
    required this.subService,
    required this.address,
  });

  factory OfferBooking.fromJson(Map<String, dynamic> json) => OfferBooking(
        id: json['id'] as String,
        bookingNumber: json['bookingNumber'] as String,
        scheduledDate: DateTime.parse(json['scheduledDate'] as String),
        scheduledSlot: json['scheduledSlot'] as String,
        totalAmount: double.tryParse(json['totalAmount'].toString()) ?? 0,
        subService: OfferSubService.fromJson(
            json['subService'] as Map<String, dynamic>),
        address:
            OfferBookingAddress.fromJson(json['address'] as Map<String, dynamic>),
      );
}

class JobOffer {
  final String id;
  final String bookingId;
  final String status; // PENDING, ACCEPTED, REJECTED, EXPIRED
  final DateTime offeredAt;
  final DateTime expiresAt;
  final OfferBooking booking;

  const JobOffer({
    required this.id,
    required this.bookingId,
    required this.status,
    required this.offeredAt,
    required this.expiresAt,
    required this.booking,
  });

  factory JobOffer.fromJson(Map<String, dynamic> json) => JobOffer(
        id: json['id'] as String,
        bookingId: json['bookingId'] as String,
        status: json['status'] as String? ?? 'PENDING',
        offeredAt: DateTime.parse(json['offeredAt'] as String),
        expiresAt: DateTime.parse(json['expiresAt'] as String),
        booking: OfferBooking.fromJson(json['booking'] as Map<String, dynamic>),
      );

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  /// Remaining time until offer expires.
  Duration get timeRemaining {
    final remaining = expiresAt.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }
}
