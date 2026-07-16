import 'package:json_annotation/json_annotation.dart';

part 'booking_timeline_model.g.dart';

@JsonSerializable()
class BookingTimelineModel {
  const BookingTimelineModel({
    required this.status,
    required this.timestamp,
    this.description,
  });

  final String status;
  final DateTime timestamp;
  final String? description;

  factory BookingTimelineModel.fromJson(Map<String, dynamic> json) =>
      _$BookingTimelineModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookingTimelineModelToJson(this);
}
