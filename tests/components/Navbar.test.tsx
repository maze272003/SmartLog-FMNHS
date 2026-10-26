import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "@/components/Navbar";

// Mock the auth context (Navbar imports it via relative path resolving to the
// same module id as the alias below).
vi.mock("@/components/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useAuth } from "@/components/AuthContext";

const mockUseAuth = vi.mocked(useAuth);

// Navbar reads the active route via next/navigation — provide a stable path.
const usePathnameMock = vi.fn(() => "/teacher/dashboard");
vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("Navbar (UI-01: role-aware navigation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      token: "tok",
      user: {
        id: "u1",
        fullName: "Juan Dela Cruz",
        role: "TEACHER",
        status: "ACTIVE",
      },
      isLoading: false,
      isTeacher: true,
      isStudent: false,
      loginSession: vi.fn(),
      logout: vi.fn(),
    } as any);
  });

  it("renders nothing when unauthenticated", () => {
    mockUseAuth.mockReturnValue({
      token: null, user: null, isLoading: true,
      isTeacher: false, isStudent: false,
      loginSession: vi.fn(), logout: vi.fn(),
    } as any);
    const { container } = render(<Navbar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows teacher navigation for teachers", () => {
    render(<Navbar />);
    expect(screen.getAllByText("Inventory").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Students").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Custody").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Logbook & Export").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Profile").length).toBeGreaterThan(0);
    expect(screen.queryByText("Scan QR")).toBeNull();
  });

  it("shows student navigation for students", () => {
    mockUseAuth.mockReturnValue({
      token: "tok",
      user: {
        id: "u2",
        fullName: "Zyrine Amber Titan",
        role: "STUDENT",
        status: "ACTIVE",
        gradeLevel: 7,
        section: "Cybernauts",
      },
      isLoading: false,
      isTeacher: false,
      isStudent: true,
      loginSession: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(<Navbar />);
    expect(screen.getAllByText("Scan QR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Borrowed Laptops").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Calendar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("History").length).toBeGreaterThan(0);
    expect(screen.queryByText("Custody")).toBeNull();
  });

  it("displays the signed-in user's name and triggers logout", () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({
      token: "tok",
      user: {
        id: "u1",
        fullName: "Juan Dela Cruz",
        role: "TEACHER",
        status: "ACTIVE",
      },
      isLoading: false,
      isTeacher: true,
      isStudent: false,
      loginSession: vi.fn(),
      logout,
    } as any);

    render(<Navbar />);
    expect(screen.getAllByText("Juan Dela Cruz").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByTitle("Sign Out"));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
