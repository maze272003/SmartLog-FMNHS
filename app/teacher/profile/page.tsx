"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PasswordChangeForm from "@/components/PasswordChangeForm";
import { UserCircle2, Mail, IdCard, Building2, KeyRound } from "lucide-react";

// Teacher profile details and password change (asd.md §6.2).
export default function TeacherProfilePage() {
  const { user, isTeacher, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

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

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Teacher Profile</h1>
        <p className="text-xs text-slate-400 -mt-4">
          Your account details and security settings
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Details */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 animate-slide-up">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <UserCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{user.fullName}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                  TEACHER
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Email</div>
                  <div className="text-sm text-slate-200 font-medium break-all">{user.email}</div>
                </div>
              </div>

              {user.employeeId && (
                <div className="flex items-start space-x-3">
                  <IdCard className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Employee ID</div>
                    <div className="text-sm text-slate-200 font-medium font-mono">{user.employeeId}</div>
                  </div>
                </div>
              )}

              {user.department && (
                <div className="flex items-start space-x-3">
                  <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Department</div>
                    <div className="text-sm text-slate-200 font-medium">{user.department}</div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800">
              Teacher profiles are provisioned by the school and cannot be edited from the
              application. Contact your administrator for changes.
            </p>
          </div>

          {/* Password Change */}
          <div className="glass-panel rounded-3xl p-6 border border-blue-500/20 animate-slide-up">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white">Security</h2>
            </div>
            <PasswordChangeForm onSuccessMessage="Password updated. Other sessions were signed out." />
          </div>
        </div>
      </main>
    </div>
  );
}
