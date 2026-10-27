/**
 * Standard error envelope (API SPEC §2):
 *   success: { "data": ..., "meta"?: { "cursor", "hasMore" } }
 *   error:   { "error": { "code", "message", "details" } }
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 422,
  STAGE_LOCKED: 409,
  APPROVAL_REQUIRED: 409,
  INSUFFICIENT_CREDITS: 402,
  JOB_ALREADY_RUNNING: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  EMAIL_NOT_VERIFIED: 403,
  ACCOUNT_SUSPENDED: 403,
  SAMPLE_READ_ONLY: 403,
  FEATURE_DISABLED: 403,
  POSSIBLE_DUPLICATE: 409,
  CONFLICT: 409,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = ERROR_CODES[code];
    this.details = details;
  }
}

export interface ErrorBody {
  error: { code: string; message: string; details: Record<string, unknown> };
}

export function errorBody(err: ApiError): ErrorBody {
  return {
    error: { code: err.code, message: err.message, details: err.details ?? {} },
  };
}

export interface SuccessBody<T> {
  data: T;
  meta?: { cursor?: string; hasMore?: boolean };
}

export function successBody<T>(data: T, meta?: SuccessBody<T>["meta"]): SuccessBody<T> {
  return meta ? { data, meta } : { data };
}
