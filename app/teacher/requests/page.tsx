"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Laptop,
  GraduationCap,
  AlertCircle,
  ArrowRight,
  Calendar,
  X,
  ShieldCheck,
} from "lucide-react";

export default function TeacherRequestsPage() {
  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();

  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [dueHours, setDueHours] = useState(4); // Default 4 hours from now
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const requests = useQuery(
    api.requests.listPendingRequests,
    token ? { token } : "skip"
  );

  const approveMutation = useMutation(api.requests.approveRequest);
  const rejectMutation = useMutation(api.requests.rejectRequest);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedReq) return;
    setIsSubmitting(true);
    setActionError(null);

    const approvedDueAt = Date.now() + dueHours * 60 * 60 * 1000;

    try {
      await approveMutation({
        token,
        requestId: selectedReq.id,
        approvedDueAt,
      });
      setShowApproveModal(false);
      setSelectedReq(null);
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to approve request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedReq || !rejectReason) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      await rejectMutation({
        token,
        requestId: selectedReq.id,
        reason: rejectReason,
      });
      setShowRejectModal(false);
      setSelectedReq(null);
      setRejectReason("");
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to reject request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Student Borrow Requests</h1>
            <p className="text-xs text-slate-400 mt-1">
              Review and authorize laptop requests before physical laboratory handover
            </p>
          </div>

          <Link
            href="/teacher/transactions"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Go to Physical Issue & Custody</span>
          </Link>
        </div>

        {/* Requests List */}
        {!requests || requests.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 border border-slate-800">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No Pending Requests</h3>
            <p className="text-xs text-slate-500 mt-1">All student requests have been handled.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="glass-panel rounded-3xl p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-white flex items-center space-x-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-400" />
                      <span>{req.student?.fullName ?? "Student"}</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      LRN: {req.student?.lrn}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-900">
                      Grade {req.student?.gradeLevel} • {req.student?.section}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ml-auto sm:ml-0 ${
                        req.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Purpose:</span> {req.purpose}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Submitted: {new Date(req.submittedAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Requested Laptops */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {req.laptops.map((l: any) => (
                      <span
                        key={l.id}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200"
                      >
                        <Laptop className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-mono font-bold">{l.assetCode}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{l.model}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6">
                  {req.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setShowApproveModal(true);
                        }}
                        className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setShowRejectModal(true);
                        }}
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-semibold transition-all"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {req.status === "APPROVED" && (
                    <Link
                      href="/teacher/transactions"
                      className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-1"
                    >
                      <span>Release Laptops</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Approve Request */}
        {showApproveModal && selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-emerald-500/30 relative">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Approve Borrow Request</h2>
                  <p className="text-xs text-slate-400">
                    {selectedReq.student?.fullName} • {selectedReq.requestedQuantity} laptop(s)
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <form onSubmit={handleApprove} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Allowed Loan Duration
                  </label>
                  <select
                    value={dueHours}
                    onChange={(e) => setDueHours(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>1 Hour (Single Laboratory Period)</option>
                    <option value={2}>2 Hours (Double Laboratory Period)</option>
                    <option value={4}>4 Hours (Half Day)</option>
                    <option value={8}>8 Hours (Full School Day)</option>
                    <option value={24}>24 Hours (Next Day Due)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Laptops to issue:</span>{" "}
                  {selectedReq.laptops.map((l: any) => l.assetCode).join(", ")}
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowApproveModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Approving..." : "Confirm Approval"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reject Request */}
        {showRejectModal && selectedReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-red-500/30 relative">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Reject Request</h2>
                  <p className="text-xs text-slate-400">{selectedReq.student?.fullName}</p>
                </div>
              </div>

              <form onSubmit={handleReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Laboratory schedule conflict or laptop assigned for maintenance"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rejectReason}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
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