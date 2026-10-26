"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Clock,
  QrCode,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function TeacherDashboard() {
  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();
  // Frozen per-mount timestamp keeps the render pure (no wall clock reads).
  const [clientNowTs] = useState(() => Date.now());

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const stats = useQuery(
    api.dashboard.getTeacherStats,
    token ? { token, clientNow: clientNowTs } : "skip"
  );

  const pendingRequests = useQuery(
    api.requests.listPendingRequests,
    token ? { token } : "skip"
  );

  const activeTransactions = useQuery(
    api.transactions.listTeacherTransactions,
    token ? { token, filterStatus: "ACTIVE" } : "skip"
  );

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        Loading teacher dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {/* Welcome Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-blue-900/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Computer Laboratory Monitor</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {user.fullName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                FMNHS Junior High School • Special Program in ICT (SPICT)
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/teacher/inventory"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all"
              >
                <Laptop className="w-4 h-4" />
                <span>Manage Inventory</span>
              </Link>
              <Link
                href="/teacher/inventory/labels"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>Print QR Labels</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-panel rounded-2xl p-5 border border-blue-500/20">
            <div className="flex items-center justify-between text-blue-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available</span>
              <Laptop className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-white">
              {stats ? stats.availableLaptops : "--"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Out of {stats?.totalLaptops ?? "--"} total units
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Borrowed</span>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-white">
              {stats ? stats.borrowedLaptops : "--"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Active loan lines in custody
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-amber-500/20">
            <div className="flex items-center justify-between text-amber-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Due Today</span>
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-white">
              {stats ? stats.dueTodayCount : "--"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.overdueCount ?? 0} loans overdue
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-purple-500/20">
            <div className="flex items-center justify-between text-purple-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Requests</span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-white">
              {stats ? stats.pendingRequestsCount : "--"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Awaiting teacher review
            </p>
          </div>
        </div>

        {/* Action Shortcuts & Live Queues */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pending Requests Queue */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Student Borrow Requests</h2>
                </div>
                <Link
                  href="/teacher/requests"
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!pendingRequests || pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No pending student requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 3).map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-sm">
                            {req.student?.fullName ?? "Student"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Gr. {req.student?.gradeLevel} - {req.student?.section}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {req.requestedQuantity} laptop(s) • Purpose: {req.purpose}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            req.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/teacher/requests"
              className="mt-4 block text-center py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors"
            >
              Go to Request Approvals
            </Link>
          </div>

          {/* Active Custody Transactions */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Active Custody & Returns</h2>
                </div>
                <Link
                  href="/teacher/transactions"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                >
                  <span>Manage Custody</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {!activeTransactions || activeTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No laptops currently out on loan.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTransactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-sm">
                            {tx.borrowerName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            LRN: {tx.lrn}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {tx.outstandingQuantity} of {tx.issuedQuantity} laptop(s) outstanding
                        </p>
                      </div>

                      <div className="text-right">
                        {tx.hasPendingReturns ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse">
                            Return Submitted
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-800 text-slate-400">
                            In Use
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/teacher/transactions"
              className="mt-4 block text-center py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors"
            >
              Confirm Physical Returns
            </Link>
          </div>
        </div>

        {/* Quick Management Links */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/teacher/students"
            className="p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center space-x-3.5 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Enrolled Students
              </h3>
              <p className="text-xs text-slate-400">Enroll & manage SPICT borrowers</p>
            </div>
          </Link>

          <Link
            href="/teacher/inventory/labels"
            className="p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center space-x-3.5 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                QR Sticker Sheets
              </h3>
              <p className="text-xs text-slate-400">Print durable laptop bar labels</p>
            </div>
          </Link>

          <Link
            href="/teacher/logbook"
            className="p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 flex items-center space-x-3.5 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Logbook & CSV Export
              </h3>
              <p className="text-xs text-slate-400">Official logs and research data</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
