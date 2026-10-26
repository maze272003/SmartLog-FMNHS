"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import ActionConfirmModal from "@/components/ActionConfirmModal";
import jsQR from "jsqr";
import {
  Scan,
  Camera,
  Keyboard,
  Laptop,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function StudentScanPage() {
  const { user, token, isStudent, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Cart of selected laptops
  const [selectedLaptops, setSelectedLaptops] = useState<any[]>([]);
  const [purpose, setPurpose] = useState("SPICT Computer Laboratory Activity");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !isStudent)) {
      router.push("/student/login");
    }
  }, [user, isStudent, isLoading, router]);

  // All laptops query for quick manual lookup
  const allLaptops = useQuery(
    api.laptops.listLaptops,
    token ? { token } : "skip"
  );

  // Latest laptop list for the scan loop without re-capturing stale state.
  const allLaptopsRef = useRef<typeof allLaptops>(undefined);
  useEffect(() => {
    allLaptopsRef.current = allLaptops;
  }, [allLaptops]);

  const submitBorrowMutation = useMutation(api.requests.submitBorrowRequest);

  const addLaptopToCart = (laptop: any) => {
    if (!laptop.isAvailable && laptop.availability !== "AVAILABLE") {
      setSubmitError(`Laptop ${laptop.assetCode} is currently ${laptop.availability}`);
      return;
    }

    setSelectedLaptops((prev) => {
      if (prev.some((item) => item.id === laptop.id)) {
        return prev; // Prevent duplicate selection
      }
      return [...prev, laptop];
    });
    setSubmitError(null);
  };

  const handleDetectedCode = (codeData: string) => {
    const laptops = allLaptopsRef.current;
    if (!laptops) return;

    // QR could be full URL or token
    const tokenPart = codeData.includes("/q/") ? codeData.split("/q/")[1] : codeData;

    const matched = laptops.find(
      (l: any) =>
        l.qrToken === tokenPart ||
        l.assetCode.toUpperCase() === tokenPart.toUpperCase() ||
        codeData.toUpperCase().includes(l.assetCode.toUpperCase())
    );

    if (matched) {
      addLaptopToCart(matched);
      setScanMessage(`Scanned ${matched.assetCode} successfully!`);
    } else {
      setScanMessage(`Unrecognized QR code (${codeData}).`);
    }
  };

  // Camera start / stop. The scan loop lives inside the effect so ref
  // mutations (canvas/rAF) never run during render.
  useEffect(() => {
    let stream: MediaStream | null = null;

    const scanLoop = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleDetectedCode(code.data);
            // Pause scanning briefly
            setTimeout(() => {
              animationFrameRef.current = requestAnimationFrame(scanLoop);
            }, 1500);
            return;
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    };

    if (activeTab === "camera") {
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: "environment" },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
            setIsScanning(true);
            scanLoop();
          }
        })
        .catch((err) => {
          console.warn("Camera access failed:", err);
          setCameraError("Camera access unavailable. Please use the manual asset code input.");
          setActiveTab("manual");
        });
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeTab]);

  const removeLaptop = (id: string) => {
    setSelectedLaptops((prev) => prev.filter((item) => item.id !== id));
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allLaptops || !manualCode) return;

    const clean = manualCode.trim().toUpperCase();
    const matched = allLaptops.find(
      (l: any) => l.assetCode.toUpperCase() === clean
    );

    if (matched) {
      addLaptopToCart(matched);
      setManualCode("");
      setScanMessage(`Added ${matched.assetCode}`);
    } else {
      setSubmitError(`No laptop found with asset code "${clean}"`);
    }
  };

  const handleFinalSubmit = async () => {
    if (!token || selectedLaptops.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const laptopIds = selectedLaptops.map((l) => l.id);
      await submitBorrowMutation({
        token,
        laptopIds,
        purpose,
      });

      router.push("/student/requests");
    } catch (err: any) {
      setSubmitError(err?.message ?? "Failed to submit request");
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Scan & Borrow Laptops</h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan physical QR labels or enter asset codes to build your borrowing request
          </p>
        </div>

        {submitError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {scanMessage && (
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Scanner & Input */}
          <div className="lg:col-span-7 space-y-6">
            {/* Mode Switcher */}
            <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab("camera")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "camera"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Camera Scanner</span>
              </button>
              <button
                onClick={() => setActiveTab("manual")}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "manual"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Manual Asset Code</span>
              </button>
            </div>

            {/* Camera Viewfinder */}
            {activeTab === "camera" && (
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col items-center">
                <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black border-2 border-blue-500/40 shadow-2xl">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Aiming Reticle */}
                  <div className="absolute inset-8 border-2 border-dashed border-blue-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-4 text-center">
                  Point camera at the laptop sticker QR code. Detection is automatic.
                </p>
              </div>
            )}

            {/* Manual Code Input */}
            {activeTab === "manual" && (
              <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white">Enter Laptop Asset Code</h3>
                <form onSubmit={handleManualAdd} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. LAP-001"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono uppercase focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all"
                  >
                    Add
                  </button>
                </form>

                {/* Available Quick Buttons */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Available in Lab:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allLaptops
                      ?.filter((l: any) => l.isAvailable)
                      .map((l: any) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => addLaptopToCart(l)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-blue-300 hover:text-white transition-colors flex items-center space-x-1.5"
                        >
                          <Plus className="w-3 h-3 text-blue-400" />
                          <span>{l.assetCode}</span>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Multi-Laptop Selection Cart */}
          <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-blue-500/30 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Laptop className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white">Selected Laptops</h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30">
                {selectedLaptops.length} unit(s)
              </span>
            </div>

            {selectedLaptops.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No laptops selected yet. Scan a code or type an asset code to add.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedLaptops.map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-bold text-white text-xs">{l.assetCode}</div>
                      <div className="text-[11px] text-slate-400">{l.model}</div>
                      <div className="text-[10px] text-slate-500">{l.location}</div>
                    </div>

                    <button
                      onClick={() => removeLaptop(l.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Purpose Input */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-300">
                Purpose / Subject Activity *
              </label>
              <textarea
                rows={2}
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. SPICT Python Programming Laboratory Class"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={selectedLaptops.length === 0 || !purpose.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>Submit Borrow Request ({selectedLaptops.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Identity Confirmation Modal (Password Verification) */}
        <ActionConfirmModal
          isOpen={showConfirmModal}
          actionType="BORROW"
          actionDescription={`Requesting ${selectedLaptops.length} laptop(s): ${selectedLaptops.map((l) => l.assetCode).join(", ")}`}
          onSuccess={handleFinalSubmit}
          onCancel={() => setShowConfirmModal(false)}
        />
      </main>
    </div>
  );
}