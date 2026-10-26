"use client";

import { use, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import { Laptop, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function QrResolutionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const qrToken = resolvedParams.token;

  const { user, token, isTeacher, isStudent, isLoading } = useAuth();
  const router = useRouter();

  const laptop = useQuery(
    api.laptops.resolveQr,
    token ? { token, qrToken } : "skip"
  );

  useEffect(() => {
    if (!isLoading && !user) {
      // Store redirect target
      router.push(`/student/login`);
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400 mr-2" />
        <span>Resolving laptop QR...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-xl mx-auto w-full px-4 py-16 flex-1 flex flex-col justify-center">
        {laptop === undefined ? (
          <div className="text-center py-12 text-slate-400 flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span>Looking up laptop unit...</span>
          </div>
        ) : laptop === null ? (
          <div className="glass-panel rounded-3xl p-8 border border-red-500/30 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">QR Code Not Recognized</h2>
            <p className="text-xs text-slate-400">
              The scanned token (<code className="font-mono text-slate-300">{qrToken}</code>) is not registered in the FMNHS laptop system.
            </p>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white"
            >
              <span>Return Home</span>
            </Link>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-8 border border-blue-500/30 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
              <Laptop className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-blue-400 tracking-wider">
                Scanned Equipment
              </div>
              <h2 className="text-2xl font-black text-white font-mono mt-1">
                {laptop.assetCode}
              </h2>
              <p className="text-sm text-slate-300 mt-1">{laptop.model}</p>
              <p className="text-xs text-slate-400 mt-0.5">Location: {laptop.location}</p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  laptop.isAvailable
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}
              >
                {laptop.availability}
              </span>
              <span className="text-xs text-slate-400">Condition: {laptop.condition}</span>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-center gap-3">
              {isTeacher ? (
                <Link
                  href="/teacher/inventory"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  View in Inventory
                </Link>
              ) : (
                <Link
                  href="/student/scan"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
                >
                  Add to Borrow Request
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
