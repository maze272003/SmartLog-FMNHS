"use client";

import React from "react";
import Link from "next/link";
import {
  Laptop,
  LifeBuoy,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

// Teacher-assisted, no-email recovery flow (asd.md §5.3, §6.1).
// Students without email recover access through their ICT teacher, who issues
// a temporary password; the student then activates a new password themselves.
export default function ResetPasswordPage() {
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
            <p className="text-xs text-slate-400 font-medium">Password Recovery</p>
          </div>
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-6 animate-slide-up">
          <div className="glass-panel rounded-3xl p-8 border border-blue-500/30">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Reset Your Password</h1>
                <p className="text-xs text-slate-400">
                  FMNHS accounts recover through teacher-assisted reset — no email required
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Visit your ICT teacher in the computer laboratory",
                  body: "Tell them your full name and LRN. Teachers verify identity in person — this keeps accounts safe on shared school devices.",
                },
                {
                  title: "Teacher issues a temporary password",
                  body: "Your teacher resets your password from the Students module. Teachers can never read your existing password.",
                },
                {
                  title: "Activate your own password",
                  body: "Use the temporary password on the activation page below to choose a new password only you know.",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start space-x-4"
                >
                  <span className="w-7 h-7 shrink-0 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{step.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              href="/account/activate"
              className="glass-panel glass-panel-hover rounded-2xl p-5 border border-blue-500/30 group"
            >
              <div className="flex items-center space-x-2 text-blue-400 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">I have a temp password</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Activate a New Password
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Set your own password with the temporary credentials from your teacher.
              </p>
            </Link>

            <Link
              href="/student/login"
              className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 group"
            >
              <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Back to sign in</span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Student Login
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Remembered it after all? Return to the LRN sign-in page.
              </p>
            </Link>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Teacher?</span> Sign in to the
              Teacher Portal, open <span className="font-mono text-blue-300">Students</span>, and
              use <span className="font-semibold text-slate-300">Reset Password</span> on the
              student&apos;s row to issue a temporary password.
              <Link
                href="/teacher/login"
                className="ml-1 inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold"
              >
                Teacher sign in
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}