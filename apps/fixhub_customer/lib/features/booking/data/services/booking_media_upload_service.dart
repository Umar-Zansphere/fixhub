import 'dart:io';
import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final bookingMediaUploadServiceProvider =
    Provider<BookingMediaUploadService>((ref) {
  return BookingMediaUploadService(ref.read(dioProvider));
});

/// Handles the two-step media upload flow:
/// 1. Ask backend for a presigned S3 PUT URL
/// 2. PUT the file bytes directly to S3
/// 3. Register the final public URL with the backend
class BookingMediaUploadService {
  final Dio _dio;

  BookingMediaUploadService(this._dio);

  /// Upload [file] to the booking with [bookingId].
  /// Returns the public URL stored in the BookingMedia record.
  Future<String> uploadFile({
    required String bookingId,
    required File file,
    required String contentType,
    required String phase, // 'BEFORE_SERVICE' | 'DURING_SERVICE' | 'AFTER_SERVICE'
  }) async {
    final fileName = file.path.split(Platform.pathSeparator).last;
    final sizeBytes = await file.length();
    final isVideo = contentType.startsWith('video/');

    // Step 1: get presigned upload URL
    final prepResp = await _dio.post(
      ApiEndpoints.bookingMedia(bookingId),
      data: {
        'fileName': fileName,
        'contentType': contentType,
        'sizeBytes': sizeBytes,
        'type': isVideo ? 'VIDEO' : 'IMAGE',
        'uploadPhase': phase,
      },
    );

    final data = _unwrap(prepResp.data);
    final uploadUrl = data['uploadUrl'] as String;
    final s3Key = data['key'] as String;

    // Step 2: PUT file bytes directly to S3 (no auth headers)
    final rawDio = Dio(); // fresh Dio — no JWT interceptor
    await rawDio.put(
      uploadUrl,
      data: file.openRead(),
      options: Options(
        headers: {
          'Content-Type': contentType,
          'Content-Length': sizeBytes,
        },
        // follow redirects, ignore non-2xx for now (S3 returns 200)
      ),
    );

    // Step 3: register the public URL
    // Derive the CDN/public URL from the S3 key. The backend's StorageService
    // follows the pattern: baseUrl + '/' + key.
    // We re-call POST /media with the same params + url to create the record.
    const cdnBase = 'https://cdn.fixhub.in'; // matches StorageService config
    final publicUrl = '$cdnBase/$s3Key';

    final attachResp = await _dio.post(
      ApiEndpoints.bookingMedia(bookingId),
      data: {
        'fileName': fileName,
        'contentType': contentType,
        'sizeBytes': sizeBytes,
        'type': isVideo ? 'VIDEO' : 'IMAGE',
        'uploadPhase': phase,
        'url': publicUrl,
      },
    );

    final attachData = _unwrap(attachResp.data);
    final media = attachData['media'];
    if (media != null && media['url'] != null) {
      return media['url'] as String;
    }
    return publicUrl;
  }

  Map<String, dynamic> _unwrap(dynamic data) {
    if (data is Map<String, dynamic> && data.containsKey('data')) {
      return data['data'] as Map<String, dynamic>;
    }
    return data as Map<String, dynamic>;
  }
}
