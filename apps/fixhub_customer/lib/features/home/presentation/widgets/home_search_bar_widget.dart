import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/fixhub_search_bar.dart';
import 'global_search_delegate.dart';

/// Home screen search bar — tappable, navigates to search.
class HomeSearchBarWidget extends ConsumerWidget {
  const HomeSearchBarWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FixHubSearchBar(
      hint: 'Search for services...',
      onTap: () {
        showSearch(
          context: context,
          delegate: GlobalSearchDelegate(ref),
        );
      },
    );
  }
}
