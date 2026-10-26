"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertOctagon,
  PackageCheck,
} from "lucide-react";

type ConditionIn = "GOOD" | "FAIR" | "DAMAGED";

// All laptop lines, explicit borrowed/returned/outstanding counts, timestamps,
// teachers, and physical return action for selected lines (asd.md §6.2
// app/teacher/transactions/[transactionId]).
export default function TeacherTransactionPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const resolvedParams = use(params);
  const transactionId = resolvedParams.transactionId;

  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();
  const convex = useConvex();
  // Frozen per-mount timestamp keeps the render pure (no wall clock reads).
  const [clientNowTs] = useState(() => Date.now());

  // Selected active lines for physical receipt, with per-line condition
  const [selected, setSelected] = useState<Record<string, ConditionIn>>({});
  const [returnNotes, setReturnNotes] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [justReturned, setJustReturned] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const tx = useQuery(
    api.transactions.getTransactionDetails,
    token && isTeacher
      ? { token, transactionId: transactionId as Id<"borrowTransactions">, clientNow: clientNowTs }
      : "skip"
  );

  const confirmReturnMutation = useMutation(api.transactions.confirmReturn);

  const toggleSelect = (lineId: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[lineId]) {
        delete next[lineId];
      } else {
        next[lineId] = "GOOD";
      }
      return next;
    });
    setJustReturned(null);
  };

  const setCondition = (lineId: string, condition: ConditionIn) => {
    setSelected((prev) => ({ ...prev, [lineId]: condition }));
    setJustReturned(null);
  };

  const handleConfirmReturn = async () => {
    if (!token || Object.keys(selected).length === 0) return;
    setIsConfirming(true);
    setConfirmError(null);

    try {
      const lineReturns = Object.entries(selected).map(([loanLineId, conditionIn]) => ({
        loanLineId: loanLineId as Id<"loanLines">,
        conditionIn,
        returnNotes: returnNotes.trim() ? returnNotes.trim() : undefined,
      }));

      const res = await confirmReturnMutation({ token, lineReturns });
      setJustReturned(res.returnedCount);
      setSelected({});
      setReturnNotes("");
      // Refresh details
      await convex.query(api.transactions.getTransactionDetails, {
        token,
        transactionId: transactionId as Id<"borrowTransactions">,
        clientNow: Date.now(),
      });
    } catch (err: any) {
      setConfirmError(err?.message ?? "Failed to confirm return");
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <Link
          href="/teacher/transactions"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Custody</span>
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
          <div className="space-y-6 animate-slide-up">
            {/* Header */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
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
                        <AlertOctagon className="w-3 h-3" />
                        <span>OVERDUE</span>
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-white mt-2">{tx.borrowerName}</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    LRN <span className="font-mono text-slate-300">{tx.lrn}</span> • {tx.gradeSection}
                  </p>
                </div>

                <div className="text-right space-y-1 text-xs text-slate-400">
                  <div>Issued {new Date(tx.issuedAt).toLocaleString()}</div>
                  <div>Due {new Date(tx.dueAt).toLocaleString()}</div>
                  <div className="text-slate-500">by {tx.issuedByTeacherName}</div>
                </div>
              </div>

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
            </div>

            {/* Physical return panel */}
            {tx.outstandingQuantity > 0 && (
              <div className="glass-panel rounded-3xl p-6 border border-emerald-500/30 space-y-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Confirm Physical Return</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Inspect each laptop, then select the lines you are physically receiving.
                  Damaged units are flagged automatically and removed from circulation.
                </p>

                {confirmError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                    {confirmError}
                  </div>
                )}
                {justReturned !== null && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-semibold">
                    Confirmed receipt of {justReturned} laptop(s).
                  </div>
                )}

                <div className="space-y-2">
                  {tx.lines
                    .filter((l) => l.status === "ACTIVE")
                    .map((line) => (
                      <div
                        key={line.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          selected[line.id]
                            ? "bg-emerald-950/40 border-emerald-500/40"
                            : "bg-slate-900/60 border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => toggleSelect(line.id)}
                            className="flex items-center space-x-3 text-left"
                          >
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                                selected[line.id]
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "border-slate-600"
                              }`}
                            >
                              {selected[line.id] && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-mono font-bold text-white text-xs">
                                {line.assetCode}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {line.model} • issued as {line.conditionOut}
                                {line.hasPendingReturnSubmission && (
                                  <span className="ml-2 text-blue-300 font-semibold">
                                    • return submitted by student
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>

                        {selected[line.id] && (
                          <div className="mt-3 pl-8 flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Received condition:
                            </span>
                            {(["GOOD", "FAIR", "DAMAGED"] as ConditionIn[]).map((c) => (
                              <button
                                key={c}
                                onClick={() => setCondition(line.id, c)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                  selected[line.id] === c
                                    ? c === "DAMAGED"
                                      ? "bg-red-600/30 text-red-300 border-red-500/40"
                                      : "bg-emerald-600/30 text-emerald-300 border-emerald-500/40"
                                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Return note (optional, applied to selected lines)
                  </label>
                  <input
                    type="text"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="e.g. Screen wiped and inspected, charger returned"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  onClick={handleConfirmReturn}
                  disabled={selectedCount === 0 || isConfirming}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" />
                      <span>
                        Confirm Receipt of {selectedCount} Laptop{selectedCount === 1 ? "" : "s"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* All lines */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">All Laptop Lines</h2>
              </div>

              <div className="space-y-2">
                {tx.lines.map((line) => (
                  <div
                    key={line.id}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {line.status === "RETURNED" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-mono font-bold text-white text-xs">{line.assetCode}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {line.model} • out: {line.conditionOut}
                          {line.conditionIn ? ` • in: ${line.conditionIn}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {line.status === "RETURNED" ? (
                        <>
                          <div className="text-[11px] text-slate-400">
                            {new Date(line.returnedAt ?? tx.issuedAt).toLocaleString()}
                          </div>
                          {tx.receivedByTeacherName && (
                            <div className="text-[10px] text-slate-500">
                              received by {tx.receivedByTeacherName}
                            </div>
                          )}
                        </>
                      ) : line.hasPendingReturnSubmission ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                          Return submitted
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Outstanding</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
