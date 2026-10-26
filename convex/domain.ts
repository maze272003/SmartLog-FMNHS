/**
 * LogTap shared domain logic — pure functions only.
 *
 * This module is imported by Convex server functions (`convex/*.ts`), the
 * Next.js frontend, the research evaluation script, and the unit test suite.
 * It must stay free of Convex imports, Node built-ins, and DOM access so it
 * can run in every runtime (browser, Convex edge runtime, Node, Vitest).
 */

// ---------------------------------------------------------------------------
// Loan / transaction state (asd.md §8.3, §9.1)
// ---------------------------------------------------------------------------

export type LoanLineStatus = "ACTIVE" | "RETURNED";
export type TransactionDisplayStatus = "OPEN" | "PARTIALLY_RETURNED" | "CLOSED";

export interface LoanLineLike {
  status: LoanLineStatus;
}

export interface LoanCounts {
  borrowedQuantity: number;
  returnedQuantity: number;
  outstandingQuantity: number;
  displayStatus: TransactionDisplayStatus;
}

/**
 * Derives explicit borrowed/returned/outstanding counts and the display state
 * of a borrow transaction from its individual loan lines.
 *
 * Example (asd.md §8.3): borrow LAP-001 + LAP-002, return LAP-001 only →
 * { borrowedQuantity: 2, returnedQuantity: 1, outstandingQuantity: 1,
 *   displayStatus: "PARTIALLY_RETURNED" }.
 */
export function deriveLoanCounts<T extends LoanLineLike>(lines: T[]): LoanCounts {
  const returnedQuantity = lines.filter((l) => l.status === "RETURNED").length;
  const outstandingQuantity = lines.length - returnedQuantity;

  let displayStatus: TransactionDisplayStatus = "OPEN";
  if (outstandingQuantity === 0 && lines.length > 0) {
    displayStatus = "CLOSED";
  } else if (returnedQuantity > 0) {
    displayStatus = "PARTIALLY_RETURNED";
  }

  return {
    borrowedQuantity: lines.length,
    returnedQuantity,
    outstandingQuantity,
    displayStatus,
  };
}

/** Overdue is derived dynamically from server time vs. dueAt (asd.md §9.1). */
export function isOverdue(dueAt: number, now: number): boolean {
  return dueAt < now;
}

/** Due-soon window used by dashboards: non-overdue lines due within 48h. */
export const DUE_SOON_WINDOW_MS = 48 * 60 * 60 * 1000;

export function isDueSoon(dueAt: number, now: number): boolean {
  return !isOverdue(dueAt, now) && dueAt - now <= DUE_SOON_WINDOW_MS;
}

// ---------------------------------------------------------------------------
// Asia/Manila calendar helpers (asd.md §3.2, §10)
// ---------------------------------------------------------------------------

/** The Philippines operates on a single zone, Asia/Manila (UTC+8, no DST). */
export const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ManilaDayRange {
  startOfDay: number;
  endOfDay: number;
}

/**
 * Returns the UTC millisecond bounds of the Asia/Manila calendar date that
 * contains `now`, regardless of the host machine's local timezone.
 */
export function manilaDayRange(now: number): ManilaDayRange {
  // Shift into "Manila wall clock", floor to a day, shift back to UTC.
  const manilaNow = now + MANILA_OFFSET_MS;
  const manilaStart = Math.floor(manilaNow / DAY_MS) * DAY_MS;
  const startOfDay = manilaStart - MANILA_OFFSET_MS;
  return { startOfDay, endOfDay: startOfDay + DAY_MS - 1 };
}

/** True when `dueAt` falls inside the current Asia/Manila calendar date. */
export function isDueTodayManila(dueAt: number, now: number): boolean {
  const { startOfDay, endOfDay } = manilaDayRange(now);
  return dueAt >= startOfDay && dueAt <= endOfDay;
}

/** Formats a UTC timestamp as YYYY-MM-DD in Asia/Manila (for calendar grouping). */
export function manilaDateString(ts: number): string {
  const d = new Date(ts + MANILA_OFFSET_MS);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// Laptop availability rules (asd.md §7)
// ---------------------------------------------------------------------------

export type LaptopCondition = "GOOD" | "FAIR" | "DAMAGED";
export type LaptopAvailability =
  | "AVAILABLE"
  | "BORROWED"
  | "UNAVAILABLE"
  | "LOST"
  | "RETIRED";

export interface LaptopLike {
  condition: LaptopCondition;
  availability: LaptopAvailability;
}

/**
 * Only AVAILABLE laptops in GOOD/FAIR condition can be requested and issued.
 */
export function isLaptopIssuable(laptop: LaptopLike): boolean {
  return laptop.availability === "AVAILABLE" && laptop.condition !== "DAMAGED";
}

/** Availability a laptop gets after a teacher-confirmed return receipt. */
export function availabilityAfterReturn(
  conditionIn: LaptopCondition
): LaptopAvailability {
  return conditionIn === "DAMAGED" ? "UNAVAILABLE" : "AVAILABLE";
}

// ---------------------------------------------------------------------------
// Student eligibility (asd.md §3.1, SCOPE-01)
// ---------------------------------------------------------------------------

export const ELIGIBLE_GRADE_LEVELS = [7, 8, 9, 10] as const;
export type EligibleGradeLevel = (typeof ELIGIBLE_GRADE_LEVELS)[number];

export function isEligibleGradeLevel(grade: number): grade is EligibleGradeLevel {
  return (ELIGIBLE_GRADE_LEVELS as readonly number[]).includes(grade);
}

/**
 * LRNs are stored as text to preserve leading zeros. They must be non-empty
 * digit strings; exact length is a school rule and intentionally not enforced.
 */
export function isValidLrn(lrn: string): boolean {
  return /^\d+$/.test(lrn.trim());
}

// ---------------------------------------------------------------------------
// Research evaluation math (asd.md §14.2, Chapter II methodology)
// ---------------------------------------------------------------------------

export const LIKERT_SCALE = [1, 2, 3, 4] as const;

export interface LikertCounts {
  f1: number; // Strongly Disagree
  f2: number; // Disagree
  f3: number; // Agree
  f4: number; // Strongly Agree
}

/** Percentage: P_i = f_i / N_valid × 100 (rounded half-up to 2 decimals). */
export function percentage(frequency: number, totalValid: number): number {
  if (totalValid <= 0) return 0;
  return roundHalfUp2((frequency / totalValid) * 100);
}

/** Weighted Mean: x̄ = (4f₄ + 3f₃ + 2f₂ + 1f₁) / (f₄ + f₃ + f₂ + f₁). */
export function weightedMean(counts: LikertCounts): number | null {
  const n = counts.f1 + counts.f2 + counts.f3 + counts.f4;
  if (n === 0) return null;
  return (4 * counts.f4 + 3 * counts.f3 + 2 * counts.f2 + 1 * counts.f1) / n;
}

/**
 * Verbal interpretation bands exactly as printed in the paper:
 * 3.26–4.00 Highly Acceptable, 2.51–3.25 Acceptable,
 * 1.76–2.50 Unacceptable, 1.00–1.75 Highly Unacceptable.
 */
export function verbalInterpretation(mean: number): string {
  if (mean >= 3.26) return "Highly Acceptable";
  if (mean >= 2.51) return "Acceptable";
  if (mean >= 1.76) return "Unacceptable";
  return "Highly Unacceptable";
}

/** Round half-up to 2 decimal places for display and range lookup. */
export function roundHalfUp2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// ---------------------------------------------------------------------------
// CSV serialization (logbook / research exports, asd.md §12.5)
// ---------------------------------------------------------------------------

/** Escapes a single CSV cell (RFC 4180): quotes, commas, newlines. */
export function csvEscapeCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serializes a header row + data rows into CSV text. */
export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): string {
  const lines = [headers.map(csvEscapeCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvEscapeCell).join(","));
  }
  return lines.join("\r\n");
}
