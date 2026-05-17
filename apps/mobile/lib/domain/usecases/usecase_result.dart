class UseCaseResult<T> {
  final T? data;
  final String? error;
  final int? statusCode;

  const UseCaseResult._(this.data, this.error, this.statusCode);

  const UseCaseResult.success(T data) : this._(data, null, null);
  const UseCaseResult.failure(String error, {int? statusCode}) : this._(null, error, statusCode);

  bool get isSuccess => error == null;
}
