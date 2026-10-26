"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Laptop,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

// One-time activation: set your own password using the temporary credentials
// issued by your ICT teacher (asd.md §5.3, §6.1).
export default function AccountActivatePage() {
  const [identifier, setIdentifier] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"TEACHER" | "STUDENT" | null>(null);

  const activateMutation = useMutation(api.auth.completeActivation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await activateMutation({
        identifier,
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setRole(res.role ?? null);
        setCompleted(true);
      } else {
        setError(res.error ?? "Activation failed");
      }
    } catch (err: any) {
      setError(err?.message ?? "Activation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]" />
      </div>

      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-b border-slate-800/60">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tight text-white">Log</span>
              <span className="text-2xl font-black tracking-tight text-blue-400">Tap</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Account Activation</p>
          </div>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-blue-500/30 animate-slide-up">
          {completed ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Account Activated</h1>
                <p className="text-sm text-slate-400 mt-2">
                  Your new password is set and all previous sessions were signed out.
                  Sign in with your new password to continue.
                </p>
              </div>
              <Link
                href={role === "TEACHER" ? "/teacher/login" : "/student/login"}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Activate Your Account</h1>
                  <p className="text-xs text-slate-400">
                    Set your own password using the temporary credentials from your teacher
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    LRN or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 105580160009"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      New Password (min. 8 characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Set Password & Activate</span>
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-500">
                Forgot your temporary password?{" "}
                <Link href="/account/reset-password" className="text-blue-400 hover:text-blue-300 font-semibold">
                  Teacher-assisted recovery
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}