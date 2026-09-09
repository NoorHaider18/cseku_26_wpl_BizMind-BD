import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthUser {
  final String id;
  final String email;
  final String role;
  final String businessId;
  final String name;

  AuthUser({
    required this.id,
    required this.email,
    required this.role,
    required this.businessId,
    required this.name,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'],
        email: json['email'],
        role: json['role'],
        businessId: json['businessId'],
        name: json['name'],
      );
}

class AuthException implements Exception {
  final String message;
  AuthException(this.message);
  @override
  String toString() => message;
}

/// Talks to the NestJS /auth endpoints. Base URL:
/// - Android emulator: http://10.0.2.2:3000  (localhost of the host machine)
/// - iOS simulator / web: http://localhost:3000
/// Override with --dart-define=API_BASE_URL=... for a real device / staging.
class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'bizmind_token';

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  Future<AuthUser> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (res.statusCode != 200 && res.statusCode != 201) {
      final body = _tryDecode(res.body);
      throw AuthException(body?['message'] ?? 'Login failed (${res.statusCode})');
    }

    final data = jsonDecode(res.body);
    await _storage.write(key: _tokenKey, value: data['accessToken']);
    return AuthUser.fromJson(data['user']);
  }

  Future<String?> getToken() => _storage.read(key: _tokenKey);

  Future<bool> isLoggedIn() async => (await getToken()) != null;

  Future<void> logout() => _storage.delete(key: _tokenKey);

  Map<String, dynamic>? _tryDecode(String body) {
    try {
      return jsonDecode(body) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }
}
