const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

let lastErrorTime = 0;

const SENSITIVE_KEYS = [
  "password",
  "password_confirmation",
  "current_password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "api_key",
  "secret",
  "client_secret",
];

function maskSensitiveData(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(maskSensitiveData);
  }

  const safe = {};

  for (const key of Object.keys(value)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      safe[key] = "******";
    } else if (typeof value[key] === "object") {
      safe[key] = maskSensitiveData(value[key]);
    } else {
      safe[key] = value[key];
    }
  }

  return safe;
}

export async function reportClientError(payload) {
  try {
    const now = Date.now();

    if (now - lastErrorTime < 5000) {
      return;
    }

    lastErrorTime = now;

    const safePayload = maskSensitiveData(payload);

    await fetch(`${API_BASE_URL}/client-errors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message: safePayload.message || "Unknown frontend error",
        url: window.location.href,
        source: safePayload.source || "react-frontend",
        line: safePayload.line || null,
        column: safePayload.column || null,
        stack: safePayload.stack || null,
        extra: maskSensitiveData(safePayload.extra || {}),
      }),
    });
  } catch {
    // Never break frontend if error logging fails.
  }
}

export function setupGlobalClientErrorLogging() {
  window.onerror = function (message, source, line, column, error) {
    reportClientError({
      message: String(message),
      source,
      line,
      column,
      stack: error?.stack,
    });
  };

  window.onunhandledrejection = function (event) {
    reportClientError({
      message: event.reason?.message || "Unhandled promise rejection",
      source: "unhandledrejection",
      stack: event.reason?.stack,
    });
  };
}