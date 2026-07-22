import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/config/theme/app_colors.dart';
import '../../../../core/config/theme/app_radius.dart';
import '../../../../core/config/theme/app_spacing.dart';
import '../../../../core/widgets/fixhub_section_header.dart';
import '../../data/models/category_model.dart';

/// Grid of service categories with colored icon containers and press animations.
class CategoryGrid extends StatelessWidget {
  const CategoryGrid({super.key, required this.categories});

  final List<CategoryModel> categories;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FixHubSectionHeader(
          title: 'Services',
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPadding,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPadding,
          ),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.sm,
              childAspectRatio: 0.82,
            ),
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final category = categories[index];
              return _CategoryItem(category: category);
            },
          ),
        ),
      ],
    );
  }
}

class _CategoryItem extends StatefulWidget {
  const _CategoryItem({required this.category});

  final CategoryModel category;

  @override
  State<_CategoryItem> createState() => _CategoryItemState();
}

class _CategoryItemState extends State<_CategoryItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.92,
      upperBound: 1.0,
      value: 1.0,
    );
    _scaleAnim = _controller;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(_) => _controller.reverse();
  void _onTapUp(_) => _controller.forward();
  void _onTapCancel() => _controller.forward();

  @override
  Widget build(BuildContext context) {
    final category = widget.category;

    return GestureDetector(
      onTap: category.isActive
          ? () => context.push('/services/${category.id}')
          : null,
      onTapDown: category.isActive ? _onTapDown : null,
      onTapUp: category.isActive ? _onTapUp : null,
      onTapCancel: category.isActive ? _onTapCancel : null,
      child: ScaleTransition(
        scale: _scaleAnim,
        child: Opacity(
          opacity: category.isActive ? 1.0 : 0.45,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon container with category-specific color
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: _categoryBgColor(category.slug),
                  borderRadius: AppRadius.mediumRadius,
                  border: Border.all(
                    color: _categoryBorderColor(category.slug),
                    width: 0.5,
                  ),
                ),
                child: Center(
                  child: _CategoryIcon(slug: category.slug),
                ),
              ),
              // "Coming Soon" overlay for inactive
              if (!category.isActive) ...[
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Soon',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppColors.textDisabled,
                          fontSize: 9,
                        ),
                  ),
                ),
              ] else
                const SizedBox(height: AppSpacing.xs),
              Text(
                category.name,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: category.isActive
                          ? AppColors.textPrimary
                          : AppColors.textDisabled,
                      fontWeight: FontWeight.w600,
                    ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _categoryBgColor(String slug) {
    switch (slug) {
      case 'electrical':
        return const Color(0xFFFFF8E1);
      case 'ac-service':
        return const Color(0xFFE3F2FD);
      case 'plumbing':
        return const Color(0xFFE8F5E9);
      case 'cleaning':
        return const Color(0xFFF3E5F5);
      case 'painting':
        return const Color(0xFFFCE4EC);
      case 'carpentry':
        return const Color(0xFFFFEBEE);
      case 'appliance-repair':
        return const Color(0xFFE8EAF6);
      default:
        return AppColors.surface;
    }
  }

  Color _categoryBorderColor(String slug) {
    switch (slug) {
      case 'electrical':
        return const Color(0xFFFFE082);
      case 'ac-service':
        return const Color(0xFF90CAF9);
      case 'plumbing':
        return const Color(0xFFA5D6A7);
      case 'cleaning':
        return const Color(0xFFCE93D8);
      case 'painting':
        return const Color(0xFFF48FB1);
      case 'carpentry':
        return const Color(0xFFEF9A9A);
      case 'appliance-repair':
        return const Color(0xFF9FA8DA);
      default:
        return AppColors.border;
    }
  }
}

/// Category-specific icon widget.
class _CategoryIcon extends StatelessWidget {
  const _CategoryIcon({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context) {
    final config = _iconConfig(slug);
    return Icon(
      config.$1,
      color: config.$2,
      size: 28,
    );
  }

  (IconData, Color) _iconConfig(String slug) {
    switch (slug) {
      case 'electrical':
        return (Icons.bolt_rounded, const Color(0xFFF59E0B));
      case 'ac-service':
        return (Icons.ac_unit_rounded, const Color(0xFF2196F3));
      case 'plumbing':
        return (Icons.plumbing_rounded, const Color(0xFF4CAF50));
      case 'cleaning':
        return (Icons.cleaning_services_rounded, const Color(0xFF9C27B0));
      case 'painting':
        return (Icons.format_paint_rounded, const Color(0xFFE91E63));
      case 'carpentry':
        return (Icons.handyman_rounded, const Color(0xFFE53935));
      case 'appliance-repair':
        return (Icons.home_repair_service_rounded, const Color(0xFF3F51B5));
      default:
        return (Icons.build_rounded, AppColors.textSecondary);
    }
  }
}
