import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { login as apiLogin, fetchMe, tokenStore } from "../api.js";

const AuthCtx = createContext(null);

// Dev convenience: sign in automatically so you don't hit the login screen on
// every reload. Only active in `npm run dev` and only when both vars are set
// (see client/.env.development). Never runs in a production build.
const AUTO = import.meta.env.DEV && {
  email: import.meta.env.VITE_DEV_AUTOLOGIN_EMAIL,
  password: import.meta.env.VITE_DEV_AUTOLOGIN_PASSWORD,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email, password) => {
    const r = await apiLogin(email, password);
    tokenStore.set(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (tokenStore.get()) {
      fetchMe()
        .then((r) => setUser(r.user))
        .catch(() => tokenStore.set(null))
        .finally(() => setLoading(false));
      return;
    }
    if (AUTO && AUTO.email && AUTO.password) {
      login(AUTO.email, AUTO.password)
        .catch((e) => console.warn("[auth] auto-login failed:", e.message))
        .finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, [login]);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, autoLogin: !!(AUTO && AUTO.email) }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
