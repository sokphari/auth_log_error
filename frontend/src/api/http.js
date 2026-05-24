import axios from "axios";
import { getToken, removeToken } from "../lib/tokenStorage";
import { reportClientError } from "../lib/clientErrorLogger";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      removeToken();

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    if (status >= 500) {
      await reportClientError({
        message: error.response?.data?.message || error.message,
        source: "axios-response",
        stack: error.stack,
        extra: {
          url: error.config?.url,
          method: error.config?.method,
          status,
          note: "Request body is intentionally not logged for security.",
        },
      });
    }

    return Promise.reject(error);
  }
);

export default http;