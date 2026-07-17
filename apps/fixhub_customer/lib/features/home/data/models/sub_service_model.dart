import 'package:json_annotation/json_annotation.dart';

part 'sub_service_model.g.dart';

@JsonSerializable()
class SubServiceModel {
  const SubServiceModel({
    required this.id,
    required this.categoryId,
    required this.name,
    required this.slug,
    this.description,
    required this.basePrice,
    required this.estimatedDurationMins,
    this.iconUrl,
    required this.isActive,
    this.sortOrder = 0,
    this.category,
  });

  final String id;
  final String categoryId;
  final String name;
  final String slug;
  final String? description;
  @JsonKey(fromJson: _parseDouble)
  final double basePrice;
  final int estimatedDurationMins;
  final String? iconUrl;
  final bool isActive;
  final int sortOrder;
  final SubServiceCategory? category;

  factory SubServiceModel.fromJson(Map<String, dynamic> json) =>
      _$SubServiceModelFromJson(json);

  Map<String, dynamic> toJson() => _$SubServiceModelToJson(this);

  String get formattedPrice => '₹${basePrice.toStringAsFixed(0)}';

  String get formattedDuration {
    if (estimatedDurationMins >= 60) {
      final hours = estimatedDurationMins ~/ 60;
      final mins = estimatedDurationMins % 60;
      return mins > 0 ? '${hours}h ${mins}m' : '${hours}h';
    }
    return '${estimatedDurationMins}m';
  }
}

double _parseDouble(dynamic value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0.0;
  return 0.0;
}

@JsonSerializable()
class SubServiceCategory {
  final String id;
  final String name;

  const SubServiceCategory({required this.id, required this.name});

  factory SubServiceCategory.fromJson(Map<String, dynamic> json) =>
      _$SubServiceCategoryFromJson(json);

  Map<String, dynamic> toJson() => _$SubServiceCategoryToJson(this);
}
