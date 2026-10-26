"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Laptop,
  XCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function StudentRequestsPage() {
  const { user, token, isStudent, isLoading } = useAuth();
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/student/login");
    }
  }, [user, isStudent, isLoading, router]);

  const requests = useQuery(
    api.requests.listMyRequests,
    token ? { token } : "skip"
  );

  const cancelMutation = useMutation(api.requests.cancelRequest);

  const handleCancel = async (requestId: any) => {
    if (!token) return;
    if (!confirm("Are you sure you want to cancel this request?")) return;

    setCancellingId(requestId);
    try {
      await cancelMutation({ token, requestId });
    } catch (err: any) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Borrow Requests</h1>
            <p className="text-xs text-slate-400 mt-1">
              Track teacher review status and collection approvals
            </p>
          </div>

          <Link
            href="/student/scan"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Borrow Request</span>
          </Link>
        </div>

        {!requests || requests.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 border border-slate-800">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No Requests Submitted</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              You haven't requested any laptops yet.
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
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white text-base">
                      {req.requestedQuantity} Laptop Unit(s)
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        req.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : req.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : req.status === "FULFILLED"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Purpose:</span> {req.purpose}
                  </p>

                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-4">
                    <span>Submitted: {new Date(req.submittedAt).toLocaleString()}</span>
                    {req.approvedDueAt && (
                      <span className="text-emerald-400 font-semibold">
                        Due: {new Date(req.approvedDueAt).toLocaleString()}
                      </span>
                    )}
                    {req.reviewReason && (
                      <span className="text-slate-400">Note: {req.reviewReason}</span>
                    )}
                  </div>

                  {/* Laptops */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {req.laptops.map((l: any) => (
                      <span
                        key={l.id}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                      >
                        <Laptop className="w-3 h-3 text-blue-400" />
                        <span>{l.assetCode}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cancel action if not fulfilled/terminal */}
                {(req.status === "PENDING" || req.status === "APPROVED") && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    disabled={cancellingId === req.id}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-semibold transition-all shrink-0 self-start sm:self-auto disabled:opacity-50"
                  >
                    {cancellingId === req.id ? "Cancelling..." : "Cancel Request"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
