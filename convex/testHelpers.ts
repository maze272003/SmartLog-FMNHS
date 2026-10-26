/// <reference types="vite/client" />
import { expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api } from "./_generated/api";

/**
 * Shared fixtures for Convex function tests. Runs the real mutation handlers
 * in an edge-runtime VM through convex-test — no deployment required.
 */
export function makeTest() {
  const modules = import.meta.glob("./**/*.ts");
  return convexTest(schema, modules);
}

export const TEACHER_EMAIL = "teacher@fmnhs.edu.ph";
export const TEACHER_PASSWORD = "Password123!";
export const STUDENT_LRN = "105580160009";
export const STUDENT_EMAIL = "user@example.com";
export const STUDENT_PASSWORD = "Password123!";

/** Seed the development fixture data and return the test context. */
export async function seededTest() {
  const t = makeTest();
  await t.mutation(api.seed.seedInitialData, { force: true });
  return t;
}

export interface LoginResult {
  token: string;
  userId: string;
  role: "TEACHER" | "STUDENT";
}

/** Login helper that unwraps the session token. */
export async function login(
  t: ReturnType<typeof makeTest>,
  identifier: string,
  password: string
): Promise<LoginResult> {
  const res = await t.mutation(api.auth.login, { identifier, password });
  expect(res.success).toBe(true);
  return {
    token: res.token!,
    userId: res.user!.id,
    role: res.user!.role,
  };
}

/** Teacher session fixture. */
export async function teacherLogin(t: ReturnType<typeof makeTest>) {
  return login(t, TEACHER_EMAIL, TEACHER_PASSWORD);
}

/** Student session fixture (LRN path — the paper's mandatory flow). */
export async function studentLogin(t: ReturnType<typeof makeTest>) {
  return login(t, STUDENT_LRN, STUDENT_PASSWORD);
}

/** Issue the 5-minute identity verification required before borrow/return. */
export async function verifyAction(
  t: ReturnType<typeof makeTest>,
  token: string,
  actionType: "BORROW" | "RETURN",
  password: string = STUDENT_PASSWORD
) {
  const res = await t.mutation(api.auth.verifyActionCredentials, {
    token,
    password,
    actionType,
  });
  expect(res.success).toBe(true);
}

/** Create a fresh student + laptop through the real public mutations. */
export async function createStudentAndLaptop(
  t: ReturnType<typeof makeTest>,
  teacherToken: string,
  lrn: string,
  assetCode: string,
  condition: "GOOD" | "FAIR" | "DAMAGED" = "GOOD"
) {
  const student = await t.mutation(api.users.createStudent, {
    token: teacherToken,
    fullName: `Test Student ${lrn.slice(-2)}`,
    lrn,
    gradeLevel: 8,
    section: "Python",
    password: STUDENT_PASSWORD,
  });
  const laptop = await t.mutation(api.laptops.createLaptop, {
    token: teacherToken,
    assetCode,
    model: "Test Model 100",
    location: "Test Cart",
    condition,
  });
  return { studentId: student.studentId, laptopId: laptop.laptopId };
}
