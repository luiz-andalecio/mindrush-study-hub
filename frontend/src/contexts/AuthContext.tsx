/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import type { User } from "@/types";
import { clearAccessToken, setAccessToken } from "@/auth/tokenStore";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (patch: { name?: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const refreshed = await authService.refresh();
      setAccessToken(refreshed.data.token);
      const me = await userService.getProfile();
      setUser(me.data);
      return true;
    } catch {
      clearAccessToken();
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    // Persistência de sessão:
    // após reload, tentamos obter novo access token usando refresh cookie httpOnly.
    (async () => {
      await refreshSession();
      setLoading(false);
    })();
  }, [refreshSession]);

  useEffect(() => {
    // Quando o interceptor do Axios não consegue refresh, ele dispara este evento.
    const onForcedLogout = () => {
      clearAccessToken();
      setUser(null);
      navigate("/login");
    };
    window.addEventListener("mindrush:logout", onForcedLogout);
    return () => window.removeEventListener("mindrush:logout", onForcedLogout);
  }, [navigate]);

  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      const response = await authService.login({ email, password, rememberMe: Boolean(rememberMe) });
      setAccessToken(response.data.token);
      const me = await userService.getProfile();
      setUser(me.data);
      navigate("/dashboard");
    },
    [navigate],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await authService.register({ name, email, password });
      setAccessToken(response.data.token);
      const me = await userService.getProfile();
      setUser(me.data);
      navigate("/dashboard");
    },
    [navigate],
  );

  const updateProfile = useCallback(async (patch: { name?: string }) => {
    const updated = await userService.updateProfile(patch);
    setUser(updated.data);
    return updated.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setUser(null);
      navigate("/login");
    }
  }, [navigate]);

  const value = useMemo(
    () => ({ user, loading, login, register, updateProfile, logout, refreshSession }),
    [user, loading, login, register, updateProfile, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
