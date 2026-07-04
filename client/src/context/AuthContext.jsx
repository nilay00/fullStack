import { createContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, getCurrentUser, logoutUser } from "../services/authService";

export const AuthContext = createContext(null);

const TOKEN_KEY = "nikahconnect_token";
const USER_KEY = "nikahconnect_user";

// Safe JSON parse — if localStorage has a stale/corrupt value (e.g. a leftover
// literal "undefined" string from an older session), JSON.parse throws
// synchronously inside useState's lazy initializer, which crashes the entire
// app before it can render anything. Falling back to null instead just means
// "not logged in", which is always a safe, recoverable state.
function readStoredUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (err) {
    console.warn("Corrupt stored user data, clearing it.", err);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

// Safely store a value that must round-trip through JSON.parse later.
// Guards against ever writing "undefined" (JSON.stringify(undefined) is the
// bare word undefined, not valid JSON — writing that string is exactly what
// causes the crash above) or other non-serialisable values.
function writeStoredUser(value) {
  if (value === undefined || value === null) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(value));
  } catch (err) {
    console.warn("Could not persist user to localStorage.", err);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }
      try {
        const data = await getCurrentUser();
        setUser(data.user);
        writeStoredUser(data.user);
      } catch (err) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    writeStoredUser(data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    localStorage.setItem(TOKEN_KEY, data.token);
    writeStoredUser(data.user);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (err) {
      // ignore network errors on logout
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUserInContext = useCallback((updatedUser) => {
    setUser(updatedUser);
    writeStoredUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserInContext }}>
      {children}
    </AuthContext.Provider>
  );
}
