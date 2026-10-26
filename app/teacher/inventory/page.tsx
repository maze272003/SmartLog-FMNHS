"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Laptop,
  Plus,
  Search,
  Filter,
  QrCode,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  X,
} from "lucide-react";

export default function TeacherInventoryPage() {
  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [assetCode, setAssetCode] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [location, setLocation] = useState("Computer Lab Cart A");
  const [condition, setCondition] = useState<"GOOD" | "FAIR" | "DAMAGED">("GOOD");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const laptops = useQuery(
    api.laptops.listLaptops,
    token ? { token, availability: statusFilter, search } : "skip"
  );

  const createLaptopMutation = useMutation(api.laptops.createLaptop);

  const handleCreateLaptop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      await createLaptopMutation({
        token,
        assetCode,
        model,
        serialNumber: serialNumber || undefined,
        location,
        condition,
        notes: notes || undefined,
      });

      setShowAddModal(false);
      setAssetCode("");
      setModel("");
      setSerialNumber("");
      setNotes("");
    } catch (err: any) {
      setFormError(err?.message ?? "Failed to create laptop");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        {/* Header with Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Laptop Inventory</h1>
            <p className="text-xs text-slate-400 mt-1">
              FMNHS SPICT Laboratory Equipment Records & QR Tokens
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/teacher/inventory/labels"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <QrCode className="w-4 h-4 text-blue-400" />
              <span>Print Stickers</span>
            </Link>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Laptop</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asset code, model, location..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["ALL", "AVAILABLE", "BORROWED", "UNAVAILABLE"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Laptop Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Asset Code</th>
                  <th className="px-6 py-4">Model & Specs</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Condition</th>
                  <th className="px-6 py-4">Availability</th>
                  <th className="px-6 py-4 text-right">QR Token</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!laptops || laptops.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No laptops match the current filter or search criteria.
                    </td>
                  </tr>
                ) : (
                  laptops.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white flex items-center space-x-2">
                        <Laptop className="w-4 h-4 text-blue-400" />
                        <span>{l.assetCode}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-200">
                        <div>{l.model}</div>
                        {l.serialNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            SN: {l.serialNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{l.location}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            l.condition === "GOOD"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : l.condition === "FAIR"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {l.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            l.availability === "AVAILABLE"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : l.availability === "BORROWED"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {l.availability}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-400 text-[11px]">
                        {l.qrToken}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Register Laptop */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/30 relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Register Physical Laptop</h2>
                    <p className="text-xs text-slate-400">Generates unique asset code & QR token</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateLaptop} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Asset Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LAP-006"
                      value={assetCode}
                      onChange={(e) => setAssetCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Initial Condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="GOOD">GOOD (Ready for loan)</option>
                      <option value="FAIR">FAIR (Functional)</option>
                      <option value="DAMAGED">DAMAGED (Needs repair)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Model & Specs *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell Latitude 3420 (Core i5, 16GB RAM)"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Serial Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SN-883719"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Location in Lab *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cart A - Slot 4"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Optional condition notes or accessories included"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !assetCode || !model || !location}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Registering..." : "Save & Generate QR"}
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
