import 'package:json_annotation/json_annotation.dart';

part 'service_area_validation_model.g.dart';

@JsonSerializable(fieldRename: FieldRename.none)
class ServiceAreaValidationModel {
  const ServiceAreaValidationModel({
    required this.pincode,
    required this.isCovered,
    required this.isServiceable,
    required this.hasTechnicianCoverage,
    required this.activeTechnicianCount,
    required this.reason,
  });

  @JsonKey(fromJson: _pincodeFromJson)
  final String pincode;
  final bool isCovered;
  final bool isServiceable;
  final bool hasTechnicianCoverage;
  final int activeTechnicianCount;
  final String reason;

  factory ServiceAreaValidationModel.fromJson(Map<String, dynamic> json) =>
      _$ServiceAreaValidationModelFromJson(json);

  Map<String, dynamic> toJson() => _$ServiceAreaValidationModelToJson(this);
}

String _pincodeFromJson(Object? value) => value?.toString() ?? '';
