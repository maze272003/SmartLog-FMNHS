/// <reference types="vite/client" />
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import {
  seededTest,
  teacherLogin,
  studentLogin,
  verifyAction,
  createStudentAndLaptop,
  STUDENT_PASSWORD,
} from "./testHelpers";

const HOUR = 3600_000;

/** Full happy-path setup: student borrows `assetCode` via the real flow. */
async function borrowOneLaptop(assetCode: string) {
  const t = await seededTest();
  const teacher = await teacherLogin(t);
  const student = await studentLogin(t);

  const laptop = await t.mutation(api.laptops.createLaptop, {
    token: teacher.token,
    assetCode,
    model: "Workflow Test Unit",
    location: "Lab Cart C",
    condition: "GOOD",
  });

  await verifyAction(t, student.token, "BORROW");
  const request = await t.mutation(api.requests.submitBorrowRequest, {
    token: student.token,
    laptopIds: [laptop.laptopId],
    purpose: "Python laboratory exercise",
  });

  await t.mutation(api.requests.approveRequest, {
    token: teacher.token,
    requestId: request.requestId,
    approvedDueAt: Date.now() + 4 * HOUR,
  });

  const release = await t.mutation(api.transactions.releaseTransaction, {
    token: teacher.token,
    requestId: request.requestId,
  });

  return { t, teacher, student, laptopId: laptop.laptopId, requestId: request.requestId, release };
}

describe("borrow requests (REQ-01, REQ-02)", () => {
  it("REQ-01: derives quantity 2 from 2 distinct laptops", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const a = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-QA", model: "M", location: "L", condition: "GOOD",
    });
    const b = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-QB", model: "M", location: "L", condition: "GOOD",
    });

    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token,
      laptopIds: [a.laptopId, b.laptopId],
      purpose: "Pair programming",
    });
    expect(req.requestedQuantity).toBe(2);

    const mine = await t.query(api.requests.listMyRequests, { token: student.token });
    const created = (mine as any[]).find((r) => r.id === req.requestId);
    expect(created.laptops).toHaveLength(2);
    expect(created.status).toBe("PENDING");
  });

  it("rejects duplicates in a single request and unavailable/damaged laptops", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const a = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-DA", model: "M", location: "L", condition: "GOOD",
    });

    await verifyAction(t, student.token, "BORROW");
    await expect(
      t.mutation(api.requests.submitBorrowRequest, {
        token: student.token,
        laptopIds: [a.laptopId, a.laptopId], // duplicate
        purpose: "Dup",
      })
    ).rejects.toThrow(/Duplicate/i);

    // LAP-005 is DAMAGED/UNAVAILABLE in seed
    const laptops = await t.query(api.laptops.listLaptops, { token: teacher.token });
    const damaged = (laptops as any[]).find((l) => l.assetCode === "LAP-005");
    await expect(
      t.mutation(api.requests.submitBorrowRequest, {
        token: student.token,
        laptopIds: [damaged.id],
        purpose: "Damaged unit",
      })
    ).rejects.toThrow(/LAPTOP_UNAVAILABLE/i);
  });

  it("REQ-02: approval records due time; laptops stay AVAILABLE until issue", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const laptop = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-APP", model: "M", location: "L", condition: "GOOD",
    });
    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token,
      laptopIds: [laptop.laptopId],
      purpose: "Approval test",
    });

    await expect(
      t.mutation(api.requests.approveRequest, {
        token: teacher.token,
        requestId: req.requestId,
        approvedDueAt: Date.now() - HOUR, // past due date rejected
      })
    ).rejects.toThrow(/future/i);

    const due = Date.now() + 8 * HOUR;
    await t.mutation(api.requests.approveRequest, {
      token: teacher.token,
      requestId: req.requestId,
      approvedDueAt: due,
    });

    const mine = await t.query(api.requests.listMyRequests, { token: student.token });
    const approved = (mine as any[]).find((r) => r.id === req.requestId);
    expect(approved.status).toBe("APPROVED");
    expect(approved.approvedDueAt).toBe(due);

    const detail = await t.query(api.laptops.getLaptop, {
      token: teacher.token,
      laptopId: laptop.laptopId,
    });
    expect((detail as any).availability).toBe("AVAILABLE");
  });

  it("students can cancel their own unfulfilled requests; not others'", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    await createStudentAndLaptop(t, teacher.token, "111111111111", "LAP-CX");
    const student = await studentLogin(t);

    const laptop = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-CAN", model: "M", location: "L", condition: "GOOD",
    });
    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token,
      laptopIds: [laptop.laptopId],
      purpose: "Cancel me",
    });

    // Another student cannot cancel it
    await expect(      t.mutation(api.requests.cancelRequest, {
        token: (await t.mutation(api.auth.login, {
          identifier: "111111111111",
          password: STUDENT_PASSWORD,
        })).token!,
        requestId: req.requestId,
      })
    ).rejects.toThrow(/UNAUTHORIZED/i);

    await t.mutation(api.requests.cancelRequest, {
      token: student.token,
      requestId: req.requestId,
    });
    const mine = await t.query(api.requests.listMyRequests, { token: student.token });
    expect((mine as any[]).find((r) => r.id === req.requestId).status).toBe("CANCELLED");
  });
});

describe("atomic release (ISSUE-01, ISSUE-02, ISSUE-04, CONV-01)", () => {
  it("ISSUE-01: creates transaction, 2 loan lines, marks laptops BORROWED, fulfills request", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const a = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-R1", model: "M", location: "L", condition: "GOOD",
    });
    const b = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-R2", model: "M", location: "L", condition: "GOOD",
    });

    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token,
      laptopIds: [a.laptopId, b.laptopId],
      purpose: "Two units",
    });
    await t.mutation(api.requests.approveRequest, {
      token: teacher.token,
      requestId: req.requestId,
      approvedDueAt: Date.now() + 4 * HOUR,
    });
    const release = await t.mutation(api.transactions.releaseTransaction, {
      token: teacher.token,
      requestId: req.requestId,
    });
    expect(release.issuedQuantity).toBe(2);

    const detail = await t.query(api.transactions.getTransactionDetails, {
      token: teacher.token,
      transactionId: release.transactionId,
      clientNow: Date.now(),
    });
    expect((detail as any).lines).toHaveLength(2);
    expect((detail as any).issuedQuantity).toBe(2);
    expect((detail as any).outstandingQuantity).toBe(2);
    expect((detail as any).displayStatus).toBe("OPEN");
    expect((detail as any).borrowerName).toBe("Zyrine Amber Titan");
    expect((detail as any).lrn).toBe("105580160009");

    for (const id of [a.laptopId, b.laptopId]) {
      const lap = await t.query(api.laptops.getLaptop, { token: teacher.token, laptopId: id });
      expect((lap as any).availability).toBe("BORROWED");
    }

    const mine = await t.query(api.requests.listMyRequests, { token: student.token });
    expect((mine as any[]).find((r) => r.id === req.requestId).status).toBe("FULFILLED");
  });

  it("ISSUE-02: aborts entirely when one laptop became unavailable — zero partial writes", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const a = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-S1", model: "M", location: "L", condition: "GOOD",
    });
    const b = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-S2", model: "M", location: "L", condition: "GOOD",
    });

    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token,
      laptopIds: [a.laptopId, b.laptopId],
      purpose: "Will conflict",
    });
    await t.mutation(api.requests.approveRequest, {
      token: teacher.token,
      requestId: req.requestId,
      approvedDueAt: Date.now() + 4 * HOUR,
    });

    // LAP-S2 gets reported lost before physical issue
    await t.mutation(api.laptops.recordLoss, {
      token: teacher.token,
      laptopId: b.laptopId,
      notes: "Cannot locate unit before release",
    });

    await expect(
      t.mutation(api.transactions.releaseTransaction, {
        token: teacher.token,
        requestId: req.requestId,
      })
    ).rejects.toThrow(/LAPTOP_UNAVAILABLE/i);

    // Zero partial writes: LAP-S1 untouched, request still APPROVED, no transactions
    const lapA = await t.query(api.laptops.getLaptop, { token: teacher.token, laptopId: a.laptopId });
    expect((lapA as any).availability).toBe("AVAILABLE");

    const txs = await t.query(api.transactions.listTeacherTransactions, { token: teacher.token });
    expect((txs as any[]).filter((x) => x.borrowerName === "Zyrine Amber Titan")).toHaveLength(0);

    const mine = await t.query(api.requests.listMyRequests, { token: student.token });
    expect((mine as any[]).find((r) => r.id === req.requestId).status).toBe("APPROVED");
  });

  it("ISSUE-04: cancels competing open requests that overlap issued laptops", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);

    await createStudentAndLaptop(t, teacher.token, "222222222221", "LAP-OV");
    await createStudentAndLaptop(t, teacher.token, "222222222222", "LAP-OTH");

    const login1 = await t.mutation(api.auth.login, { identifier: "222222222221", password: STUDENT_PASSWORD });
    const login2 = await t.mutation(api.auth.login, { identifier: "222222222222", password: STUDENT_PASSWORD });

    const laptops = await t.query(api.laptops.listLaptops, { token: teacher.token });
    const target = (laptops as any[]).find((l) => l.assetCode === "LAP-OV");

    await t.mutation(api.auth.verifyActionCredentials, {
      token: login1.token!, password: STUDENT_PASSWORD, actionType: "BORROW",
    });
    const req1 = await t.mutation(api.requests.submitBorrowRequest, {
      token: login1.token!, laptopIds: [target.id], purpose: "First",
    });
    await t.mutation(api.auth.verifyActionCredentials, {
      token: login2.token!, password: STUDENT_PASSWORD, actionType: "BORROW",
    });
    const req2 = await t.mutation(api.requests.submitBorrowRequest, {
      token: login2.token!, laptopIds: [target.id], purpose: "Competing",
    });

    await t.mutation(api.requests.approveRequest, {
      token: teacher.token, requestId: req1.requestId, approvedDueAt: Date.now() + 4 * HOUR,
    });
    await t.mutation(api.transactions.releaseTransaction, {
      token: teacher.token, requestId: req1.requestId,
    });

    const pending = await t.query(api.requests.listPendingRequests, { token: teacher.token });
    // Cancelled requests drop out of the teacher's open queue entirely…
    expect((pending as any[]).find((r) => r.id === req2.requestId)).toBeUndefined();

    // …and the competing student sees the cancellation with the availability reason
    const mine = await t.query(api.requests.listMyRequests, { token: login2.token! });
    const cancelled = (mine as any[]).find((r) => r.id === req2.requestId);
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.reviewReason).toMatch(/issued in another transaction/i);
  });

  it("requires APPROVED state; rejects releasing a PENDING request", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const laptop = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-PD", model: "M", location: "L", condition: "GOOD",
    });
    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token, laptopIds: [laptop.laptopId], purpose: "Pending",
    });

    await expect(
      t.mutation(api.transactions.releaseTransaction, {
        token: teacher.token, requestId: req.requestId,
      })
    ).rejects.toThrow(/STATE_CONFLICT/i);
  });
});

describe("returns & custody (RET-01…RET-05, CAL-01)", () => {
  it("RET-01: student return submission keeps laptops BORROWED until teacher confirms", async () => {
    const { t, teacher, student } = await borrowOneLaptop("LAP-RET1");

    await verifyAction(t, student.token, "RETURN");
    const loans = await t.query(api.transactions.listMyBorrowed, { token: student.token });
    const tx = (loans as any[]).find((x) => x.outstandingQuantity > 0);
    expect(tx).toBeDefined();

    const submission = await t.mutation(api.transactions.submitReturn, {
      token: student.token,
      loanLineIds: [tx.activeLines[0].id],
    });
    expect(submission.submittedCount).toBe(1);

    // Laptop remains BORROWED; teacher sees the pending-return flag
    const detail = await t.query(api.laptops.getLaptop, {
      token: teacher.token,
      laptopId: tx.activeLines[0].laptopId,
    });
    expect((detail as any).availability).toBe("BORROWED");

    const teacherTx = await t.query(api.transactions.listTeacherTransactions, { token: teacher.token });
    const flagged = (teacherTx as any[]).find((x) => x.id === tx.transactionId);
    expect(flagged.hasPendingReturns).toBe(true);
  });

  it("RET-02/RET-03: partial return → PARTIALLY_RETURNED; final return → CLOSED", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const a = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-P1", model: "M", location: "L", condition: "GOOD",
    });
    const b = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-P2", model: "M", location: "L", condition: "GOOD",
    });

    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token, laptopIds: [a.laptopId, b.laptopId], purpose: "Partial returns",
    });
    await t.mutation(api.requests.approveRequest, {
      token: teacher.token, requestId: req.requestId, approvedDueAt: Date.now() + 4 * HOUR,
    });
    const release = await t.mutation(api.transactions.releaseTransaction, {
      token: teacher.token, requestId: req.requestId,
    });

    const detail = () =>
      t.query(api.transactions.getTransactionDetails, {
        token: student.token,
        transactionId: release.transactionId,
        clientNow: Date.now(),
      });

    // Return just LAP-P1
    const first = (await detail()) as any;
    const lineA = first.lines.find((l: any) => l.assetCode === "LAP-P1");
    await t.mutation(api.transactions.confirmReturn, {
      token: teacher.token,
      lineReturns: [{ loanLineId: lineA.id, conditionIn: "GOOD" }],
    });

    const partial = (await detail()) as any;
    expect(partial.displayStatus).toBe("PARTIALLY_RETURNED");
    expect(partial.returnedQuantity).toBe(1);
    expect(partial.outstandingQuantity).toBe(1);

    const lapA = await t.query(api.laptops.getLaptop, { token: teacher.token, laptopId: a.laptopId });
    expect((lapA as any).availability).toBe("AVAILABLE");

    // Calendar still shows the outstanding LAP-P2 (CAL-01)
    const calendar = await t.query(api.transactions.getMyCalendar, { token: student.token });
    const calTx = (calendar as any[]).find((c) => c.transactionId === release.transactionId);
    expect(calTx).toBeDefined();
    expect(calTx.outstandingQuantity).toBe(1);
    expect(calTx.laptops.map((l: any) => l.assetCode)).toEqual(["LAP-P2"]);

    // Final receipt closes the transaction
    const second = (await detail()) as any;
    const lineB = second.lines.find((l: any) => l.assetCode === "LAP-P2");
    await t.mutation(api.transactions.confirmReturn, {
      token: teacher.token,
      lineReturns: [{ loanLineId: lineB.id, conditionIn: "GOOD" }],
    });

    const closed = (await detail()) as any;
    expect(closed.displayStatus).toBe("CLOSED");
    expect(closed.outstandingQuantity).toBe(0);

    const calendarAfter = await t.query(api.transactions.getMyCalendar, { token: student.token });
    expect((calendarAfter as any[]).find((c) => c.transactionId === release.transactionId)).toBeUndefined();
  });

  it("RET-04: damaged receipt closes the line and flags the laptop UNAVAILABLE", async () => {
    const { t, teacher, student } = await borrowOneLaptop("LAP-DMG1");

    const loans = await t.query(api.transactions.listMyBorrowed, { token: student.token });
    const tx = (loans as any[]).find((x) => x.outstandingQuantity > 0);

    await t.mutation(api.transactions.confirmReturn, {
      token: teacher.token,
      lineReturns: [{
        loanLineId: tx.activeLines[0].id,
        conditionIn: "DAMAGED",
        returnNotes: "Cracked screen discovered on inspection",
      }],
    });

    const lap = await t.query(api.laptops.getLaptop, {
      token: teacher.token,
      laptopId: tx.activeLines[0].laptopId,
    });
    expect((lap as any).availability).toBe("UNAVAILABLE");
    expect((lap as any).condition).toBe("DAMAGED");

    const detail = await t.query(api.transactions.getTransactionDetails, {
      token: student.token,
      transactionId: tx.transactionId,
      clientNow: Date.now(),
    });
    expect((detail as any).displayStatus).toBe("CLOSED");
    expect((detail as any).lines[0].conditionIn).toBe("DAMAGED");
  });

  it("RET-05: teacher can receive returns even when the student account is inactive", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const { studentId } = await createStudentAndLaptop(t, teacher.token, "333333333331", "LAP-INV");
    const studentLoginRes = await t.mutation(api.auth.login, {
      identifier: "333333333331", password: STUDENT_PASSWORD,
    });

    // Student borrows while still active
    const laptops = await t.query(api.laptops.listLaptops, { token: teacher.token });
    const target = (laptops as any[]).find((l) => l.assetCode === "LAP-INV");
    await t.mutation(api.auth.verifyActionCredentials, {
      token: studentLoginRes.token!, password: STUDENT_PASSWORD, actionType: "BORROW",
    });
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: studentLoginRes.token!, laptopIds: [target.id], purpose: "Before deactivation",
    });
    await t.mutation(api.requests.approveRequest, {
      token: teacher.token, requestId: req.requestId, approvedDueAt: Date.now() + 4 * HOUR,
    });
    const release = await t.mutation(api.transactions.releaseTransaction, {
      token: teacher.token, requestId: req.requestId,
    });

    // Deactivate the student (their session dies)
    await t.mutation(api.users.updateStudent, {
      token: teacher.token,
      studentId: studentId as any,
      fullName: "Test Student 31",
      gradeLevel: 8,
      section: "Python",
      status: "INACTIVE",
    });

    // Teacher still receives the physical laptop as an exception receipt
    const detail = await t.query(api.transactions.getTransactionDetails, {
      token: teacher.token,
      transactionId: release.transactionId,
      clientNow: Date.now(),
    });
    const line = (detail as any).lines[0];
    const res = await t.mutation(api.transactions.confirmReturn, {
      token: teacher.token,
      lineReturns: [{ loanLineId: line.id, conditionIn: "GOOD", returnNotes: "Received from deactivated student" }],
    });
    expect(res.returnedCount).toBe(1);

    const lap = await t.query(api.laptops.getLaptop, { token: teacher.token, laptopId: target.id });
    expect((lap as any).availability).toBe("AVAILABLE");
  });

  it("blocks a student from returning another student's loan lines", async () => {
    const { t, student } = await borrowOneLaptop("LAP-OWN");

    // Different student tries to submit a return for the active line
    const otherLogin = await t.mutation(api.auth.login, {
      identifier: "109283746502", password: STUDENT_PASSWORD,
    });
    const loans = await t.query(api.transactions.listMyBorrowed, { token: student.token });
    const tx = (loans as any[]).find((x) => x.outstandingQuantity > 0);

    await t.mutation(api.auth.verifyActionCredentials, {
      token: otherLogin.token!, password: STUDENT_PASSWORD, actionType: "RETURN",
    });
    await expect(
      t.mutation(api.transactions.submitReturn, {
        token: otherLogin.token!,
        loanLineIds: [tx.activeLines[0].id],
      })
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("blocks return submission without recent identity verification", async () => {
    const { t, student } = await borrowOneLaptop("LAP-NV");

    const loans = await t.query(api.transactions.listMyBorrowed, { token: student.token });
    const tx = (loans as any[]).find((x) => x.outstandingQuantity > 0);

    await expect(
      t.mutation(api.transactions.submitReturn, {
        token: student.token,
        loanLineIds: [tx.activeLines[0].id],
      })
    ).rejects.toThrow(/IDENTITY_CONFIRMATION_REQUIRED/i);
  });

  it("TIME-01: overdue derives dynamically from clientNow on transaction details", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const laptop = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-OD", model: "M", location: "L", condition: "GOOD",
    });
    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token, laptopIds: [laptop.laptopId], purpose: "Overdue check",
    });
    // Due in 1 hour
    await t.mutation(api.requests.approveRequest, {
      token: teacher.token, requestId: req.requestId, approvedDueAt: Date.now() + HOUR,
    });
    const release = await t.mutation(api.transactions.releaseTransaction, {
      token: teacher.token, requestId: req.requestId,
    });

    const before = await t.query(api.transactions.getTransactionDetails, {
      token: student.token, transactionId: release.transactionId, clientNow: Date.now(),
    });
    expect((before as any).isOverdue).toBe(false);

    const after = await t.query(api.transactions.getTransactionDetails, {
      token: student.token,
      transactionId: release.transactionId,
      clientNow: Date.now() + 2 * HOUR, // simulate server time past due
    });
    expect((after as any).isOverdue).toBe(true);

    const stats = await t.query(api.dashboard.getStudentStats, {
      token: student.token, clientNow: Date.now() + 2 * HOUR,
    });
    expect((stats as any).hasOverdue).toBe(true);
  });
});

describe("dashboards & exports (CONV-01, LOG-01, PRIV-01)", () => {
  it("aggregates teacher dashboard stats in real time after a release", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);

    const before = (await t.query(api.dashboard.getTeacherStats, {
      token: teacher.token, clientNow: Date.now(),
    })) as any;
    expect(before.totalLaptops).toBe(5);
    expect(before.availableLaptops).toBe(4); // LAP-005 is DAMAGED/UNAVAILABLE

    const { student } = await (async () => {
      const s = await studentLogin(t);
      return { student: s };
    })();
    const laptop = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token, assetCode: "LAP-DSH", model: "M", location: "L", condition: "GOOD",
    });
    await verifyAction(t, student.token, "BORROW");
    const req = await t.mutation(api.requests.submitBorrowRequest, {
      token: student.token, laptopIds: [laptop.laptopId], purpose: "Dashboard",
    });
    await t.mutation(api.requests.approveRequest, {
      token: teacher.token, requestId: req.requestId, approvedDueAt: Date.now() + 4 * HOUR,
    });
    await t.mutation(api.transactions.releaseTransaction, {
      token: teacher.token, requestId: req.requestId,
    });

    const after = (await t.query(api.dashboard.getTeacherStats, {
      token: teacher.token, clientNow: Date.now(),
    })) as any;
    expect(after.totalLaptops).toBe(6);
    expect(after.availableLaptops).toBe(4);
    expect(after.borrowedLaptops).toBe(1);
    expect(after.activeLoansCount).toBe(1);
  });

  it("LOG-01: operational logbook export contains identifiable custody records", async () => {
    const { t, teacher } = await borrowOneLaptop("LAP-LOG");

    const rows = (await t.query(api.logbook.exportOperationalLogbook, {
      token: teacher.token,
    })) as any[];
    expect(rows.length).toBeGreaterThan(0);
    const row = rows.find((r) => r.assetCode === "LAP-LOG");
    expect(row).toBeDefined();
    expect(row.borrowerName).toBe("Zyrine Amber Titan");
    expect(row.lrn).toBe("105580160009");
    expect(row.status).toBe("ACTIVE");
    expect(row.issuedAt).toBeTruthy();
    expect(row.dueAt).toBeTruthy();
  });

  it("PRIV-01: research metrics export is de-identified (no names, LRNs, or emails)", async () => {
    const { t, teacher } = await borrowOneLaptop("LAP-PRV");

    const rows = (await t.query(api.logbook.exportResearchMetrics, {
      token: teacher.token,
    })) as any[];

    expect(rows.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(rows).toLowerCase();
    expect(serialized).not.toContain("zyrine");
    expect(serialized).not.toContain("105580160009");
    expect(serialized).not.toContain("@");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("titan");

    const row = rows.find((r) => r.observationCode);
    expect(row.observationCode).toMatch(/^OBS-\d{4}$/);
  });

  it("students cannot export either logbook", async () => {
    const { t, student } = await borrowOneLaptop("LAP-EXP");
    await expect(
      t.query(api.logbook.exportOperationalLogbook, { token: student.token })
    ).rejects.toThrow(/UNAUTHORIZED/i);
    await expect(
      t.query(api.logbook.exportResearchMetrics, { token: student.token })
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("students cannot read another student's transaction details", async () => {
    const { t, student } = await borrowOneLaptop("LAP-TXN");

    // Second student borrows a different laptop
    const otherLogin = await t.mutation(api.auth.login, {
      identifier: "109283746502", password: STUDENT_PASSWORD,
    });
    const loans = await t.query(api.transactions.listMyBorrowed, { token: student.token });
    const tx = (loans as any[]).find((x) => x.outstandingQuantity > 0);

    await expect(
      t.query(api.transactions.getTransactionDetails, {
        token: otherLogin.token!,
        transactionId: tx.transactionId,
        clientNow: Date.now(),
      })
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });
});

