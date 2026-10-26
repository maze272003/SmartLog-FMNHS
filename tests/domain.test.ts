import { describe, it, expect } from "vitest";
import {
  deriveLoanCounts,
  isOverdue,
  isDueSoon,
  manilaDayRange,
  isDueTodayManila,
  manilaDateString,
  isLaptopIssuable,
  availabilityAfterReturn,
  isEligibleGradeLevel,
  isValidLrn,
  weightedMean,
  verbalInterpretation,
  percentage,
  roundHalfUp2,
  csvEscapeCell,
  toCsv,
} from "../convex/domain";

// ---------------------------------------------------------------------------
// deriveLoanCounts — the §8.3 quantity contract
// ---------------------------------------------------------------------------

describe("deriveLoanCounts (asd.md §8.3 quantity contract)", () => {
  const line = (status: "ACTIVE" | "RETURNED") => ({ status });

  it("opens a fresh 2-laptop transaction as OPEN with 2 outstanding", () => {
    const c = deriveLoanCounts([line("ACTIVE"), line("ACTIVE")]);
    expect(c).toEqual({
      borrowedQuantity: 2,
      returnedQuantity: 0,
      outstandingQuantity: 2,
      displayStatus: "OPEN",
    });
  });

  it("derives PARTIALLY_RETURNED after 1 of 2 laptops is received (RET-02)", () => {
    const c = deriveLoanCounts([line("RETURNED"), line("ACTIVE")]);
    expect(c.borrowedQuantity).toBe(2);
    expect(c.returnedQuantity).toBe(1);
    expect(c.outstandingQuantity).toBe(1);
    expect(c.displayStatus).toBe("PARTIALLY_RETURNED");
  });

  it("derives CLOSED when all laptops are returned (RET-03)", () => {
    const c = deriveLoanCounts([line("RETURNED"), line("RETURNED")]);
    expect(c.returnedQuantity).toBe(2);
    expect(c.outstandingQuantity).toBe(0);
    expect(c.displayStatus).toBe("CLOSED");
  });

  it("treats an empty line list as OPEN with zero quantities", () => {
    const c = deriveLoanCounts([]);
    expect(c).toEqual({
      borrowedQuantity: 0,
      returnedQuantity: 0,
      outstandingQuantity: 0,
      displayStatus: "OPEN",
    });
  });
});

// ---------------------------------------------------------------------------
// Overdue / due-soon / Manila calendar
// ---------------------------------------------------------------------------

describe("overdue derivation (TIME-01)", () => {
  it("flags lines past due and not future ones", () => {
    const now = 1_000_000_000;
    expect(isOverdue(now - 1, now)).toBe(true);
    expect(isOverdue(now, now)).toBe(false);
    expect(isOverdue(now + 1, now)).toBe(false);
  });

  it("flags due-soon within the 48h window but excludes overdue", () => {
    const now = 1_000_000_000;
    expect(isDueSoon(now + 47 * 3600_000, now)).toBe(true);
    expect(isDueSoon(now + 49 * 3600_000, now)).toBe(false);
    expect(isDueSoon(now - 1000, now)).toBe(false); // overdue, not "soon"
  });
});

describe("Asia/Manila calendar day (§10)", () => {
  it("computes Manila day bounds independent of host timezone", () => {
    // 2026-10-26 00:30 Manila == 2026-10-25 16:30 UTC
    const utc = Date.UTC(2026, 9, 25, 16, 30, 0);
    const { startOfDay, endOfDay } = manilaDayRange(utc);
    expect(startOfDay).toBe(Date.UTC(2026, 9, 25, 16, 0, 0)); // Manila midnight
    expect(endOfDay).toBe(Date.UTC(2026, 9, 26, 15, 59, 59, 999)); // 23:59:59.999 Manila
  });

  it("rolls to the next Manila date after midnight Manila time", () => {
    // 2026-10-26 00:01 Manila == 2026-10-25 16:01 UTC
    const utc = Date.UTC(2026, 9, 25, 16, 1, 0);
    expect(isDueTodayManila(Date.UTC(2026, 9, 25, 16, 0, 0), utc)).toBe(true);
    // 23:59 Manila previous day is not "today" anymore
    expect(isDueTodayManila(Date.UTC(2026, 9, 25, 15, 59, 0), utc)).toBe(false);
  });

  it("formats Manila calendar dates for calendar grouping (CAL-01)", () => {
    // 2026-10-25 23:00 UTC == 2026-10-26 07:00 Manila → Oct 26 in Manila
    expect(manilaDateString(Date.UTC(2026, 9, 25, 23, 0, 0))).toBe("2026-10-26");
    expect(manilaDateString(Date.UTC(2026, 9, 26, 0, 0, 0))).toBe("2026-10-26");
    // 2026-10-25 14:00 UTC == 2026-10-25 22:00 Manila → Oct 25
    expect(manilaDateString(Date.UTC(2026, 9, 25, 14, 0, 0))).toBe("2026-10-25");
  });
});

// ---------------------------------------------------------------------------
// Laptop availability rules
// ---------------------------------------------------------------------------

describe("laptop issuance rules (§7)", () => {
  it("issues only AVAILABLE laptops in GOOD/FAIR condition", () => {
    expect(isLaptopIssuable({ availability: "AVAILABLE", condition: "GOOD" })).toBe(true);
    expect(isLaptopIssuable({ availability: "AVAILABLE", condition: "FAIR" })).toBe(true);
    expect(isLaptopIssuable({ availability: "AVAILABLE", condition: "DAMAGED" })).toBe(false);
    expect(isLaptopIssuable({ availability: "BORROWED", condition: "GOOD" })).toBe(false);
    expect(isLaptopIssuable({ availability: "UNAVAILABLE", condition: "GOOD" })).toBe(false);
    expect(isLaptopIssuable({ availability: "LOST", condition: "GOOD" })).toBe(false);
    expect(isLaptopIssuable({ availability: "RETIRED", condition: "GOOD" })).toBe(false);
  });

  it("returns damaged laptops to UNAVAILABLE and others to AVAILABLE (RET-04)", () => {
    expect(availabilityAfterReturn("DAMAGED")).toBe("UNAVAILABLE");
    expect(availabilityAfterReturn("GOOD")).toBe("AVAILABLE");
    expect(availabilityAfterReturn("FAIR")).toBe("AVAILABLE");
  });
});

// ---------------------------------------------------------------------------
// Student eligibility (SCOPE-01)
// ---------------------------------------------------------------------------

describe("SPICT eligibility (SCOPE-01)", () => {
  it("accepts only Grades 7–10", () => {
    for (const g of [7, 8, 9, 10]) expect(isEligibleGradeLevel(g)).toBe(true);
    for (const g of [6, 11, 12, 0, -7]) expect(isEligibleGradeLevel(g)).toBe(false);
  });

  it("validates LRNs as digit strings preserving leading zeros (DOC-04)", () => {
    expect(isValidLrn("105580160009")).toBe(true);
    expect(isValidLrn("000123")).toBe(true); // leading zeros preserved
    expect(isValidLrn(" 12345 ")).toBe(true); // trimmed
    expect(isValidLrn("")).toBe(false);
    expect(isValidLrn("12A45")).toBe(false);
    expect(isValidLrn("1234-567")).toBe(false);
    expect(isValidLrn("12.5")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Research evaluation math (§14.2, EVAL-01)
// ---------------------------------------------------------------------------

describe("Chapter II weighted mean formulas (EVAL-01)", () => {
  it("yields 3.00 / Acceptable for responses 4,4,3,1", () => {
    const mean = weightedMean({ f1: 1, f2: 0, f3: 1, f4: 2 })!;
    expect(roundHalfUp2(mean)).toBe(3.0);
    expect(verbalInterpretation(roundHalfUp2(mean))).toBe("Acceptable");
  });

  it("computes means across the full scale", () => {
    expect(weightedMean({ f1: 0, f2: 0, f3: 0, f4: 4 })).toBeCloseTo(4.0);
    expect(weightedMean({ f1: 4, f2: 0, f3: 0, f4: 0 })).toBeCloseTo(1.0);
    expect(weightedMean({ f1: 1, f2: 1, f3: 1, f4: 1 })).toBeCloseTo(2.5);
    expect(weightedMean({ f1: 0, f2: 0, f3: 0, f4: 0 })).toBeNull();
  });

  it("maps the paper's exact interpretation bands", () => {
    expect(verbalInterpretation(4.0)).toBe("Highly Acceptable");
    expect(verbalInterpretation(3.26)).toBe("Highly Acceptable");
    expect(verbalInterpretation(3.25)).toBe("Acceptable");
    expect(verbalInterpretation(2.51)).toBe("Acceptable");
    expect(verbalInterpretation(2.5)).toBe("Unacceptable");
    expect(verbalInterpretation(1.76)).toBe("Unacceptable");
    expect(verbalInterpretation(1.75)).toBe("Highly Unacceptable");
    expect(verbalInterpretation(1.0)).toBe("Highly Unacceptable");
  });

  it("rounds half-up to two decimals", () => {
    expect(roundHalfUp2(3.005)).toBe(3.01);
    expect(roundHalfUp2(2.675)).toBe(2.68);
    expect(roundHalfUp2(1.234)).toBe(1.23);
    expect(roundHalfUp2(1.235)).toBe(1.24);
  });

  it("computes percentages of valid responses", () => {
    expect(percentage(3, 4)).toBe(75);
    expect(percentage(0, 4)).toBe(0);
    expect(percentage(1, 3)).toBe(33.33);
    expect(percentage(2, 0)).toBe(0); // no divide-by-zero
  });
});

// ---------------------------------------------------------------------------
// CSV serialization (LOG-01 / PRIV-01 exports)
// ---------------------------------------------------------------------------

describe("CSV export serialization", () => {
  it("escapes quotes, commas, and newlines (RFC 4180)", () => {
    expect(csvEscapeCell('Dela Cruz, "JR"')).toBe('"Dela Cruz, ""JR"""');
    expect(csvEscapeCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscapeCell("plain")).toBe("plain");
    expect(csvEscapeCell(42)).toBe("42");
    expect(csvEscapeCell(null)).toBe("");
    expect(csvEscapeCell(undefined)).toBe("");
  });

  it("serializes headers and rows with CRLF line endings", () => {
    const csv = toCsv(["name", "lrn"], [["Dela, Cruz", "001"], ["Ann", "002"]]);
    expect(csv.split("\r\n")).toHaveLength(3);
    expect(csv.split("\r\n")[1]).toBe('"Dela, Cruz",001');
  });
});
