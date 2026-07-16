import 'package:json_annotation/json_annotation.dart';
import '../../../../core/widgets/fixhub_status_chip.dart';
import 'address_model.dart';
import 'booking_timeline_model.dart';

part 'booking_model.g.dart';

@JsonSerializable()
class BookingModel {
  const BookingModel({
    required this.id,
    required this.customerId,
    this.technicianId,
    required this.serviceId,
    required this.addressId,
    required this.status,
    required this.scheduledAt,
    this.completedAt,
    required this.totalAmount,
    required this.paymentStatus,
    this.notes,
    this.address,
    this.timeline = const [],
  });

  final String id;
  final String customerId;
  final String? technicianId;
  final String serviceId;
  final String addressId;
  final String status;
  final DateTime scheduledAt;
  final DateTime? completedAt;
  final double totalAmount;
  final String paymentStatus;
  final String? notes;
  final AddressModel? address;
  final List<BookingTimelineModel> timeline;

  factory BookingModel.fromJson(Map<String, dynamic> json) =>
      _$BookingModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookingModelToJson(this);

  String get formattedTotal => '₹${totalAmount.toStringAsFixed(0)}';

  BookingStatusType get statusType {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return BookingStatusType.pending;
      case 'CONFIRMED':
        return BookingStatusType.confirmed;
      case 'ASSIGNED':
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
