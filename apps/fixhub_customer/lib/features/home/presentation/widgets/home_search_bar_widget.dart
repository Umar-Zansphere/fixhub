import 'package:flutter/material.dart';
import '../../../../core/widgets/fixhub_search_bar.dart';

/// Home screen search bar — tappable, navigates to search.
class HomeSearchBarWidget extends StatelessWidget {
  const HomeSearchBarWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return FixHubSearchBar(
      hint: 'Search for services...',
      onTap: () {
        // TODO: Navigate to search screen
      },
    );
  }
}
