import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { aggregateCounts } from "../scripts/evaluate";
import {
  weightedMean,
  verbalInterpretation,
  roundHalfUp2,
} from "../convex/domain";

const evaluationDir = path.join(process.cwd(), "evaluation");

function parseCsv(content: string): string[][] {
  return content
    .trim()
    .split("\n")
    .map((line) => line.trim().split(",").map((cell) => cell.replace(/^"(.*)"$/, "$1")));
}

describe("research evaluation templates (§14.1)", () => {
  const items = parseCsv(fs.readFileSync(path.join(evaluationDir, "instrument_items.csv"), "utf-8"));
  const itemRows = items.slice(1);
  const responses = parseCsv(
    fs.readFileSync(path.join(evaluationDir, "survey_responses.csv"), "utf-8")
  );
  const responseRows = responses.slice(1);

  it("instrument covers the four question groups from Chapter II", () => {
    const groups = new Set(itemRows.map((r) => r[1]));
    expect(groups).toContain("System Effectiveness");
    expect(groups).toContain("School Benefits");
    expect(groups).toContain("Respondent Satisfaction");
    expect(groups).toContain("Acceptability");
  });

  it("every template item declares a statement and 4-point direction", () => {
    for (const row of itemRows) {
      // Statements may contain commas: code, group, dimension, …statement…, direction
      const [code, , , ...rest] = row;
      const direction = rest[rest.length - 1];
      const statement = rest.slice(0, -1).join(",");
      expect(code).toMatch(/^[A-Z]{3}-\d{2}$/);
      expect(statement.length).toBeGreaterThan(10);
      expect(["POSITIVE", "NEGATIVE"]).toContain(direction);
    }
  });

  it("all recorded response scores are within the 1–4 Likert scale", () => {
    for (const row of responseRows) {
      const score = parseInt(row[3]);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(4);
    }
  });

  it("aggregates frequencies per item with the shared utility", () => {
    const counts = aggregateCounts(responseRows);
    const totalResponses = Object.values(counts).reduce(
      (sum, c) => sum + c.f1 + c.f2 + c.f3 + c.f4,
      0
    );
    expect(totalResponses).toBe(responseRows.length);

    // Every item code in the template received at least one response
    for (const row of itemRows) {
      expect(counts[row[0]]).toBeDefined();
    }
  });

  it("computes an interpretation for every item within the paper's bands", () => {
    const counts = aggregateCounts(responseRows);
    for (const [code, c] of Object.entries(counts)) {
      const mean = weightedMean(c);
      expect(mean, code).not.toBeNull();
      const rounded = roundHalfUp2(mean!);
      expect(rounded, code).toBeGreaterThanOrEqual(1);
      expect(rounded, code).toBeLessThanOrEqual(4);
      expect(["Highly Acceptable", "Acceptable", "Unacceptable", "Highly Unacceptable"]).toContain(
        verbalInterpretation(rounded)
      );
    }
  });
});

describe("EVAL-01 synthetic acceptance scenario", () => {
  it("responses (4, 4, 3, 1) yield weighted mean 3.00 → Acceptable", () => {
    const counts = { f1: 1, f2: 0, f3: 1, f4: 2 };
    expect(counts.f1 + counts.f2 + counts.f3 + counts.f4).toBe(4);
    const mean = roundHalfUp2(weightedMean(counts)!);
    expect(mean).toBe(3.0);
    expect(verbalInterpretation(mean)).toBe("Acceptable");
  });

  it("aggregation of a 4-respondent CSV produces those same counts", () => {
    const rows = [
      ["RESP-001", "Gr. 7", "EFF-01", "4"],
      ["RESP-002", "Gr. 8", "EFF-01", "4"],
      ["RESP-003", "Gr. 9", "EFF-01", "3"],
      ["RESP-004", "Gr. 10", "EFF-01", "1"],
    ];
    expect(aggregateCounts(rows)["EFF-01"]).toEqual({ f1: 1, f2: 0, f3: 1, f4: 2 });
  });
});
