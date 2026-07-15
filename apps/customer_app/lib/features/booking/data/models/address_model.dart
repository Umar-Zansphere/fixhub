import 'package:json_annotation/json_annotation.dart';

part 'address_model.g.dart';

@JsonSerializable()
class AddressModel {
  const AddressModel({
    required this.id,
    required this.type,
    required this.street,
    required this.city,
    required this.state,
    required this.pincode,
    required this.country,
    this.latitude,
    this.longitude,
    this.isDefault = false,
  });

  final String id;
  final String type; // HOME, OFFICE, OTHER
  final String street;
  final String city;
  final String state;
  final String pincode;
  final String country;
  final double? latitude;
  final double? longitude;
  final bool isDefault;

  factory AddressModel.fromJson(Map<String, dynamic> json) =>
      _$AddressModelFromJson(json);

  Map<String, dynamic> toJson() => _$AddressModelToJson(this);

  String get formattedAddress => '$street, $city, $state - $pincode';
}
