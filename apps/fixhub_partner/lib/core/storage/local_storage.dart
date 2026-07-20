import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

final localStorageProvider = Provider<LocalStorage>((ref) => LocalStorage());

class LocalStorage {
  static const String _tokenBox = 'partner_auth_tokens';
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userBox = 'partner_user_data';

  Future<Box> _getBox(String name) async {
    if (Hive.isBoxOpen(name)) {
      return Hive.box(name);
    }
    return Hive.openBox(name);
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    final box = await _getBox(_tokenBox);
    await box.put(_accessTokenKey, accessToken);
    await box.put(_refreshTokenKey, refreshToken);
  }

  Future<String?> getAccessToken() async {
    final box = await _getBox(_tokenBox);
    return box.get(_accessTokenKey) as String?;
  }

  Future<String?> getRefreshToken() async {
    final box = await _getBox(_tokenBox);
    return box.get(_refreshTokenKey) as String?;
  }

  Future<void> clearTokens() async {
    final box = await _getBox(_tokenBox);
    await box.clear();
  }

  Future<void> saveUserData(Map<String, dynamic> userData) async {
    final box = await _getBox(_userBox);
    await box.putAll(userData);
  }

  Future<Map<String, dynamic>?> getUserData() async {
    final box = await _getBox(_userBox);
    if (box.isEmpty) return null;
    return Map<String, dynamic>.from(box.toMap());
  }

  Future<void> clearAll() async {
    await clearTokens();
    final userBox = await _getBox(_userBox);
    await userBox.clear();
  }

  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
