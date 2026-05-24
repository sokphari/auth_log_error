import { createContext, useContext, useEffect, useMemo, useState } from "react";
import http from "../api/http";
import { getToken, removeToken, setToken } from "../lib/tokenStorage";

const AuthContext = createContext(null);

function getErrorMessage(error) {
  if (error.response?.status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  const validationErrors = error.response?.data?.errors;

  if (validationErrors) {
    const firstKey = Object.keys(validationErrors)[0];
    return validationErrors[firstKey]?.[0] || "Validation failed.";
  }

  return "Something went wrong. Please try again.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === "admin";

  async function loadUser() {
    if (!getToken()) {
      setBooting(false);
      return;
    }

    try {
      const response = await http.get("/auth/me");
      setUser(response.data.data.user);
    } catch {
      removeToken();
      setUser(null);
    } finally {
      setBooting(false);
    }
  }

  async function login(payload) {
    try {
      const response = await http.post("/auth/login", {
        ...payload,
        device_name: "react-app",
      });

      const data = response.data.data;

      setToken(data.access_token);
      setUser(data.user);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }

  async function register(payload) {
    try {
      const response = await http.post("/auth/register", {
        ...payload,
        device_name: "react-app",
      });

      const data = response.data.data;

      setToken(data.access_token);
      setUser(data.user);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }

  async function logout() {
    try {
      await http.post("/auth/logout");
    } catch {
      // Continue local logout even if backend logout fails.
    } finally {
      removeToken();
      setUser(null);
      window.location.href = "/login";
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  const value = useMemo(() => ({
    user,
    booting,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
  }), [user, booting, isAuthenticated, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}