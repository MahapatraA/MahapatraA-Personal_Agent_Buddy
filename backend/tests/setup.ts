process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-only-jwt-secret-value-with-enough-length-0123456789';
