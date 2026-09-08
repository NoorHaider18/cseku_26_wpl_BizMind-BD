import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';

/// Single source of truth for "is someone logged in" — GoRouter listens to
/// this via refreshListenable so login/logout immediately update routing,
/// instead of relying on a plain global bool that never notifies anyone.
class AuthState extends ChangeNotifier {
  final AuthService _authService = AuthService();
  bool isAuthenticated = false;

  Future<void> checkInitialAuth() async {
    isAuthenticated = await _authService.isLoggedIn();
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    await _authService.login(email, password);
    isAuthenticated = true;
    notifyListeners();
  }

  Future<void> logout() async {
    await _authService.logout();
    isAuthenticated = false;
    notifyListeners();
  }
}

final authState = AuthState();
