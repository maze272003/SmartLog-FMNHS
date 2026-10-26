"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Laptop,
  QrCode,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  Database,
  CheckCircle2,
  Sparkles,
  Layers,
  History,
} from "lucide-react";

export default function HomePage() {
  const { user, isTeacher, isStudent } = useAuth();
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const seedMutation = useMutation(api.seed.seedInitialData);

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      const res = await seedMutation();
      setSeedStatus(res.message);
    } catch (err: any) {
      setSeedStatus(`Seed error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tight text-white">Log</span>
              <span className="text-2xl font-black tracking-tight text-blue-400">Tap</span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                FMNHS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Automated Laptop Monitoring System
            </p>
          </div>
        </div>

        {/* Existing Auth quick navigation */}
        {user && (
          <Link
            href={isTeacher ? "/teacher/dashboard" : "/student/dashboard"}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-sm font-semibold transition-all"
          >
            <span>Go to {isTeacher ? "Teacher" : "Student"} Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 text-xs font-semibold text-blue-300 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Special Program in ICT (SPICT) • Grades 7–10</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Seamless Laptop Tracking with{" "}
            <span className="text-gradient-blue">QR Scanning</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            LogTap empowers Fort Magsaysay National High School with real-time laptop accountability,
            distinct multi-unit transaction tracking, and instant teacher custody verification.
          </p>
        </div>

        {/* Portal Entry Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full mb-16">
          {/* Student Portal */}
          <Link
            href="/student/login"
            className="glass-panel glass-panel-hover rounded-3xl p-8 border border-blue-900/40 relative group overflow-hidden"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
              Student Portal
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Sign in with your 12-digit Learner Reference Number (LRN) or email. Scan laptop QR codes,
              request equipment, track due dates, and view your personal loan calendar.
            </p>

            <div className="flex items-center text-blue-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
              <span>Enter Student Area</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </Link>

          {/* Teacher Portal */}
          <Link
            href="/teacher/login"
            className="glass-panel glass-panel-hover rounded-3xl p-8 border border-blue-900/40 relative group overflow-hidden"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
              Teacher & Custodian Portal
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Monitor active laptop inventory, generate printable QR stickers, approve student requests,
              confirm physical handovers, and export official logbooks.
            </p>

            <div className="flex items-center text-emerald-400 text-sm font-semibold group-hover:translate-x-1 transition-transform">
              <span>Enter Teacher Area</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto w-full mb-12">
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start space-x-3.5">
            <QrCode className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Unique QR Identification</h3>
              <p className="text-xs text-slate-400 mt-1">
                Each unit has a unique token and printed sticker for camera decoding.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start space-x-3.5">
            <Layers className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Multi-Laptop Quantity</h3>
              <p className="text-xs text-slate-400 mt-1">
                Loan individual or bundled units with partial return tracking.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start space-x-3.5">
            <History className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Auditable Accountability</h3>
              <p className="text-xs text-slate-400 mt-1">
                ACID transactions guarantee tamper-proof timestamps and custody histories.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Development Database Seeder */}
        <div className="max-w-md mx-auto text-center">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>{isSeeding ? "Seeding..." : "Seed Initial FMNHS Data (Teacher, Students, Laptops)"}</span>
          </button>
          {seedStatus && (
            <p className="mt-2 text-xs text-emerald-400 font-medium">{seedStatus}</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>Fort Magsaysay National High School • Special Program in ICT (SPICT) • LogTap System</p>
      </footer>
    </div>
  );
}
