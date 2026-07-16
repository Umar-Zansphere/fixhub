/// Base failure class for the domain layer
sealed class Failure implements Exception {
  final String message;
  final String? errorCode;

  const Failure({required this.message, this.errorCode});

  @override
  String toString() => 'Failure($message, $errorCode)';
}

class NetworkFailure extends Failure {
  const NetworkFailure({required super.message, super.errorCode});
}

class ServerFailure extends Failure {
  const ServerFailure({required super.message, super.errorCode});
}

class AuthFailure extends Failure {
  const AuthFailure({required super.message, super.errorCode});
}

class ValidationFailure extends Failure {
  const ValidationFailure({required super.message, super.errorCode});
}

class NotFoundFailure extends Failure {
  const NotFoundFailure({required super.message, super.errorCode});
}

class CacheFailure extends Failure {
  const CacheFailure({required super.message, super.errorCode});
}
