"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  login: (name: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
  refresh: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function useSessionProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (name: string): Promise<User | null> => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setUser(null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, login, logout, refresh };
}
