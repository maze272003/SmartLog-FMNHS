"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "./AuthContext";
import { Lock, ShieldAlert, Loader2, Check } from "lucide-react";

interface ActionConfirmModalProps {
  isOpen: boolean;
  actionType: "BORROW" | "RETURN";
  actionDescription: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ActionConfirmModal({
  isOpen,
  actionType,
  actionDescription,
  onSuccess,
  onCancel,
}: ActionConfirmModalProps) {
  const { token, user } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verifyMutation = useMutation(api.auth.verifyActionCredentials);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await verifyMutation({
        token,
        password,
        actionType,
      });

      if (res.success) {
        setPassword("");
        onSuccess();
      } else {
        setError(res.error ?? "Invalid password");
      }
    } catch (err: any) {
      setError(err?.message ?? "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl p-6 border border-blue-500/30 shadow-2xl relative">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Identity Confirmation</h3>
            <p className="text-xs text-slate-400">
              Confirm your password to authorize this {actionType.toLowerCase()} action
            </p>
          </div>
        </div>

        <div className="p-3 mb-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
          <p className="font-medium text-blue-300 mb-0.5">{actionDescription}</p>
          <p className="text-slate-400">Borrower: {user?.fullName} (LRN: {user?.lrn})</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-xs text-red-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Account Password
            </label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm & Proceed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
