"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Laptop,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function StudentCalendarPage() {
  const { user, token, isStudent, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/student/login");
    }
  }, [user, isStudent, isLoading, router]);

  const calendarEvents = useQuery(
    api.transactions.getMyCalendar,
    token ? { token } : "skip"
  );

  // One timestamp per mount keeps renders pure while still deriving
  // today/overdue groupings in Asia/Manila.
  const [now] = useState(() => Date.now());

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Loan Due Calendar</h1>
            <p className="text-xs text-slate-400 mt-1">
              Scheduled laboratory equipment return times and agendas
            </p>
          </div>

          <Link
            href="/student/borrowed"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Laptop className="w-4 h-4" />
            <span>Manage Returns</span>
          </Link>
        </div>

        {!calendarEvents || calendarEvents.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 border border-slate-800">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No Scheduled Loan Deadlines</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              You have returned all borrowed equipment or have no active loans.
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calendarEvents.map((evt) => {
              const isOverdue = evt.dueAt < now;
              const dueDate = new Date(evt.dueAt);
              const issueDate = new Date(evt.issuedAt);

              return (
                <div
                  key={evt.transactionId}
                  className={`glass-panel rounded-3xl p-6 border flex flex-col justify-between space-y-5 transition-all ${
                    isOverdue
                      ? "border-red-500/40 shadow-lg shadow-red-500/10"
                      : "border-blue-500/30"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
                        <CalendarIcon className="w-4 h-4 text-blue-400" />
                        <span>{dueDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>

                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                          isOverdue
                            ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {isOverdue && <AlertTriangle className="w-3 h-3 mr-0.5" />}
                        <span>{isOverdue ? "OVERDUE" : "SCHEDULED"}</span>
                      </span>
                    </div>

                    <div>
                      <div className="text-3xl font-black text-white font-mono">
                        {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Issued: {issueDate.toLocaleDateString()} at {issueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="text-xs font-semibold text-slate-300">
                        Outstanding: {evt.outstandingQuantity} Unit(s)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {evt.laptops.map((l: any) => (
                          <span
                            key={l.id}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-blue-300"
                          >
                            {l.assetCode}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/student/borrowed"
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-center text-slate-300 hover:text-white transition-colors"
                  >
                    View & Return Laptops
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}