"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import {
  FileText,
  Download,
  Search,
  Laptop,
  GraduationCap,
  FileSpreadsheet,
  ShieldAlert,
} from "lucide-react";

export default function TeacherLogbookPage() {
  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const logbookRows = useQuery(
    api.logbook.exportOperationalLogbook,
    token ? { token } : "skip"
  );

  const researchRows = useQuery(
    api.logbook.exportResearchMetrics,
    token ? { token } : "skip"
  );

  const downloadCsv = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h] ?? "";
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRows =
    logbookRows?.filter(
      (r) =>
        r.borrowerName.toLowerCase().includes(search.toLowerCase()) ||
        r.lrn.includes(search) ||
        r.assetCode.toLowerCase().includes(search.toLowerCase()) ||
        r.gradeSection.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Operational Logbook & Reporting
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Official borrowing records, server timestamps, and research export metrics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() =>
                downloadCsv(
                  logbookRows ?? [],
                  `LogTap_Operational_Logbook_${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Operational Logbook (CSV)</span>
            </button>

            <button
              onClick={() =>
                downloadCsv(
                  researchRows ?? [],
                  `LogTap_Research_Metrics_Deidentified_${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Research Dataset (De-identified)</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search borrower, LRN, asset code..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Logbook Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4">Borrower & LRN</th>
                  <th className="px-5 py-4">Cohort</th>
                  <th className="px-5 py-4">Laptop Unit</th>
                  <th className="px-5 py-4">Condition</th>
                  <th className="px-5 py-4">Issue Time</th>
                  <th className="px-5 py-4">Due Time</th>
                  <th className="px-5 py-4">Return Time</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No operational logs found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white">{r.borrowerName}</div>
                        <div className="text-[11px] font-mono text-slate-400">LRN: {r.lrn}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">{r.gradeSection}</td>
                      <td className="px-5 py-3.5 font-mono">
                        <span className="font-bold text-blue-400">{r.assetCode}</span>
                        <div className="text-[10px] text-slate-400">{r.model}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] text-slate-300">Out: {r.conditionOut}</span>
                        {r.conditionIn && (
                          <div className="text-[10px] text-slate-400">In: {r.conditionIn}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {new Date(r.issuedAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {new Date(r.dueAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                        {r.returnedAt ? new Date(r.returnedAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === "ACTIVE"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
