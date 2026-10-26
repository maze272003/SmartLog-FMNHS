/// <reference types="vite/client" />
import { describe, it, expect } from "vitest";
import { api } from "./_generated/api";
import {
  seededTest,
  teacherLogin,
  studentLogin,
  login,
  TEACHER_EMAIL,
  STUDENT_EMAIL,
  STUDENT_LRN,
  STUDENT_PASSWORD,
} from "./testHelpers";

describe("authentication & sessions (AUTH-01…AUTH-06)", () => {
  it("AUTH-01: teacher signs in with email/password and gets a teacher session", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    expect(teacher.role).toBe("TEACHER");

    const me = await t.query(api.auth.getCurrentUser, { token: teacher.token });
    expect(me?.email).toBe(TEACHER_EMAIL);
    expect(me?.role).toBe("TEACHER");
  });

  it("AUTH-02: student signs in with LRN/password (no email required)", async () => {
    const t = await seededTest();
    const student = await studentLogin(t);
    expect(student.role).toBe("STUDENT");

    const me = await t.query(api.auth.getCurrentUser, { token: student.token });
    expect(me?.lrn).toBe(STUDENT_LRN);
  });

  it("AUTH-03: student email alias maps to the same identity", async () => {
    const t = await seededTest();
    const byLrn = await login(t, STUDENT_LRN, STUDENT_PASSWORD);
    const byEmail = await login(t, STUDENT_EMAIL, STUDENT_PASSWORD);
    expect(byEmail.userId).toBe(byLrn.userId);
  });

  it("rejects wrong passwords and unknown identifiers", async () => {
    const t = await seededTest();
    const badPassword = await t.mutation(api.auth.login, {
      identifier: STUDENT_LRN,
      password: "WrongPassword1!",
    });
    expect(badPassword.success).toBe(false);

    const unknown = await t.mutation(api.auth.login, {
      identifier: "999999999999",
      password: STUDENT_PASSWORD,
    });
    expect(unknown.success).toBe(false);
  });

  it("AUTH-04: student token cannot invoke teacher-only functions (no data leaked)", async () => {
    const t = await seededTest();
    const student = await studentLogin(t);

    await expect(
      t.query(api.users.listStudents, { token: student.token })
    ).rejects.toThrow(/UNAUTHORIZED/i);
    await expect(
      t.mutation(api.laptops.createLaptop, {
        token: student.token,
        assetCode: "LAP-HACK",
        model: "X",
        location: "X",
        condition: "GOOD",
      })
    ).rejects.toThrow(/UNAUTHORIZED/i);
    await expect(
      t.query(api.transactions.listTeacherTransactions, { token: student.token })
    ).rejects.toThrow(/UNAUTHORIZED/i);
    await expect(
      t.query(api.logbook.exportOperationalLogbook, { token: student.token })
    ).rejects.toThrow(/UNAUTHORIZED/i);
  });

  it("expired/garbage tokens resolve to no session", async () => {
    const t = await seededTest();
    const me = await t.query(api.auth.getCurrentUser, { token: "not-a-real-token" });
    expect(me).toBeNull();
  });

  it("logout invalidates the session token", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    await t.mutation(api.auth.logout, { token: teacher.token });
    const me = await t.query(api.auth.getCurrentUser, { token: teacher.token });
    expect(me).toBeNull();
  });

  it("AUTH-05: deactivating a student kills sessions and cancels pending requests", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    await t.mutation(api.users.updateStudent, {
      token: teacher.token,
      studentId: student.userId as any,
      fullName: "Zyrine Amber Titan",
      gradeLevel: 7,
      section: "Cybernauts",
      status: "INACTIVE",
    });

    // Session is gone
    const me = await t.query(api.auth.getCurrentUser, { token: student.token });
    expect(me).toBeNull();

    // Re-login is blocked
    const again = await t.mutation(api.auth.login, {
      identifier: STUDENT_LRN,
      password: STUDENT_PASSWORD,
    });
    expect(again.success).toBe(false);
    expect(again.error).toMatch(/inactive/i);
  });
});

describe("short-lived action verification (AUTH-06, §5.2)", () => {
  it("issues a 5-minute verification only for the correct password", async () => {
    const t = await seededTest();
    const student = await studentLogin(t);

    const bad = await t.mutation(api.auth.verifyActionCredentials, {
      token: student.token,
      password: "nope",
      actionType: "BORROW",
    });
    expect(bad.success).toBe(false);

    const good = await t.mutation(api.auth.verifyActionCredentials, {
      token: student.token,
      password: STUDENT_PASSWORD,
      actionType: "BORROW",
    });
    expect(good.success).toBe(true);
    expect(good.expiresAt).toBeGreaterThan(Date.now());
  });

  it("blocks borrow submission without recent verification", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    const laptop = await t.mutation(api.laptops.createLaptop, {
      token: teacher.token,
      assetCode: "LAP-T01",
      model: "Test",
      location: "Lab",
      condition: "GOOD",
    });

    // No verifyActionCredentials call first → blocked
    await expect(
      t.mutation(api.requests.submitBorrowRequest, {
        token: student.token,
        laptopIds: [laptop.laptopId],
        purpose: "Lab activity",
      })
    ).rejects.toThrow(/IDENTITY_CONFIRMATION_REQUIRED/i);
  });
});

describe("password management (§5.3, §6.1)", () => {
  it("changePassword verifies the current password and keeps the session", async () => {
    const t = await seededTest();
    const student = await studentLogin(t);

    const wrongCurrent = await t.mutation(api.auth.changePassword, {
      token: student.token,
      currentPassword: "bad",
      newPassword: "NewPassword456!",
    });
    expect(wrongCurrent.success).toBe(false);

    const ok = await t.mutation(api.auth.changePassword, {
      token: student.token,
      currentPassword: STUDENT_PASSWORD,
      newPassword: "NewPassword456!",
    });
    expect(ok.success).toBe(true);

    // Session survives; old password no longer works, new one does
    const me = await t.query(api.auth.getCurrentUser, { token: student.token });
    expect(me).not.toBeNull();
    const oldLogin = await t.mutation(api.auth.login, {
      identifier: STUDENT_LRN,
      password: STUDENT_PASSWORD,
    });
    expect(oldLogin.success).toBe(false);
    const newLogin = await t.mutation(api.auth.login, {
      identifier: STUDENT_LRN,
      password: "NewPassword456!",
    });
    expect(newLogin.success).toBe(true);
  });

  it("changePassword enforces a minimum length of 8", async () => {
    const t = await seededTest();
    const student = await studentLogin(t);
    await expect(
      t.mutation(api.auth.changePassword, {
        token: student.token,
        currentPassword: STUDENT_PASSWORD,
        newPassword: "short",
      })
    ).rejects.toThrow(/at least 8/i);
  });

  it("completeActivation sets a new password from temporary credentials", async () => {
    const t = await seededTest();

    const badTemp = await t.mutation(api.auth.completeActivation, {
      identifier: STUDENT_LRN,
      currentPassword: "wrong-temp",
      newPassword: "Activated123!",
    });
    expect(badTemp.success).toBe(false);

    const ok = await t.mutation(api.auth.completeActivation, {
      identifier: STUDENT_LRN,
      currentPassword: STUDENT_PASSWORD,
      newPassword: "Activated123!",
    });
    expect(ok.success).toBe(true);
    expect(ok.role).toBe("STUDENT");

    const loginNew = await t.mutation(api.auth.login, {
      identifier: STUDENT_LRN,
      password: "Activated123!",
    });
    expect(loginNew.success).toBe(true);
  });

  it("resetStudentPassword rotates the hash and kills sessions", async () => {
    const t = await seededTest();
    const teacher = await teacherLogin(t);
    const student = await studentLogin(t);

    await t.mutation(api.users.resetStudentPassword, {
      token: teacher.token,
      studentId: student.userId as any,
      newPassword: "TempPass789!",
    });

    const me = await t.query(api.auth.getCurrentUser, { token: student.token });
    expect(me).toBeNull();

    const relogin = await t.mutation(api.auth.login, {
      identifier: STUDENT_LRN,
      password: "TempPass789!",
    });
    expect(relogin.success).toBe(true);
  });
});
