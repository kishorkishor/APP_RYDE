import { createContext, useContext, useMemo, useState } from "react";
import { clearSession, getStoredToken, getStoredUser, loginAdmin, type AdminUser } from "../services/api";

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    login: async (email, password) => {
      const nextUser = await loginAdmin(email, password);
      setUser(nextUser);
      setToken(getStoredToken());
    },
    logout: () => {
      clearSession();
      setUser(null);
      setToken(null);
    },
  }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
