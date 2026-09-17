import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { fetchMe } from "../api.js";

const AuthCtx = createContext(null);

// Dev convenience: sign in automatically so you don't hit the login screen on
// every reload. Only active in `npm run dev` and only when both vars are set
// (see client/.env.development). Never runs in a production build.
const AUTO = import.meta.env.DEV && {
  email: import.meta.env.VITE_DEV_AUTOLOGIN_EMAIL,
  password: import.meta.env.VITE_DEV_AUTOLOGIN_PASSWORD,
};

// Maps Firebase Auth error codes to the same messages the old server-side
// login used to return.
function authErrorMessage(err) {
  switch (err.code) {
    case "auth/invalid-email":
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    case "auth/too-many-requests":
      return "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง";
    default:
      return err.message;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      throw new Error(authErrorMessage(err));
    }
    const r = await fetchMe();
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(() => {
    signOut(auth);
    setUser(null);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const r = await fetchMe();
          setUser(r.user);
        } catch {
          setUser(null);
        }
        setLoading(false);
        return;
      }
      if (AUTO && AUTO.email && AUTO.password) {
        try {
          await login(AUTO.email, AUTO.password);
        } catch (e) {
          console.warn("[auth] auto-login failed:", e.message);
        }
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [login]);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, autoLogin: !!(AUTO && AUTO.email) }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
