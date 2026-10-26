import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ActionConfirmModal from "@/components/ActionConfirmModal";

// Mock the Convex react hooks the component uses.
const useMutationMock = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: () => useMutationMock,
}));

vi.mock("@/components/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    token: "session-token",
    user: { id: "u1", fullName: "Zyrine Titan", lrn: "105580160009", role: "STUDENT" },
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("ActionConfirmModal (AUTH-06 identity confirmation UI)", () => {
  const onSuccess = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ActionConfirmModal
        isOpen={false}
        actionType="BORROW"
        actionDescription="Requesting 2 laptops"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows borrower identity and calls onSuccess after verification passes", async () => {
    useMutationMock.mockResolvedValue({ success: true, expiresAt: Date.now() + 300_000 });

    render(
      <ActionConfirmModal
        isOpen
        actionType="BORROW"
        actionDescription="Requesting 2 laptop(s): LAP-001, LAP-002"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText("Identity Confirmation")).toBeInTheDocument();
    expect(screen.getByText(/Zyrine Titan/)).toBeInTheDocument();
    expect(screen.getByText(/105580160009/)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Enter your account password"), {
      target: { value: "Password123!" },
    });
    // jsdom does not trigger form submission from submit-button clicks
    fireEvent.submit(
      screen.getByPlaceholderText("Enter your account password").closest("form")!
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(useMutationMock).toHaveBeenCalledWith({
      token: "session-token",
      password: "Password123!",
      actionType: "BORROW",
    });
  });

  it("surfaces the server error when verification fails", async () => {
    useMutationMock.mockResolvedValue({ success: false, error: "Invalid password confirmation" });

    render(
      <ActionConfirmModal
        isOpen
        actionType="RETURN"
        actionDescription="Returning LAP-001"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Enter your account password"), {
      target: { value: "wrong" },
    });
    fireEvent.submit(
      screen.getByPlaceholderText("Enter your account password").closest("form")!
    );

    await waitFor(() =>
      expect(screen.getByText("Invalid password confirmation")).toBeInTheDocument()
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("calls onCancel when the user dismisses the dialog", () => {
    render(
      <ActionConfirmModal
        isOpen
        actionType="RETURN"
        actionDescription="Returning LAP-001"
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
