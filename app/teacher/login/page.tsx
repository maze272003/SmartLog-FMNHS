"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, Loader2, AlertCircle, Laptop } from "lucide-react";

export default function TeacherLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { loginSession } = useAuth();
  const router = useRouter();
  const loginMutation = useMutation(api.auth.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await loginMutation({
        identifier: email.trim(),
        password,
      });

      if (res.success && res.token && res.user) {
        if (res.user.role !== "TEACHER") {
          setError("Access denied: This portal is for teachers and custodians only.");
          return;
        }
        loginSession(res.token);
        router.push("/teacher/dashboard");
      } else {
        setError(res.error ?? "Invalid email or password");
      }
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("teacher@fmnhs.edu.ph");
    setPassword("Password123!");
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand header */}
      <Link href="/" className="flex items-center space-x-2.5 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
          <Laptop className="w-5 h-5" />
        </div>
        <div className="flex items-center space-x-1 text-2xl font-black">
          <span>Log</span>
          <span className="text-blue-400">Tap</span>
        </div>
      </Link>

      {/* Login Card */}
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-emerald-500/20 shadow-2xl relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Teacher Portal</h1>
            <p className="text-xs text-slate-400">Computer Laboratory & Monitoring Custody</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Teacher Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@fmnhs.edu.ph"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In as Teacher</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Account recovery */}
        <p className="mt-4 text-center text-xs text-slate-500">
          Locked out or have a temporary password?{" "}
          <Link href="/account/activate" className="text-blue-400 hover:text-blue-300 font-semibold">
            Set a new password
          </Link>
        </p>

        {/* Demo Helper */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-400 mb-2">Need test credentials?</p>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 hover:bg-slate-800 transition-colors"
          >
            Use Demo: teacher@fmnhs.edu.ph
          </button>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        Are you a student?{" "}
        <Link href="/student/login" className="text-blue-400 hover:underline">
          Go to Student Login
        </Link>
      </p>
    </div>
  );
}