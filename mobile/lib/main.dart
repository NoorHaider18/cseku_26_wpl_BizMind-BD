import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/inventory_screen.dart';
import 'screens/sales_screen.dart';
import 'screens/procurement_screen.dart';
import 'screens/supplier_screen.dart';
import 'screens/expenses_screen.dart';
import 'screens/ai_assistant_screen.dart';
import 'services/auth_state.dart';
import 'widgets/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await authState.checkInitialAuth(); // restore session from secure storage
  runApp(const BizMindApp());
}

final GoRouter _router = GoRouter(
  initialLocation: '/login',
  refreshListenable: authState,
  redirect: (context, state) {
    final loggingIn = state.matchedLocation == '/login';
    if (!authState.isAuthenticated && !loggingIn) return '/login';
    if (authState.isAuthenticated && loggingIn) return '/dashboard';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (context, state) => const DashboardScreen()),
        GoRoute(path: '/inventory', builder: (context, state) => const InventoryScreen()),
        GoRoute(path: '/sales', builder: (context, state) => const SalesScreen()),
        GoRoute(path: '/procurement', builder: (context, state) => const ProcurementScreen()),
        GoRoute(path: '/supplier', builder: (context, state) => const SupplierScreen()),
        GoRoute(path: '/expenses', builder: (context, state) => const ExpensesScreen()),
        GoRoute(path: '/ai-assistant', builder: (context, state) => const AiAssistantScreen()),
      ],
    ),
  ],
);

class BizMindApp extends StatelessWidget {
  const BizMindApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'BizMind BD',
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF1E6E8C), // matches web brand color
      ),
      routerConfig: _router,
    );
  }
}
