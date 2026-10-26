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
  Scan,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function StudentDashboard() {
  const { user, token, isStudent, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && (!user || !isStudent)) {
      router.push("/student/login");
    }
  }, [user, isStudent, isLoading, router]);

  const stats = useQuery(
    api.dashboard.getStudentStats,
    token ? { token, clientNow: Date.now() } : "skip"
  );

  const activeLoans = useQuery(
    api.transactions.listMyBorrowed,
    token ? { token } : "skip"
  );

  const myRequests = useQuery(
    api.requests.listMyRequests,
    token ? { token } : "skip"
  );

  if (isLoading || !mounted || !user) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        Loading student dashboard...
      </div>
    );
  }

  const openLoans = activeLoans?.filter((l) => l.outstandingQuantity > 0) ?? [];
  const pendingReqs = myRequests?.filter((r) => r.status === "PENDING" || r.status === "APPROVED") ?? [];

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {/* Welcome Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/20 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                <span>Grade {user.gradeLevel} • Section {user.section}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Hello, {user.fullName}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Learner Reference Number (LRN): <span className="font-mono text-slate-200">{user.lrn}</span>
              </p>
            </div>

            <Link
              href="/student/scan"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
            >
              <Scan className="w-5 h-5" />
              <span>Scan Laptop QR Code</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-5 border border-blue-500/20">
            <div className="flex items-center justify-between text-blue-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Currently Borrowed
              </span>
              <Laptop className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-white">
              {stats ? stats.activeLaptopsCount : "--"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Laptops in your physical custody</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-emerald-500/20">
            <div className="flex items-center justify-between text-emerald-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Requests
              </span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-white">
              {stats ? stats.pendingRequestsCount : "--"}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Pending teacher approval</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-amber-500/20">
            <div className="flex items-center justify-between text-amber-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Due Status
              </span>
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-white">
              {stats?.hasOverdue ? (
                <span className="text-red-400 flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>OVERDUE</span>
                </span>
              ) : stats?.nearestDueAt ? (
                <span className="text-emerald-400">In Good Standing</span>
              ) : (
                <span className="text-slate-500">No Active Loans</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.nearestDueAt
                ? `Nearest due: ${new Date(stats.nearestDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "Check your calendar"}
            </p>
          </div>
        </div>

        {/* Current Borrowed Laptops Cards */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Laptop className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">Laptops in Your Custody</h2>
                </div>
                <Link
                  href="/student/borrowed"
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <span>View All & Return</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {openLoans.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  You do not currently have any borrowed laptops.
                </div>
              ) : (
                <div className="space-y-3">
                  {openLoans.map((tx) => (
                    <div
                      key={tx.transactionId}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">
                          Due: {new Date(tx.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{" "}
                          {new Date(tx.dueAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs font-bold text-blue-400">
                          {tx.outstandingQuantity} outstanding
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {tx.activeLines.map((line: any) => (
                          <span
                            key={line.id}
                            className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white"
                          >
                            {line.assetCode}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/student/borrowed"
              className="mt-4 block text-center py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition-colors"
            >
              Initiate Return Request
            </Link>
          </div>

          {/* Pending Requests */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">Your Requests Status</h2>
                </div>
                <Link
                  href="/student/requests"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                >
                  <span>All Requests</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {pendingReqs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No pending requests right now. Scan a QR code to borrow.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReqs.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {req.requestedQuantity} laptop(s) • {req.purpose}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Submitted: {new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

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
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/student/scan"
              className="mt-4 block text-center py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-xs font-semibold text-blue-300 border border-blue-500/30 transition-colors"
            >
              Scan & Borrow More Laptops
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
