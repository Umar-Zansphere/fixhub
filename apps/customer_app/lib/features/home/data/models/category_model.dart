import 'package:json_annotation/json_annotation.dart';

part 'category_model.g.dart';

@JsonSerializable()
class CategoryModel {
  const CategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.iconUrl,
    required this.isActive,
    this.sortOrder = 0,
  });

  final String id;
  final String name;
  final String slug;
  final String? iconUrl;
  final bool isActive;
  final int sortOrder;

  factory CategoryModel.fromJson(Map<String, dynamic> json) =>
      _$CategoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$CategoryModelToJson(this);

  /// Icon mapping for categories that don't have a custom icon URL.
  String get displayIcon {
    switch (slug) {
      case 'electrical':
        return '⚡';
      case 'ac-service':
        return '❄️';
      case 'plumbing':
        return '🔧';
      case 'cleaning':
        return '🧹';
      case 'painting':
        return '🎨';
      case 'carpentry':
        return '🪚';
      case 'appliance-repair':
        return '🔌';
      default:
        return '🔧';
    }
  }
}
