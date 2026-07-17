import 'package:json_annotation/json_annotation.dart';

part 'address_model.g.dart';

@JsonSerializable()
class AddressModel {
  const AddressModel({
    required this.id,
    this.customerId,
    this.label = 'Home',
    this.line1 = '',
    this.line2,
    this.landmark,
    required this.city,
    required this.state,
    required this.pincode,
    @JsonKey(fromJson: _parseDouble)
    this.latitude,
    @JsonKey(fromJson: _parseDouble)
    this.longitude,
    this.isDefault = false,
  });

  final String id;
  final String? customerId;
  final String label;
  final String line1;
  final String? line2;
  final String? landmark;
  final String city;
  final String state;
  final String pincode;
  final double? latitude;
  final double? longitude;
  final bool isDefault;

  factory AddressModel.fromJson(Map<String, dynamic> json) =>
      _$AddressModelFromJson(json);

  Map<String, dynamic> toJson() => _$AddressModelToJson(this);

  String get formattedAddress {
    final parts = [line1, if (line2 != null) line2, city, state, pincode];
    return parts.join(', ');
  }
}

double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

