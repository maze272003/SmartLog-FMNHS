import * as fs from "fs";
import * as path from "path";
import {
  weightedMean,
  verbalInterpretation,
  roundHalfUp2,
  type LikertCounts,
} from "../convex/domain";

function parseCsv(content: string): string[][] {
  return content
    .trim()
    .split("\n")
    .map((line) => line.trim().split(",").map((cell) => cell.replace(/^"(.*)"$/, "$1")));
}

export function aggregateCounts(rows: string[][]): Record<string, LikertCounts> {
  const itemCounts: Record<string, LikertCounts> = {};
  for (const row of rows) {
    const itemCode = row[2];
    const score = parseInt(row[3]);
    if (!itemCounts[itemCode]) {
      itemCounts[itemCode] = { f1: 0, f2: 0, f3: 0, f4: 0 };
    }
    if (score >= 1 && score <= 4) {
      itemCounts[itemCode][`f${score}` as keyof LikertCounts]++;
    }
  }
  return itemCounts;
}

export function runEvaluation() {
  const itemsPath = path.join(__dirname, "../evaluation/instrument_items.csv");
  const responsesPath = path.join(__dirname, "../evaluation/survey_responses.csv");

  if (!fs.existsSync(itemsPath) || !fs.existsSync(responsesPath)) {
    console.error("Evaluation files missing.");
    return;
  }

  const itemLines = parseCsv(fs.readFileSync(itemsPath, "utf-8"));
  const itemRows = itemLines.slice(1);

  const responseLines = parseCsv(fs.readFileSync(responsesPath, "utf-8"));
  const responseRows = responseLines.slice(1);

  const itemsMap: Record<string, string> = {};
  for (const row of itemRows) {
    itemsMap[row[0]] = row[3]; // item_code -> statement
  }

  // Aggregate by item
  const itemCounts = aggregateCounts(responseRows);

  console.log("=========================================================================================");
  console.log("       LOGTAP: AUTOMATED LAPTOP MONITORING SYSTEM EVALUATION (CHAPTER II METHODOLOGY)     ");
  console.log("=========================================================================================");
  console.log("Item Code | SA(4) | A(3)  | D(2)  | SD(1) | Total (N) | Weighted Mean | Verbal Interpretation");
  console.log("-----------------------------------------------------------------------------------------");

  let grandTotalMean = 0;
  let itemCount = 0;

  for (const [code, counts] of Object.entries(itemCounts)) {
    const f4 = counts.f4;
    const f3 = counts.f3;
    const f2 = counts.f2;
    const f1 = counts.f1;
    const total = f4 + f3 + f2 + f1;

    if (total === 0) continue;

    const rawMean = weightedMean(counts);
    if (rawMean === null) continue;
    const roundedMean = roundHalfUp2(rawMean);
    const interp = verbalInterpretation(roundedMean);

    grandTotalMean += roundedMean;
    itemCount++;

    console.log(
      `${code.padEnd(9)} | ${f4.toString().padStart(5)} | ${f3.toString().padStart(5)} | ${f2.toString().padStart(5)} | ${f1.toString().padStart(5)} | ${total.toString().padStart(9)} | ${roundedMean.toFixed(2).padStart(13)} | ${interp}`
    );
  }

  const overallMean = itemCount > 0 ? roundHalfUp2(grandTotalMean / itemCount) : 0;
  console.log("-----------------------------------------------------------------------------------------");
  console.log(`OVERALL COMPOSITE MEAN: ${overallMean.toFixed(2)} (${verbalInterpretation(overallMean)})`);
  console.log("=========================================================================================");
}

const isMain =
  typeof require !== "undefined" && require.main === module;

if (isMain) {
  runEvaluation();
}
