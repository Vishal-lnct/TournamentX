import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, login, logout, signup } from "../api/tournamentService";
import { tokenStorage } from "../api/client";

const USER_STORAGE_KEY = "ctms_user";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (!tokenStorage.getAccess()) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getProfile();
        setUser(profile);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      } catch {
        tokenStorage.clear();
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const persistSession = (payload) => {
    tokenStorage.setTokens({ access: payload.access, refresh: payload.refresh });
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const loginUser = async (credentials) => {
    const payload = await login(credentials);
    persistSession(payload);
    return payload.user;
  };

  const signupUser = async (details) => {
    const payload = await signup(details);
    persistSession(payload);
    return payload.user;
  };

  const logoutUser = async () => {
    const refreshToken = tokenStorage.getRefresh();
    await logout(refreshToken);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      loginUser,
      signupUser,
      logoutUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
