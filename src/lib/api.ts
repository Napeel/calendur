import type {
  AppError,
  AppErrorCode,
  CalendarListResult,
  CreateEventPayload,
  CreateEventResult,
  ParseEventRequest,
  ParsedEvent,
  SessionState,
} from './types';

const API_PATHS = {
  parse: '/api/parse',
  session: '/api/web/auth/session',
  logout: '/api/web/auth/logout',
  calendars: '/api/web/calendar/list',
  createEvent: '/api/web/calendar/create',
} as const;

type ApiPath = (typeof API_PATHS)[keyof typeof API_PATHS];

type ApiErrorSource = NonNullable<AppError['source']>;

interface ApiRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

interface ErrorResponseBody {
  error?: unknown;
}

export class ApiClientError extends Error implements AppError {
  code: AppErrorCode;
  status?: number;
  source?: ApiErrorSource;

  constructor(error: AppError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.code = error.code;
    this.status = error.status;
    this.source = error.source;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export async function parseEvent(request: ParseEventRequest): Promise<ParsedEvent> {
  return requestJson<ParsedEvent>(API_PATHS.parse, {
    method: 'POST',
    body: request,
  });
}

export async function getSession(): Promise<SessionState> {
  return requestJson<SessionState>(API_PATHS.session);
}

export async function logout(): Promise<SessionState> {
  return requestJson<SessionState>(API_PATHS.logout, { method: 'POST' });
}

export async function listCalendars(): Promise<CalendarListResult> {
  return requestJson<CalendarListResult>(API_PATHS.calendars);
}

export async function createEvent(payload: CreateEventPayload): Promise<CreateEventResult> {
  return requestJson<CreateEventResult>(API_PATHS.createEvent, {
    method: 'POST',
    body: payload,
  });
}

async function requestJson<T>(path: ApiPath, options: ApiRequestOptions = {}): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiClientError({
      code: 'network_unavailable',
      message: 'You appear to be offline. Check your connection and try again.',
      source: 'network',
    });
  }

  const fetchOptions: RequestInit = {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
  };

  if (options.body !== undefined) {
    fetchOptions.headers = { 'Content-Type': 'application/json' };
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(path, fetchOptions);
  } catch {
    throw new ApiClientError({
      code: 'backend_unavailable',
      message: 'Calendur could not reach the backend. Try again in a moment.',
      source: 'backend',
    });
  }

  if (!response.ok) {
    const serverError = await readErrorResponse(response);
    throw normalizeResponseError(path, response.status, serverError);
  }

  return response.json() as Promise<T>;
}

async function readErrorResponse(response: Response): Promise<string | undefined> {
  const data = (await response.json().catch(() => ({}))) as ErrorResponseBody;
  return typeof data.error === 'string' ? data.error : undefined;
}

function normalizeResponseError(path: ApiPath, status: number, serverError?: string): ApiClientError {
  const code = getErrorCode(path, status, serverError);
  return new ApiClientError({
    code,
    status,
    source: getErrorSource(path, code),
    message: getErrorMessage(code, serverError, status),
  });
}

function getErrorCode(path: ApiPath, status: number, serverError?: string): AppErrorCode {
  if (serverError === 'auth_required' || status === 401) return 'auth_required';
  if (status === 429) return 'rate_limited';
  if (status === 400 || status === 422) return 'validation_failed';
  if (status === 405) return 'method_not_allowed';
  if (path === API_PATHS.parse) return 'parse_failed';
  if (path === API_PATHS.calendars || path === API_PATHS.createEvent) return 'google_failed';
  if (status === 502 || status === 503 || status === 504) return 'backend_unavailable';
  if (path === API_PATHS.session || path === API_PATHS.logout) return 'auth_required';
  return 'unknown';
}

function getErrorSource(path: ApiPath, code: AppErrorCode): ApiErrorSource {
  if (code === 'network_unavailable') return 'network';
  if (code === 'backend_unavailable') return 'backend';
  if (code === 'auth_required') return 'auth';
  if (path === API_PATHS.parse) return 'parse';
  if (path === API_PATHS.calendars || path === API_PATHS.createEvent) return 'google';
  return 'backend';
}

function getErrorMessage(code: AppErrorCode, serverError: string | undefined, status: number): string {
  if (serverError && serverError !== 'auth_required') return serverError;

  switch (code) {
    case 'network_unavailable':
      return 'You appear to be offline. Check your connection and try again.';
    case 'backend_unavailable':
      return 'Calendur could not reach the backend. Try again in a moment.';
    case 'auth_required':
      return 'Connect Google Calendar before continuing.';
    case 'parse_failed':
      return 'Calendur could not parse that event. Try rephrasing it.';
    case 'google_failed':
      return 'Google Calendar could not complete the request. Try again.';
    case 'validation_failed':
      return 'Check the event details and try again.';
    case 'rate_limited':
      return 'Too many requests. Try again in one minute.';
    case 'method_not_allowed':
      return 'This action is not available right now.';
    case 'unknown':
      return `Unexpected server error (${status}). Try again.`;
  }
}
