"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  GraduationCap,
  IdCard,
  Mail,
  Activity,
  AlertOctagon,
  KeyRound,
  Clock,
} from "lucide-react";

// Student profile, active borrowed quantity, borrowing history, overdue
// status, password reset trigger (asd.md §6.2 app/teacher/students/[studentId]).
export default function TeacherStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.studentId;

  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();
  // Frozen per-mount timestamp keeps the render pure (no wall clock reads).
  const [clientNowTs] = useState(() => Date.now());

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const data = useQuery(
    api.users.getStudentById,
    token && isTeacher
      ? { token, studentId: studentId as Id<"users">, clientNow: clientNowTs }
      : "skip"
  );

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
        <Link
          href="/teacher/students"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Student Roster</span>
        </Link>

        {data === undefined ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 border border-slate-800 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-sm">Loading student profile...</span>
          </div>
        ) : data === null ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 border border-slate-800">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">Student Not Found</h3>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Profile card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/30 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">{data.student.fullName}</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {data.student.program} • Grade {data.student.gradeLevel} — {data.student.section}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      data.student.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {data.student.status}
                  </span>
                  {data.hasOverdue && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center space-x-1">
                      <AlertOctagon className="w-3 h-3" />
                      <span>OVERDUE</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                  <IdCard className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">LRN</div>
                    <div className="text-sm text-slate-200 font-mono">{data.student.lrn}</div>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email</div>
                    <div className="text-sm text-slate-200 font-medium break-all">
                      {data.student.email ?? "— (LRN-only account)"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xl font-black text-amber-400">{data.activeBorrowedCount}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Borrowed Now</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xl font-black text-white">{data.totalTransactionsCount}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Transactions</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xl font-black text-blue-400">{data.openRequestsCount}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Open Requests</div>
                </div>
              </div>

              {data.nearestDueAt && (
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Nearest Due Time
                    </div>
                    <div className="text-sm text-slate-200 font-medium">
                      {new Date(data.nearestDueAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2.5">
                <Link
                  href="/teacher/students"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  <span>Reset Password / Edit (on Roster)</span>
                </Link>
                <Link
                  href="/teacher/requests"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-colors"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Review Their Requests</span>
                </Link>
              </div>
            </div>

            {/* Borrowing history */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Borrowing History</h2>
              </div>

              {data.history.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  This student has no borrowing transactions yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.history.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              tx.displayStatus === "CLOSED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : tx.displayStatus === "PARTIALLY_RETURNED"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {tx.displayStatus.replace("_", " ")}
                          </span>
                          {tx.isOverdue && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(tx.issuedAt).toLocaleString()} → due{" "}
                          {new Date(tx.dueAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {tx.laptops.map((l) => (
                          <span
                            key={l.id}
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                              l.status === "RETURNED"
                                ? "bg-slate-900 text-slate-400 border-slate-800"
                                : "bg-blue-950 text-blue-300 border-blue-900"
                            }`}
                          >
                            <span>{l.assetCode}</span>
                            {l.status === "RETURNED" && l.returnedAt && (
                              <span className="text-[10px] text-slate-500 font-sans">
                                {new Date(l.returnedAt).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Borrowed {tx.issuedQuantity}</span>
                        <span>• Returned {tx.returnedQuantity}</span>
                        <span>• Outstanding {tx.outstandingQuantity}</span>
                        <Link
                          href={`/teacher/transactions/${tx.id}`}
                          className="ml-auto text-blue-400 hover:text-blue-300 font-bold"
                        >
                          View Transaction →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

