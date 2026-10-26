"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("logtap_auth_token");
      if (saved) {
        setToken(saved);
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setInitialized(true);
    }
  }, []);

  const logoutMutation = useMutation(api.auth.logout);

  const currentUser = useQuery(
    api.auth.getCurrentUser,
    token ? { token } : "skip"
  );

  const loginSession = (newToken: string) => {
    try {
      localStorage.setItem("logtap_auth_token", newToken);
    } catch {}
    setToken(newToken);
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutMutation({ token });
      } catch {}
    }
    try {
      localStorage.removeItem("logtap_auth_token");
    } catch {}
    setToken(null);
    router.push("/");
  };

  const isLoading = !initialized || (!!token && currentUser === undefined);
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
