"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Navbar from "@/components/Navbar";
import {
  Users,
  Plus,
  Search,
  KeyRound,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  X,
  ShieldAlert,
} from "lucide-react";

export default function TeacherStudentsPage() {
  const { user, token, isTeacher, isLoading } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  // Add form state
  const [fullName, setFullName] = useState("");
  const [lrn, setLrn] = useState("");
  const [email, setEmail] = useState("");
  const [gradeLevel, setGradeLevel] = useState<7 | 8 | 9 | 10>(7);
  const [section, setSection] = useState("Cybernauts");
  const [password, setPassword] = useState("Password123!");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isTeacher)) {
      router.push("/teacher/login");
    }
  }, [user, isTeacher, isLoading, router]);

  const students = useQuery(
    api.users.listStudents,
    token
      ? {
          token,
          gradeLevel: selectedGrade as any,
          search,
        }
      : "skip"
  );

  const createStudentMutation = useMutation(api.users.createStudent);
  const resetPasswordMutation = useMutation(api.users.resetStudentPassword);
  const updateStudentMutation = useMutation(api.users.updateStudent);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      await createStudentMutation({
        token,
        fullName,
        lrn,
        email: email.trim() || undefined,
        gradeLevel,
        section,
        password,
      });

      setShowAddModal(false);
      setFullName("");
      setLrn("");
      setEmail("");
      setPassword("Password123!");
    } catch (err: any) {
      setFormError(err?.message ?? "Failed to enroll student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedStudent || !newPassword) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      await resetPasswordMutation({
        token,
        studentId: selectedStudent.id,
        newPassword,
      });
      setShowResetModal(false);
      setSelectedStudent(null);
      setNewPassword("");
    } catch (err: any) {
      setFormError(err?.message ?? "Password reset failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (s: any) => {
    if (!token) return;
    const newStatus = s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateStudentMutation({
        token,
        studentId: s.id,
        fullName: s.fullName,
        email: s.email,
        gradeLevel: s.gradeLevel,
        section: s.section,
        status: newStatus,
      });
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-[#090d16] text-white flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">SPICT Student Roster</h1>
            <p className="text-xs text-slate-400 mt-1">
              Authorized borrowers in FMNHS Junior High School (Grades 7–10)
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Enroll New Student</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, LRN, or email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedGrade(undefined)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                selectedGrade === undefined
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              All Cohorts
            </button>
            {[7, 8, 9, 10].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedGrade === g
                    ? "bg-blue-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                Grade {g}
              </button>
            ))}
          </div>
        </div>

        {/* Students Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">LRN</th>
                  <th className="px-6 py-4">Grade & Section</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!students || students.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No student records found.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <div>{s.fullName}</div>
                          {s.email && (
                            <div className="text-[10px] text-slate-500 font-normal">{s.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300 font-medium">{s.lrn}</td>
                      <td className="px-6 py-4 text-slate-300">
                        Grade {s.gradeLevel} • {s.section}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(s)}
                          title="Click to toggle status"
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                          }`}
                        >
                          {s.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setShowResetModal(true);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors"
                        >
                          <KeyRound className="w-3 h-3 text-amber-400" />
                          <span>Reset Password</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Enroll Student */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/30 relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Enroll SPICT Student</h2>
                    <p className="text-xs text-slate-400">Grades 7–10 Computer Lab Eligibility</p>
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

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan De Guzman"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Learner Reference Number (LRN) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="12-digit LRN"
                      value={lrn}
                      onChange={(e) => setLrn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Alias (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="student@fmnhs.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Grade Level (SPICT) *
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) as 7 | 8 | 9 | 10;
                        setGradeLevel(val);
                        if (val === 7) setSection("Cybernauts");
                        if (val === 8) setSection("Python");
                        if (val === 9) setSection("Azure");
                        if (val === 10) setSection("AI");
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value={7}>Grade 7</option>
                      <option value={8}>Grade 8</option>
                      <option value={9}>Grade 9</option>
                      <option value={10}>Grade 10</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Section Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cybernauts"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    disabled={isSubmitting || !fullName || !lrn}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Enrolling..." : "Enroll Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reset Password */}
        {showResetModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-amber-500/30 relative">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Reset Student Password</h2>
                  <p className="text-xs text-slate-400">
                    {selectedStudent.fullName} (LRN: {selectedStudent.lrn})
                  </p>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newPassword}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Resetting..." : "Confirm Reset"}
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
