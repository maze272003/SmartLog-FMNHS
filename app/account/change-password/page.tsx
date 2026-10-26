"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PasswordChangeForm from "@/components/PasswordChangeForm";
import { KeyRound } from "lucide-react";

// Authenticated password change (asd.md §6.1 /account/change-password).
export default function ChangePasswordPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/30 animate-slide-up">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Change Password</h1>
              <p className="text-xs text-slate-400">
                Signed in as {user.fullName}
              </p>
            </div>
          </div>

          <PasswordChangeForm />

          <p className="mt-5 text-xs text-slate-500">
            Changing your password signs out your other sessions. Need help?{" "}
            <Link href="/account/reset-password" className="text-blue-400 hover:text-blue-300 font-semibold">
              Recovery options
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
