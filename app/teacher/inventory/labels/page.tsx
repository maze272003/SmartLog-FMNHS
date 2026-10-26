"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import QRCode from "qrcode";
import { Printer, ArrowLeft, Laptop } from "lucide-react";
import Link from "next/link";

interface QrItem {
  id: string;
  assetCode: string;
  qrToken: string;
  model: string;
  dataUrl?: string;
}

export default function PrintableLabelsPage() {
  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();
  const [labels, setLabels] = useState<QrItem[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const laptops = useQuery(
    api.laptops.listLaptops,
    token && isTeacher ? { token } : "skip"
  );

  useEffect(() => {
    async function generateQrs() {
      if (!laptops) return;
      const items: QrItem[] = [];

      for (const l of laptops as any[]) {
        try {
          // The QR encodes the direct lookup token or application URL
          const qrPayload = `https://fmnhs.edu.ph/q/${l.qrToken}`;
          const dataUrl = await QRCode.toDataURL(qrPayload, {
            width: 180,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });
          items.push({
            id: l.id,
            assetCode: l.assetCode,
            qrToken: l.qrToken,
            model: l.model,
            dataUrl,
          });
        } catch (e) {
          console.error("QR generation error:", e);
        }
      }

      setLabels(items);
    }

    generateQrs();
  }, [laptops]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col print:bg-white print:text-black">
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        {/* Controls Bar (hidden during printing) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center space-x-3">
            <Link
              href="/teacher/inventory"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Printable QR Asset Stickers</h1>
              <p className="text-xs text-slate-400">
                Sticker paper layout for Fort Magsaysay NHS laptop units
              </p>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Stickers Now</span>
          </button>
        </div>

        {/* Labels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-4">
          {labels.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl p-4 bg-white text-slate-900 border-2 border-slate-300 shadow-md flex items-center space-x-4 break-inside-avoid print:border-black"
            >
              {/* QR Image */}
              {item.dataUrl ? (
                <img
                  src={item.dataUrl}
                  alt={`QR for ${item.assetCode}`}
                  className="w-24 h-24 object-contain rounded-lg border border-slate-200"
                />
              ) : (
                <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                  Loading QR...
                </div>
              )}

              {/* Label Metadata */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-700 print:text-black">
                  FMNHS • SPICT LAB
                </div>
                <div className="text-xl font-black font-mono tracking-tight text-slate-900">
                  {item.assetCode}
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                  {item.model}
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-1 truncate">
                  {item.qrToken}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

