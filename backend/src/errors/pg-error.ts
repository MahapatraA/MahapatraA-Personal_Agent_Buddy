interface ErrorWithCode {
  code?: unknown;
  cause?: unknown;
}

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as ErrorWithCode;

  if (candidate.code === '23505') {
    return true;
  }

  return isUniqueViolation(candidate.cause);
}
