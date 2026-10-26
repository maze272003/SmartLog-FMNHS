"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  ReactNode,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export interface UserProfile {
  id: string;
  fullName: string;
  email?: string;
  lrn?: string;
  role: "TEACHER" | "STUDENT";
  status: "ACTIVE" | "INACTIVE";
  program?: string;
  gradeLevel?: number;
  section?: string;
  employeeId?: string;
  department?: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  loginSession: (token: string) => void;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Session-token store backed by localStorage and exposed via
// useSyncExternalStore so hydration never mismatches and no effect calls
// setState during mount.
// ---------------------------------------------------------------------------

const TOKEN_KEY = "logtap_auth_token";
const listeners = new Set<() => void>();

// Referentially stable per value: useSyncExternalStore compares with
// Object.is and equal strings are interchangeable, so reading localStorage
// directly (the pattern recommended by the React docs) is safe here.
function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // Ignore localStorage errors (private mode, storage full, …)
  }
  for (const notify of listeners) notify();
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Server/prerender snapshot is always signed out; the client snapshot reads
  // localStorage lazily on first access.
  const token = useSyncExternalStore(
    subscribe,
    loadToken,
    () => null
  );

  const logoutMutation = useMutation(api.auth.logout);

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    token ? { token } : "skip"
  );

  // Keep the shared devices promise: tokens never survive tab close on shared
  // laboratory computers beyond the server-side session expiry.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        for (const notify of listeners) notify();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const loginSession = (newToken: string) => {
    setStoredToken(newToken);
  };

  const logout = async () => {
    const current = loadToken();
    if (current) {
      try {
        await logoutMutation({ token: current });
      } catch {}
    }
    setStoredToken(null);
    router.push("/");
  };

  const isLoading = !!token && currentUser === undefined;
  const user = currentUser ?? null;
  const isTeacher = user?.role === "TEACHER";
  const isStudent = user?.role === "STUDENT";

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isTeacher,
        isStudent,
        loginSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
