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
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CalendarClock,
  UserCheck,
} from "lucide-react";

// Own laptop list, issue time, per-laptop return status, due time, and
// chronological history (asd.md §6.3 app/student/transactions/[transactionId]).
export default function StudentTransactionPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const resolvedParams = use(params);
  const transactionId = resolvedParams.transactionId;

  const { user, token, isStudent, isLoading } = useAuth();
  const router = useRouter();
  // Frozen per-mount timestamp keeps the render pure (no wall clock reads).
  const [clientNowTs] = useState(() => Date.now());

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/student/login");
    }
  }, [user, isStudent, isLoading, router]);

  const tx = useQuery(
    api.transactions.getTransactionDetails,
    token && isStudent
      ? { token, transactionId: transactionId as Id<"borrowTransactions">, clientNow: clientNowTs }
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
          href="/student/borrowed"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Borrowed Laptops</span>
        </Link>

        {tx === undefined ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 border border-slate-800 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-sm">Loading transaction...</span>
          </div>
        ) : tx === null ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 border border-slate-800">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">Transaction Not Found</h3>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 animate-slide-up">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
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
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>OVERDUE</span>
                    </span>
                  )}
                </div>
                <h1 className="text-lg font-bold text-white mt-2 font-mono">
                  {tx.id.slice(0, 12)}…
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tx.borrowerName} • {tx.gradeSection}
                </p>
              </div>

              <div className="text-right space-y-1">
                <div className="text-xs text-slate-400 flex items-center justify-end space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Issued {new Date(tx.issuedAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-400 flex items-center justify-end space-x-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Due {new Date(tx.dueAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center justify-end space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Issued by {tx.issuedByTeacherName}</span>
                </div>
              </div>
            </div>

            {/* Quantity Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-lg font-black text-white">{tx.issuedQuantity}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Borrowed</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-lg font-black text-emerald-400">{tx.returnedQuantity}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Returned</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-lg font-black text-amber-400">{tx.outstandingQuantity}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Outstanding</div>
              </div>
            </div>

            {/* Per-laptop lines */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Laptop Lines
              </h3>
              {tx.lines.map((line) => (
                <div
                  key={line.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {line.status === "RETURNED" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-white text-xs">{line.assetCode}</div>
                      <div className="text-[11px] text-slate-500 truncate">{line.model}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {line.status === "RETURNED" ? (
                      <>
                        <div className="text-[11px] text-slate-400">
                          Returned {new Date(line.returnedAt ?? tx.issuedAt).toLocaleString()}
                        </div>
                        {tx.receivedByTeacherName && (
                          <div className="text-[10px] text-slate-500">
                            Received by {tx.receivedByTeacherName}
                          </div>
                        )}
                      </>
                    ) : line.hasPendingReturnSubmission ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                        Return submitted — awaiting teacher
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Outstanding</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chronological history */}
            <div className="pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Chronological History
              </h3>
              <ol className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Issued {new Date(tx.issuedAt).toLocaleString()} by {tx.issuedByTeacherName}</span>
                </li>
                {tx.lines
                  .filter((l) => l.status === "RETURNED")
                  .sort((a, b) => (a.returnedAt ?? 0) - (b.returnedAt ?? 0))
                  .map((l) => (
                    <li key={l.id} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>
                        {l.assetCode} returned {new Date(l.returnedAt ?? 0).toLocaleString()}
                        {tx.receivedByTeacherName ? ` (received by ${tx.receivedByTeacherName})` : ""}
                      </span>
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

