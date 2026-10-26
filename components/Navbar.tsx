"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import {
  Laptop,
  QrCode,
  Users,
  FileText,
  Calendar,
  LogOut,
  ShieldCheck,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  Scan,
} from "lucide-react";

export default function Navbar() {
  const { user, isTeacher, isStudent, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const teacherLinks = [
    { href: "/teacher/dashboard", label: "Dashboard", icon: ClipboardList },
    { href: "/teacher/inventory", label: "Inventory", icon: Laptop },
    { href: "/teacher/inventory/labels", label: "QR Labels", icon: QrCode },
    { href: "/teacher/students", label: "Students", icon: Users },
    { href: "/teacher/requests", label: "Requests", icon: CheckCircle2 },
    { href: "/teacher/transactions", label: "Custody", icon: ShieldCheck },
    { href: "/teacher/logbook", label: "Logbook & Export", icon: FileText },
    { href: "/teacher/profile", label: "Profile", icon: GraduationCap },
  ];

  const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: ClipboardList },
    { href: "/student/scan", label: "Scan QR", icon: Scan },
    { href: "/student/requests", label: "My Requests", icon: CheckCircle2 },
    { href: "/student/borrowed", label: "Borrowed Laptops", icon: Laptop },
    { href: "/student/calendar", label: "Calendar", icon: Calendar },
    { href: "/student/history", label: "History", icon: FileText },
    { href: "/student/profile", label: "Profile", icon: GraduationCap },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-blue-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            href={isTeacher ? "/teacher/dashboard" : "/student/dashboard"}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:border-blue-400 group-hover:scale-105 transition-all">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-white">Log</span>
                <span className="text-xl font-bold tracking-tight text-blue-400">Tap</span>
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-1" />
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">
                FMNHS • SPICT Laptops
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white">{user.fullName}</span>
              <span className="text-[11px] text-blue-400 font-mono flex items-center justify-end space-x-1">
                {isTeacher ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>Teacher</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3 h-3 text-emerald-400" />
                    <span>Grade {user.gradeLevel} - {user.section}</span>
                  </>
                )}
              </span>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Nav row */}
        <div className="md:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/80">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600/25 text-blue-300 border border-blue-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
