"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import Navbar from "@/components/Navbar";
import QRCode from "qrcode";
import {
  Laptop,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  QrCode,
  MapPin,
  Stethoscope,
  Hash,
  History,
  CheckCircle2,
  Clock,
} from "lucide-react";

// Laptop details, QR preview, condition, location, and complete loan history
// (asd.md §6.2 app/teacher/inventory/[laptopId]).
export default function TeacherLaptopPage({
  params,
}: {
  params: Promise<{ laptopId: string }>;
}) {
  const resolvedParams = use(params);
  const laptopId = resolvedParams.laptopId;

  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const laptop = useQuery(
    api.laptops.getLaptop,
    token && isTeacher ? { token, laptopId: laptopId as Id<"laptops"> } : "skip"
  );

  useEffect(() => {
    if (!laptop || (laptop as any).qrToken === undefined) return;
    QRCode.toDataURL(`https://fmnhs.edu.ph/q/${(laptop as any).qrToken}`, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [laptop]);

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

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <Link
          href="/teacher/inventory"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-white font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inventory</span>
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
          <div className="space-y-6 animate-slide-up">
            {/* Details card */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/30 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                    <Laptop className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white font-mono tracking-tight">
                      {laptop.assetCode}
                    </h1>
                    <p className="text-sm text-slate-300 mt-0.5">{laptop.model}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      laptop.availability === "AVAILABLE"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : laptop.availability === "BORROWED"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {laptop.availability}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {laptop.condition}
                  </span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Location</div>
                    <div className="text-sm text-slate-200 font-medium">{laptop.location}</div>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
                  <Hash className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Serial Number</div>
                    <div className="text-sm text-slate-200 font-mono">
                      {(laptop as any).serialNumber ?? "—"}
                    </div>
                  </div>
                </div>
              </div>

              {(laptop as any).notes && (
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                  <Stethoscope className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Notes</div>
                    <div className="text-xs text-slate-300 whitespace-pre-wrap">
                      {(laptop as any).notes}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* QR preview card */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-36 h-36 rounded-2xl bg-white p-2 shrink-0">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${laptop.assetCode}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                    Generating QR…
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center space-x-2 text-blue-400 mb-1">
                  <QrCode className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Unit QR Label</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Print the full sticker sheet from the QR Labels page. The QR encodes this
                  unit&apos;s unique opaque token — scanning it opens the laptop instantly.
                </p>
                <div className="mt-2 font-mono text-[11px] text-slate-500 break-all">
                  token: {(laptop as any).qrToken}
                </div>
                <Link
                  href="/teacher/inventory/labels"
                  className="inline-flex items-center space-x-1.5 mt-3 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open Printable Labels</span>
                </Link>
              </div>
            </div>

            {/* Loan history */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Loan History</h2>
              </div>

              {!(laptop as any).recentLoans || (laptop as any).recentLoans.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  This laptop has never been issued.
                </div>
              ) : (
                <div className="space-y-2">
                  {(laptop as any).recentLoans.map((line: any) => (
                    <div
                      key={line._id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {line.status === "RETURNED" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <div className="text-xs">
                          <div className="text-slate-300 font-medium">
                            Issued {new Date(line._creationTime).toLocaleDateString()}
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Out as {line.conditionOut}
                            {line.conditionIn ? ` • Returned as ${line.conditionIn}` : " • Outstanding"}
                          </div>
                        </div>
                      </div>
                      {line.returnedAt && (
                        <span className="text-[11px] text-slate-400 shrink-0">
                          Returned {new Date(line.returnedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


