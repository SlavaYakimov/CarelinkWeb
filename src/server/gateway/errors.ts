import 'server-only';

const GRPC_CODE_MAP: Record<number, { code: string; status: number }> = {
  3: { code: 'INVALID_ARGUMENT', status: 400 },
  5: { code: 'NOT_FOUND', status: 404 },
  6: { code: 'ALREADY_EXISTS', status: 409 },
  7: { code: 'FORBIDDEN', status: 403 },
  8: { code: 'RATE_LIMIT', status: 429 },
  16: { code: 'UNAUTHORIZED', status: 401 },
  13: { code: 'INTERNAL', status: 500 },
};

export class GatewayError extends Error {
  readonly code: string;
  readonly status: number;
  readonly retryAfter?: number;
  readonly traceId?: string;

  constructor(params: {
    code: string;
    status: number;
    retryAfter?: number;
    traceId?: string;
    message?: string;
  }) {
    super(params.message ?? params.code);
    this.name = 'GatewayError';
    this.code = params.code;
    this.status = params.status;
    this.retryAfter = params.retryAfter;
    this.traceId = params.traceId;
  }
}

type ErrorBody = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
};

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const n = Number(header);
  if (Number.isFinite(n)) return Math.max(0, Math.floor(n));
  const date = Date.parse(header);
  if (!Number.isNaN(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return undefined;
}

/** Normalizes auth REST, family HTTP, rate limit, and grpc-gateway error bodies (§2.1). */
export function normalizeGatewayError(
  status: number,
  body: unknown,
  headers: Headers,
  traceId: string,
): GatewayError {
  const retryAfter = parseRetryAfter(headers.get('retry-after'));
  const parsed = (typeof body === 'object' && body !== null ? body : {}) as ErrorBody;

  if (typeof parsed.code === 'string') {
    return new GatewayError({
      code: parsed.code,
      status,
      retryAfter,
      traceId,
    });
  }

  if (typeof parsed.code === 'number') {
    const mapped = GRPC_CODE_MAP[parsed.code] ?? { code: 'UNKNOWN', status: 500 };
    return new GatewayError({
      code: mapped.code,
      status: mapped.status,
      retryAfter,
      traceId,
    });
  }

  if (status === 429) {
    return new GatewayError({
      code: 'RATE_LIMIT',
      status: 429,
      retryAfter,
      traceId,
    });
  }

  return new GatewayError({
    code: 'UNKNOWN',
    status: status >= 400 ? status : 500,
    retryAfter,
    traceId,
  });
}
