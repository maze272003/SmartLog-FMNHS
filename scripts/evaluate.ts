import * as fs from "fs";
import * as path from "path";

interface ResponseRow {
  respondent_code: string;
  cohort: string;
  item_code: string;
  score: number;
}

interface ItemSummary {
  itemCode: string;
  statement: string;
  f4: number; // Strongly Agree
  f3: number; // Agree
  f2: number; // Disagree
  f1: number; // Strongly Disagree
  totalValid: number;
  weightedMean: number;
  verbalInterpretation: string;
}

function parseCsv(content: string): string[][] {
  return content
    .trim()
    .split("\n")
    .map((line) => line.trim().split(",").map((cell) => cell.replace(/^"(.*)"$/, "$1")));
}

function getInterpretation(mean: number): string {
  if (mean >= 3.26) return "Highly Acceptable";
  if (mean >= 2.51) return "Acceptable";
  if (mean >= 1.76) return "Unacceptable";
  return "Highly Unacceptable";
}

function roundHalfUp(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function runEvaluation() {
  const itemsPath = path.join(__dirname, "../evaluation/instrument_items.csv");
  const responsesPath = path.join(__dirname, "../evaluation/survey_responses.csv");

  if (!fs.existsSync(itemsPath) || !fs.existsSync(responsesPath)) {
    console.error("Evaluation files missing.");
    return;
  }

  const itemLines = parseCsv(fs.readFileSync(itemsPath, "utf-8"));
  const itemHeaders = itemLines[0];
  const itemRows = itemLines.slice(1);

  const responseLines = parseCsv(fs.readFileSync(responsesPath, "utf-8"));
  const responseRows = responseLines.slice(1);

  const itemsMap: Record<string, string> = {};
  for (const row of itemRows) {
    itemsMap[row[0]] = row[3]; // item_code -> statement
  }

  // Aggregate by item
  const itemCounts: Record<string, { 1: number; 2: number; 3: number; 4: number }> = {};
  for (const row of responseRows) {
    const itemCode = row[2];
    const score = parseInt(row[3]);
    if (!itemCounts[itemCode]) {
      itemCounts[itemCode] = { 1: 0, 2: 0, 3: 0, 4: 0 };
    }
    if (score >= 1 && score <= 4) {
      itemCounts[itemCode][score as 1 | 2 | 3 | 4]++;
    }
  }

  console.log("=========================================================================================");
  console.log("       LOGTAP: AUTOMATED LAPTOP MONITORING SYSTEM EVALUATION (CHAPTER II METHODOLOGY)     ");
  console.log("=========================================================================================");
  console.log("Item Code | SA(4) | A(3)  | D(2)  | SD(1) | Total (N) | Weighted Mean | Verbal Interpretation");
  console.log("-----------------------------------------------------------------------------------------");

  let grandTotalMean = 0;
  let itemCount = 0;

  for (const [code, counts] of Object.entries(itemCounts)) {
    const f4 = counts[4];
    const f3 = counts[3];
    const f2 = counts[2];
    const f1 = counts[1];
    const total = f4 + f3 + f2 + f1;

    if (total === 0) continue;

    const rawMean = (4 * f4 + 3 * f3 + 2 * f2 + 1 * f1) / total;
    const roundedMean = roundHalfUp(rawMean);
    const interp = getInterpretation(roundedMean);

    grandTotalMean += roundedMean;
    itemCount++;

    console.log(
      `${code.padEnd(9)} | ${f4.toString().padStart(5)} | ${f3.toString().padStart(5)} | ${f2.toString().padStart(5)} | ${f1.toString().padStart(5)} | ${total.toString().padStart(9)} | ${roundedMean.toFixed(2).padStart(13)} | ${interp}`
    );
  }

  const overallMean = itemCount > 0 ? roundHalfUp(grandTotalMean / itemCount) : 0;
  console.log("-----------------------------------------------------------------------------------------");
  console.log(`OVERALL COMPOSITE MEAN: ${overallMean.toFixed(2)} (${getInterpretation(overallMean)})`);
  console.log("=========================================================================================");
}

if (require.main === module) {
  runEvaluation();
}
