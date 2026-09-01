// Centralized error system for Sentinel AI

export type ErrorCategory =
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "AI_PROVIDER_ERROR"
  | "AI_OUTPUT_ERROR"
  | "DATABASE_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "RATE_LIMIT_ERROR"
  | "FILE_ERROR"
  | "URL_SECURITY_ERROR"
  | "QR_DECODE_ERROR"
  | "TRANSCRIPTION_ERROR"
  | "CONFIGURATION_ERROR"
  | "UNKNOWN_ERROR";

export class SentinelError extends Error {
  public readonly category: ErrorCategory;
  public readonly userMessage: string;
  public readonly statusCode: number;

  constructor(
    category: ErrorCategory,
    userMessage: string,
    statusCode = 500,
    cause?: Error
  ) {
    super(userMessage);
    this.name = "SentinelError";
    this.category = category;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    if (cause) this.cause = cause;
  }
}

export function handleError(error: unknown): {
  category: ErrorCategory;
  message: string;
  statusCode: number;
} {
  if (error instanceof SentinelError) {
    return {
      category: error.category,
      message: error.userMessage,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      category: "UNKNOWN_ERROR",
      message: "An unexpected error occurred. Please try again.",
      statusCode: 500,
    };
  }

  return {
    category: "UNKNOWN_ERROR",
    message: "An unknown error occurred.",
    statusCode: 500,
  };
}

export function createApiErrorResponse(error: unknown) {
  const handled = handleError(error);
  return {
    error: {
      category: handled.category,
      message: handled.message,
    },
  };
}

// Specific error factories
export const Errors = {
  validation: (msg: string) =>
    new SentinelError("VALIDATION_ERROR", msg, 400),
  auth: (msg = "Authentication required.") =>
    new SentinelError("AUTH_ERROR", msg, 401),
  aiProvider: (msg = "AI service is not configured. Add GROQ_API_KEY to the environment.") =>
    new SentinelError("AI_PROVIDER_ERROR", msg, 503),
  aiOutput: (msg = "AI returned an unexpected response. Please try again.") =>
    new SentinelError("AI_OUTPUT_ERROR", msg, 500),
  database: (msg = "Database operation failed. Please try again.") =>
    new SentinelError("DATABASE_ERROR", msg, 500),
  network: (msg = "Network error. Please check your connection.") =>
    new SentinelError("NETWORK_ERROR", msg, 502),
  timeout: (msg = "The request timed out. Please try again.") =>
    new SentinelError("TIMEOUT_ERROR", msg, 504),
  rateLimit: (msg = "Too many requests. Please wait a moment.") =>
    new SentinelError("RATE_LIMIT_ERROR", msg, 429),
  file: (msg: string) =>
    new SentinelError("FILE_ERROR", msg, 400),
  urlSecurity: (msg = "The provided URL is not allowed for analysis.") =>
    new SentinelError("URL_SECURITY_ERROR", msg, 400),
  qrDecode: (msg = "Could not decode QR code from the provided image.") =>
    new SentinelError("QR_DECODE_ERROR", msg, 400),
  transcription: (msg = "Transcription service is unavailable.") =>
    new SentinelError("TRANSCRIPTION_ERROR", msg, 503),
  configuration: (msg: string) =>
    new SentinelError("CONFIGURATION_ERROR", msg, 500),
} as const;
