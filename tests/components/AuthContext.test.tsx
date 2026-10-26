import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/AuthContext";

// In-memory localStorage for jsdom
const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
  key: () => null,
  get length() {
    return storage.size;
  },
});

const useQueryMock = vi.fn();
const useMutationMock = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: () => useQueryMock(),
  useMutation: () => useMutationMock,
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

function Probe() {
  const { token, user, isTeacher, isStudent, isLoading } = useAuth();
  return (
    <div>
      <div data-testid="token">{token ?? "none"}</div>
      <div data-testid="user">{user?.fullName ?? "anon"}</div>
      <div data-testid="role">{isTeacher ? "TEACHER" : isStudent ? "STUDENT" : "none"}</div>
      <div data-testid="loading">{String(isLoading)}</div>
    </div>
  );
}

describe("AuthContext session handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();
    pushMock.mockClear();
    useMutationMock.mockResolvedValue({ success: true });
  });

  it("starts unauthenticated and reports finished loading", async () => {
    useQueryMock.mockReturnValue(undefined);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("false")
    );
    expect(screen.getByTestId("token").textContent).toBe("none");
    expect(screen.getByTestId("user").textContent).toBe("anon");
  });

  it("restores a persisted token and resolves the teacher profile", async () => {
    storage.set("logtap_auth_token", "stored-token");
    useQueryMock.mockReturnValue({
      id: "u1",
      fullName: "Juan Dela Cruz",
      role: "TEACHER",
      status: "ACTIVE",
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("Juan Dela Cruz")
    );
    expect(screen.getByTestId("token").textContent).toBe("stored-token");
    expect(screen.getByTestId("role").textContent).toBe("TEACHER");
  });

  it("logs out: invalidates the session, clears storage, and redirects home", async () => {
    storage.set("logtap_auth_token", "stored-token");
    useQueryMock.mockReturnValue({
      id: "u2",
      fullName: "Zyrine Titan",
      role: "STUDENT",
      status: "ACTIVE",
    });

    function LogoutProbe() {
      const { logout } = useAuth();
      return <button onClick={() => logout()}>Sign Out</button>;
    }

    render(
      <AuthProvider>
        <Probe />
        <LogoutProbe />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("Zyrine Titan")
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Sign Out"));
    });

    await waitFor(() => {
      expect(useMutationMock).toHaveBeenCalledWith({ token: "stored-token" });
      expect(storage.has("logtap_auth_token")).toBe(false);
      expect(pushMock).toHaveBeenCalledWith("/");
      expect(screen.getByTestId("token").textContent).toBe("none");
    });
  });

  it("treats an invalid stored token as logged out (query returns null)", async () => {
    storage.set("logtap_auth_token", "expired-token");
    useQueryMock.mockReturnValue(null);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("anon");
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
  });
});
