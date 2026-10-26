"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Navbar from "@/components/Navbar";
import {
  Laptop,
  MapPin,
  ArrowLeft,
  Scan,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// Safe laptop information and availability with add-to-request action
// (asd.md §6.3 app/student/laptops/[laptopId]). Students see a safe
// projection only — no serial numbers, notes, or QR tokens.
export default function StudentLaptopPage({
  params,
}: {
  params: Promise<{ laptopId: string }>;
}) {
  const resolvedParams = use(params);
  const laptopId = resolvedParams.laptopId;

  const { user, token, isStudent, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/student/login");
    }
  }, [user, isStudent, isLoading, router]);

  const laptop = useQuery(
    api.laptops.getLaptop,
    token && isStudent ? { token, laptopId: laptopId as Id<"laptops"> } : "skip"
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

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <Link
          href="/student/scan"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Scan & Borrow</span>
        </Link>

        {laptop === undefined ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 border border-slate-800 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-sm">Loading laptop...</span>
          </div>
        ) : laptop === null ? (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 border border-slate-800">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">Laptop Not Found</h3>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/30 space-y-6 animate-slide-up">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
                <Laptop className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white font-mono tracking-tight">
                  {laptop.assetCode}
                </h1>
                <p className="text-sm text-slate-300 mt-1">{laptop.model}</p>
              </div>

              <div className="flex items-center justify-center flex-wrap gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    laptop.isAvailable
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                  }`}
                >
                  {laptop.isAvailable ? "AVAILABLE FOR BORROWING" : laptop.availability}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Condition: {laptop.condition}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Storage Location
                </div>
                <div className="text-sm text-slate-200 font-medium">{laptop.location}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              {laptop.isAvailable ? (
                <>
                  <Link
                    href="/student/scan"
                    className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all"
                  >
                    <Scan className="w-4 h-4" />
                    <span>Add to Borrow Request</span>
                  </Link>
                  <p className="text-center text-[11px] text-slate-500">
                    Continue on the Scan &amp; Borrow page — enter{" "}
                    <span className="font-mono text-blue-300">{laptop.assetCode}</span> or scan
                    its QR label, then confirm your password to submit.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-sm font-bold">
                    <XCircle className="w-4 h-4" />
                    <span>Not Available Right Now</span>
                  </div>
                  <p className="text-center text-[11px] text-slate-500">
                    This unit cannot be requested while its status is {laptop.availability}. Check
                    other units on the Scan &amp; Borrow page.
                  </p>
                </>
              )}

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 pt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Availability updates in real time</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

