"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import ActionConfirmModal from "@/components/ActionConfirmModal";
import Link from "next/link";
import {
  Laptop,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function StudentBorrowedPage() {
  const { user, token, isStudent, isLoading } = useAuth();
  const router = useRouter();

  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/student/login");
    }
  }, [user, isStudent, isLoading, router]);

  const borrowings = useQuery(
    api.transactions.listMyBorrowed,
    token ? { token } : "skip"
  );

  const submitReturnMutation = useMutation(api.transactions.submitReturn);

  const toggleSelectLine = (id: string) => {
    setSelectedLines((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleReturnSuccess = async () => {
    if (!token || selectedLines.length === 0) return;
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await submitReturnMutation({
        token,
        loanLineIds: selectedLines as any,
      });

      if (res.success) {
        setActionSuccess(`Return request submitted for ${res.submittedCount} laptop(s). Please present the units to your teacher.`);
        setSelectedLines([]);
        setShowConfirmModal(false);
      }
    } catch (err: any) {
      setActionError(err?.message ?? "Return submission failed");
      setShowConfirmModal(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Borrowed Laptops</h1>
            <p className="text-xs text-slate-400 mt-1">
              Active equipment in your custody and return requests
            </p>
          </div>

          <Link
            href="/student/calendar"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all self-start sm:self-auto"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>View Due Calendar</span>
          </Link>
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

        {!borrowings || borrowings.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 border border-slate-800">
            <Laptop className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No Laptops on Loan</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              You do not have any active or historical laptop borrowings.
            </p>
            <Link
              href="/student/scan"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              <span>Scan QR to Borrow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {borrowings.map((tx) => (
              <div
                key={tx.transactionId}
                className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white">
                        Transaction Quantity: {tx.issuedQuantity} Laptop(s)
                      </span>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          tx.displayStatus === "OPEN"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : tx.displayStatus === "PARTIALLY_RETURNED"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {tx.displayStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex flex-wrap gap-4">
                      <span>Issued: {new Date(tx.issuedAt).toLocaleString()}</span>
                      <span className="font-semibold text-amber-400">
                        Due: {new Date(tx.dueAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400">
                      <strong className="text-white">{tx.outstandingQuantity}</strong> outstanding •{" "}
                      <strong className="text-emerald-400">{tx.returnedQuantity}</strong> returned
                    </span>
                  </div>
                </div>

                {/* Active Laptops */}
                {tx.activeLines.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Currently Outstanding Units (Select to request return):
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {tx.activeLines.map((line: any) => {
                        const isSelected = selectedLines.includes(line.id);
                        return (
                          <div
                            key={line.id}
                            onClick={() => toggleSelectLine(line.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10"
                                : "bg-slate-900 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // Handled by div click
                                className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-950 border-slate-700"
                              />
                              <div>
                                <div className="font-mono font-bold text-white text-sm">
                                  {line.assetCode}
                                </div>
                                <div className="text-xs text-slate-400">{line.model}</div>
                              </div>
                            </div>

                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                              Out: {line.conditionOut}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Previously Returned Laptops in this transaction */}
                {tx.returnedLines.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Returned Units ({tx.returnedLines.length}):
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tx.returnedLines.map((line: any) => (
                        <span
                          key={line.id}
                          className="inline-flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono font-semibold text-slate-300">{line.assetCode}</span>
                          <span className="text-[10px] text-slate-500">
                            (Returned {new Date(line.returnedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Floating Return Button */}
        {selectedLines.length > 0 && (
          <div className="fixed bottom-6 right-6 z-40 animate-slide-up">
            <button
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-2xl shadow-blue-600/50 transition-all border border-blue-400/30"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Initiate Return ({selectedLines.length} Selected)</span>
            </button>
          </div>
        )}

        {/* Identity Confirmation Modal */}
        <ActionConfirmModal
          isOpen={showConfirmModal}
          actionType="RETURN"
          actionDescription={`Confirming physical return of ${selectedLines.length} laptop(s)`}
          onSuccess={handleReturnSuccess}
          onCancel={() => setShowConfirmModal(false)}
        />
      </main>
    </div>
  );
}
