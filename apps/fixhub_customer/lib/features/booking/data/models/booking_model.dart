import 'package:json_annotation/json_annotation.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';
import 'address_model.dart';
import 'booking_timeline_model.dart';

part 'booking_model.g.dart';

@JsonSerializable()
class BookingModel {
  const BookingModel({
    required this.id,
    required this.bookingNumber,
    required this.customerId,
    this.technicianId,
    required this.subServiceId,
    required this.addressId,
    required this.status,
    required this.scheduledDate,
    required this.scheduledSlot,
    this.description,
    @JsonKey(fromJson: _parseDouble)
    required this.totalAmount,
    this.notes,
    this.completedAt,
    this.cancelledAt,
    this.cancelledBy,
    this.cancelReason,
    this.failedAt,
    this.failureReason,
    this.address,
    this.subService,
    this.technician,
    this.timeline = const [],
  });

  final String id;
  final String bookingNumber;
  final String customerId;
  final String? technicianId;
  final String subServiceId;
  final String addressId;
  final String status;
  final DateTime scheduledDate;
  final String scheduledSlot;
  final String? description;
  final double totalAmount;
  final String? notes;
  final DateTime? completedAt;
  final DateTime? cancelledAt;
  final String? cancelledBy;
  final String? cancelReason;
  final DateTime? failedAt;
  final String? failureReason;
  
  // Relations
  final AddressModel? address;
  final Map<String, dynamic>? subService;
  final Map<String, dynamic>? technician;
  final List<BookingTimelineModel> timeline;

  factory BookingModel.fromJson(Map<String, dynamic> json) =>
      _$BookingModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookingModelToJson(this);

  String get formattedTotal => '₹${totalAmount.toStringAsFixed(0)}';
  
  // This helps when payment info is nested or needs to be derived. 
  // Let's assume payment is handled via related payment object or defaults to PENDING
  String get paymentStatus => 'PENDING'; 

  BookingStatusType get statusType {
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return BookingStatusType.pending;
      case 'PENDING_PAYMENT':
        return BookingStatusType.pending;
      case 'CONFIRMED':
        return BookingStatusType.confirmed;
      case 'ASSIGNED':
        return BookingStatusType.assigned;
      case 'ACCEPTED':
        return BookingStatusType.assigned;
      case 'EN_ROUTE':
        return BookingStatusType.enRoute;
      case 'ARRIVED':
        return BookingStatusType.arrived;
      case 'IN_PROGRESS':
        return BookingStatusType.inProgress;
      case 'COMPLETED':
        return BookingStatusType.completed;
      case 'CANCELLED':
        return BookingStatusType.cancelled;
      case 'FAILED':
        return BookingStatusType.failed;
      default:
        return BookingStatusType.pending;
    }
  }

  String get displayStatus {
    switch (statusType) {
      case BookingStatusType.pending: return 'Pending';
      case BookingStatusType.confirmed: return 'Confirmed';
      case BookingStatusType.assigned: return 'Assigned';
      case BookingStatusType.enRoute: return 'On the way';
      case BookingStatusType.arrived: return 'Arrived';
      case BookingStatusType.inProgress: return 'In Progress';
      case BookingStatusType.completed: return 'Completed';
      case BookingStatusType.cancelled: return 'Cancelled';
      case BookingStatusType.failed: return 'Failed';
    }
  }
}

double _parseDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}
