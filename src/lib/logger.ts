/**
 * Structured Logger with Automatic Secret Redaction
 * Ensures sensitive user data, passwords, payment card numbers,
 * tokens, and database credentials are never exposed in log output.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwordHash/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /signature/i,
  /apiKey/i,
  /cvv/i,
  /cvc/i,
  /pan/i,
  /cardNumber/i,
  /database_url/i,
];

// Matches credit card number patterns (13 to 19 digits)
const CARD_NUMBER_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

// Matches database connection strings with passwords
const DB_URL_PASSWORD_REGEX = /(postgresql:\/\/[^:]+:)([^@]+)(@)/gi;

export function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    let sanitized = data.replace(
      DB_URL_PASSWORD_REGEX,
      "$1[REDACTED_DB_PASSWORD]$3"
    );
    sanitized = sanitized.replace(CARD_NUMBER_REGEX, "[REDACTED_CARD_NUMBER]");
    return sanitized;
  }

  if (typeof data === "number" || typeof data === "boolean") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (typeof data === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) =>
        pattern.test(key)
      );

      if (isSensitiveKey) {
        sanitizedObj[key] = "[REDACTED]";
      } else {
        sanitizedObj[key] = sanitizeData(value);
      }
    }
    return sanitizedObj;
  }

  return "[UNSERIALIZABLE]";
}

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function writeLog(
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown,
  error?: unknown
): void {
  const timestamp = new Date().toISOString();
  const payload: LogPayload = {
    level,
    message: String(sanitizeData(message)),
    timestamp,
    context,
  };

  if (data !== undefined) {
    payload.data = sanitizeData(data);
  }

  if (error instanceof Error) {
    payload.error = {
      name: error.name,
      message: String(sanitizeData(error.message)),
      // In production, omit stack trace to prevent internal path leaks
      stack:
        process.env.NODE_ENV !== "production"
          ? String(sanitizeData(error.stack || ""))
          : undefined,
    };
  } else if (error !== undefined) {
    payload.error = {
      name: "UnknownError",
      message: String(sanitizeData(String(error))),
    };
  }

  const formattedLog = JSON.stringify(payload);

  switch (level) {
    case "error":
      console.error(formattedLog);
      break;
    case "warn":
      console.warn(formattedLog);
      break;
    case "info":
      console.info(formattedLog);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(formattedLog);
      }
      break;
  }
}

export const logger = {
  info: (message: string, context?: string, data?: unknown) =>
    writeLog("info", message, context, data),
  warn: (message: string, context?: string, data?: unknown) =>
    writeLog("warn", message, context, data),
  error: (
    message: string,
    context?: string,
    data?: unknown,
    error?: unknown
  ) => writeLog("error", message, context, data, error),
  debug: (message: string, context?: string, data?: unknown) =>
    writeLog("debug", message, context, data),
};
