import 'package:json_annotation/json_annotation.dart';

part 'booking_timeline_model.g.dart';

@JsonSerializable()
class BookingTimelineModel {
  const BookingTimelineModel({
    required this.id,
    required this.bookingId,
    required this.status,
    required this.changedByUserId,
    this.note,
    this.latitude,
    this.longitude,
    required this.createdAt,
  });

  final String id;
  final String bookingId;
  final String status;
  final String changedByUserId;
  final String? note;
  @JsonKey(fromJson: _parseDouble)
  final double? latitude;
  @JsonKey(fromJson: _parseDouble)
  final double? longitude;
  final DateTime createdAt;

  factory BookingTimelineModel.fromJson(Map<String, dynamic> json) =>
      _$BookingTimelineModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookingTimelineModelToJson(this);
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}
