"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Laptop,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  X,
  FileCheck,
} from "lucide-react";

export default function TeacherTransactionsPage() {
  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();

  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnConditions, setReturnConditions] = useState<Record<string, "GOOD" | "FAIR" | "DAMAGED">>({});
  const [returnSelected, setReturnSelected] = useState<Record<string, boolean>>({});
  const [returnNotes, setReturnNotes] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const approvedRequests = useQuery(
    api.requests.listPendingRequests,
    token ? { token } : "skip"
  );

  const transactions = useQuery(
    api.transactions.listTeacherTransactions,
    token ? { token } : "skip"
  );

  const releaseMutation = useMutation(api.transactions.releaseTransaction);
  const confirmReturnMutation = useMutation(api.transactions.confirmReturn);

  // Filter approved unissued requests
  const readyToIssue = approvedRequests?.filter((r) => r.status === "APPROVED") ?? [];

  const handleRelease = async (reqId: any, borrowerName: string, count: number) => {
    if (!token) return;
    if (!confirm(`Confirm physical release of ${count} laptop(s) to ${borrowerName}?`)) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await releaseMutation({
        token,
        requestId: reqId,
      });

      if (res.success) {
        setActionSuccess(`Successfully issued ${res.issuedQuantity} laptop(s) to ${borrowerName}`);
      }
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to release laptops");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReturnModal = (tx: any) => {
    setSelectedTx(tx);
    const initialSel: Record<string, boolean> = {};
    const initialCond: Record<string, "GOOD" | "FAIR" | "DAMAGED"> = {};
    const initialNotes: Record<string, string> = {};

    for (const line of tx.lines) {
      if (line.status === "ACTIVE") {
        initialSel[line.id] = true;
        initialCond[line.id] = line.conditionOut ?? "GOOD";
        initialNotes[line.id] = "";
      }
    }

    setReturnSelected(initialSel);
    setReturnConditions(initialCond);
    setReturnNotes(initialNotes);
    setActionError(null);
    setShowReturnModal(true);
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTx) return;

    const itemsToReturn = Object.entries(returnSelected)
      .filter(([_, checked]) => checked)
      .map(([lineId]) => ({
        loanLineId: lineId as any,
        conditionIn: returnConditions[lineId] ?? "GOOD",
        returnNotes: returnNotes[lineId] ? returnNotes[lineId].trim() : undefined,
      }));

    if (itemsToReturn.length === 0) {
      setActionError("Please select at least one laptop to receive.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await confirmReturnMutation({
        token,
        lineReturns: itemsToReturn,
      });

      if (res.success) {
        setActionSuccess(`Confirmed physical return of ${res.returnedCount} laptop(s)`);
        setShowReturnModal(false);
        setSelectedTx(null);
      }
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to confirm return");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Physical Custody Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Teacher-confirmed physical release and return reception of FMNHS laptops
          </p>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Section 1: Ready to Issue */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white uppercase tracking-wider">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h2>Approved Requests Ready for Release ({readyToIssue.length})</h2>
          </div>

          {readyToIssue.length === 0 ? (
            <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-500 border border-slate-800">
              No approved requests awaiting physical release.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {readyToIssue.map((req) => (
                <div
                  key={req.id}
                  className="glass-panel rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 font-bold text-white text-sm">
                        <GraduationCap className="w-4 h-4 text-emerald-400" />
                        <span>{req.student?.fullName}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">LRN: {req.student?.lrn}</span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">
                      Quantity: <span className="text-emerald-400 font-bold">{req.requestedQuantity} laptop(s)</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Purpose: {req.purpose}</p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {req.laptops.map((l: any) => (
                        <span
                          key={l.id}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-200"
                        >
                          {l.assetCode}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRelease(req.id, req.student?.fullName ?? "Student", req.requestedQuantity)}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Physical Issue</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Active Borrowings & Returns */}
        <section className="space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h2>Active Loan Custody & Return Reception</h2>
          </div>

          {!transactions || transactions.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-800">
              No active or previous loan transactions recorded.
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{tx.borrowerName}</span>
                      <span className="text-xs text-slate-400 font-mono">LRN: {tx.lrn}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {tx.gradeSection}
                      </span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ml-auto md:ml-0 ${
                          tx.displayStatus === "OPEN"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : tx.displayStatus === "PARTIALLY_RETURNED"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {tx.displayStatus}
                      </span>
                      {tx.hasPendingReturns && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold animate-pulse">
                          Student Return Submitted
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                      <span>Issued: {new Date(tx.issuedAt).toLocaleString()}</span>
                      <span>Due: {new Date(tx.dueAt).toLocaleString()}</span>
                      <span>
                        Count:{" "}
                        <strong className="text-white">
                          {tx.outstandingQuantity} outstanding
                        </strong>{" "}
                        ({tx.returnedQuantity} returned / {tx.issuedQuantity} total)
                      </span>
                    </div>

                    {/* Per-laptop line items */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {tx.lines.map((l: any) => (
                        <span
                          key={l.id}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-mono ${
                            l.status === "ACTIVE"
                              ? "bg-blue-950/80 border border-blue-500/30 text-blue-200"
                              : "bg-slate-900 border border-slate-800 text-slate-500 line-through"
                          }`}
                        >
                          <Laptop className="w-3 h-3" />
                          <span>{l.assetCode}</span>
                          <span className="text-[10px] font-sans">({l.status})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {tx.outstandingQuantity > 0 && (
                    <button
                      onClick={() => openReturnModal(tx)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all shrink-0 flex items-center justify-center space-x-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Receive Return</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal: Confirm Return */}
        {showReturnModal && selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/30 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Confirm Laptop Return</h2>
                    <p className="text-xs text-slate-400">
                      Borrower: {selectedTx.borrowerName} (LRN: {selectedTx.lrn})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReturnModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmReturn} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select which active laptops are physically handed over, inspect condition, and record notes:
                </p>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {selectedTx.lines
                    .filter((l: any) => l.status === "ACTIVE")
                    .map((line: any) => (
                      <div
                        key={line.id}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={returnSelected[line.id] ?? false}
                              onChange={(e) =>
                                setReturnSelected({
                                  ...returnSelected,
                                  [line.id]: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded text-blue-600 focus:ring-0 focus:outline-none bg-slate-950 border-slate-700"
                            />
                            <span className="font-mono font-bold text-sm text-white">
                              {line.assetCode}
                            </span>
                            <span className="text-xs text-slate-400">({line.model})</span>
                          </label>

                          <div className="flex items-center space-x-1.5 text-xs">
                            <span className="text-slate-400">Condition:</span>
                            <select
                              value={returnConditions[line.id] ?? "GOOD"}
                              onChange={(e) =>
                                setReturnConditions({
                                  ...returnConditions,
                                  [line.id]: e.target.value as any,
                                })
                              }
                              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
                            >
                              <option value="GOOD">GOOD</option>
                              <option value="FAIR">FAIR</option>
                              <option value="DAMAGED">DAMAGED</option>
                            </select>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Optional condition or return note..."
                          value={returnNotes[line.id] ?? ""}
                          onChange={(e) =>
                            setReturnNotes({
                              ...returnNotes,
                              [line.id]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    ))}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Receiving..." : "Confirm Physical Return"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
