import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireTeacher } from "./auth";

export const exportOperationalLogbook = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireTeacher(ctx, args.token);

    const transactions = await ctx.db.query("borrowTransactions").order("desc").take(500);

    const rows = [];
    for (const tx of transactions) {
      const lines = await ctx.db
        .query("loanLines")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
        .collect();

      const teacher = await ctx.db.get("users", tx.issuedByTeacherId);

      for (const line of lines) {
        let returnTeacherName = "";
        if (line.receivedByTeacherId) {
          const rt = await ctx.db.get("users", line.receivedByTeacherId);
          if (rt) returnTeacherName = rt.fullName;
        }

        rows.push({
          transactionId: tx._id,
          borrowerName: tx.borrowerNameSnapshot,
          lrn: tx.lrnSnapshot,
          gradeSection: tx.gradeSectionSnapshot,
          assetCode: line.assetCodeSnapshot,
          model: line.modelSnapshot,
          status: line.status,
          conditionOut: line.conditionOut,
          conditionIn: line.conditionIn ?? "",
          issuedAt: new Date(tx.issuedAt).toISOString(),
          dueAt: new Date(tx.dueAt).toISOString(),
          returnedAt: line.returnedAt ? new Date(line.returnedAt).toISOString() : "",
          issuedBy: teacher?.fullName ?? "Teacher",
          receivedBy: returnTeacherName,
          notes: line.returnNotes ?? line.issueNotes ?? "",
        });
      }
    }

    return rows;
  },
});

export const exportResearchMetrics = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireTeacher(ctx, args.token);

    const transactions = await ctx.db.query("borrowTransactions").take(500);

    const rows = [];
    let counter = 1;
    for (const tx of transactions) {
      const lines = await ctx.db
        .query("loanLines")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
        .collect();

      // De-identified synthetic code
      const txCode = `OBS-${String(counter).padStart(4, "0")}`;
      counter++;

      for (const line of lines) {
        const durationHours = line.returnedAt
          ? ((line.returnedAt - tx.issuedAt) / (1000 * 60 * 60)).toFixed(2)
          : "OUTSTANDING";

        const returnedOnTime = line.returnedAt ? line.returnedAt <= tx.dueAt : false;
        const conditionChanged = line.conditionIn ? line.conditionIn !== line.conditionOut : false;

        rows.push({
          observationCode: txCode,
          cohort: tx.gradeSectionSnapshot,
          quantity: tx.issuedQuantity,
          laptopModel: line.modelSnapshot,
          durationHours,
          returnedOnTime: line.returnedAt ? (returnedOnTime ? "YES" : "NO") : "N/A",
          conditionPreserved: line.conditionIn ? (conditionChanged ? "DEGRADED" : "SAME") : "N/A",
          status: line.status,
        });
      }
    }

    return rows;
  },
});
