"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import { History, Clock, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

// Completed and partially returned transactions with per-laptop return dates
// (asd.md §6.3 app/student/history).
export default function StudentHistoryPage() {
  const { user, token, isStudent, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/student/login");
    }
  }, [user, isStudent, isLoading, router]);

  const loans = useQuery(
    api.transactions.listMyBorrowed,
    token && isStudent ? { token } : "skip"
  );

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  const history = (loans ?? []).filter(
    (tx) => tx.displayStatus === "CLOSED" || tx.displayStatus === "PARTIALLY_RETURNED"
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-2">
            <History className="w-6 h-6 text-blue-400" />
            <span>Borrowing History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Completed and partially returned transactions with actual per-laptop return dates
          </p>
        </div>

        {loans === undefined ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 border border-slate-800 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-sm">Loading your history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 border border-slate-800">
            <History className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No Completed Borrowings Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Your finished transactions will appear here after teachers confirm returns.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((tx) => (
              <div
                key={tx.transactionId}
                className="glass-panel rounded-3xl p-6 border border-slate-800 animate-slide-up"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          tx.displayStatus === "CLOSED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {tx.displayStatus === "CLOSED" ? "COMPLETED" : "PARTIALLY RETURNED"}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(tx.issuedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        Issued {new Date(tx.issuedAt).toLocaleString()} • Due{" "}
                        {new Date(tx.dueAt).toLocaleString()}
                      </span>
                    </p>
                  </div>

                  <Link
                    href={`/student/transactions/${tx.transactionId}`}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-3 py-4">
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

                <div className="space-y-2">
                  {tx.returnedLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                    >
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="font-mono font-bold text-white text-xs">{line.assetCode}</span>
                          <span className="text-[11px] text-slate-500 ml-2">{line.model}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Returned {new Date(line.returnedAt ?? tx.issuedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {tx.activeLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="font-mono font-bold text-white text-xs">{line.assetCode}</span>
                          <span className="text-[11px] text-slate-500 ml-2">{line.model}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-amber-400 font-semibold">Still outstanding</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
