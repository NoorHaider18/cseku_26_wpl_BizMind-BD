import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Bottom nav shell — mirrors the condensed 5-slot pattern from the
/// wireframes: Home, Stock, Sales, Orders, More (Supplier/Expenses/AI roll into More).
class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  static const _tabs = [
    ('/dashboard', Icons.home_outlined, 'Home'),
    ('/inventory', Icons.inventory_2_outlined, 'Stock'),
    ('/sales', Icons.point_of_sale_outlined, 'Sales'),
    ('/procurement', Icons.receipt_long_outlined, 'Orders'),
    ('/more', Icons.more_horiz, 'More'), // sheet with Supplier/Expenses/AI Assistant
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final primary = _tabs.indexWhere((t) => t.$1 == location);
    if (primary != -1) return primary;
    if (['/supplier', '/expenses', '/ai-assistant'].contains(location)) return 4;
    return 0;
  }

  void _onMore(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(children: [
          ListTile(
            leading: const Icon(Icons.local_shipping_outlined),
            title: const Text('Supplier'),
            onTap: () { Navigator.pop(context); context.go('/supplier'); },
          ),
          ListTile(
            leading: const Icon(Icons.receipt_outlined),
            title: const Text('Expenses'),
            onTap: () { Navigator.pop(context); context.go('/expenses'); },
          ),
          ListTile(
            leading: const Icon(Icons.smart_toy_outlined),
            title: const Text('AI Assistant'),
            onTap: () { Navigator.pop(context); context.go('/ai-assistant'); },
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) {
          if (i == 4) { _onMore(context); return; }
          context.go(_tabs[i].$1);
        },
        destinations: _tabs
            .map((t) => NavigationDestination(icon: Icon(t.$2), label: t.$3))
            .toList(),
      ),
    );
  }
}
