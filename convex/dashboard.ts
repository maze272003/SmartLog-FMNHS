import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireTeacher, requireStudent } from "./auth";

export const getTeacherStats = query({
  args: {
    token: v.string(),
    clientNow: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx, args.token);

    const now = args.clientNow ?? Date.now();

    const laptops = await ctx.db.query("laptops").take(500);
    const totalLaptops = laptops.length;
    const availableLaptops = laptops.filter(
      (l) => l.availability === "AVAILABLE" && l.condition !== "DAMAGED"
    ).length;
    const borrowedLaptops = laptops.filter((l) => l.availability === "BORROWED").length;
    const unavailableLaptops = laptops.filter(
      (l) => l.availability === "UNAVAILABLE" || l.availability === "LOST" || l.condition === "DAMAGED"
    ).length;

    const pendingRequests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .take(100);

    const activeLines = await ctx.db
      .query("loanLines")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .take(200);

    let overdueCount = 0;
    let dueTodayCount = 0;

    // Manila day range
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);
    const endOfDay = new Date(now).setHours(23, 59, 59, 999);

    const checkedTxIds = new Set<string>();
    for (const line of activeLines) {
      if (checkedTxIds.has(line.transactionId)) continue;
      checkedTxIds.add(line.transactionId);

      const tx = await ctx.db.get(line.transactionId);
      if (tx) {
        if (tx.dueAt < now) {
          overdueCount++;
        } else if (tx.dueAt >= startOfDay && tx.dueAt <= endOfDay) {
          dueTodayCount++;
        }
      }
    }

    return {
      totalLaptops,
      availableLaptops,
      borrowedLaptops,
      unavailableLaptops,
      pendingRequestsCount: pendingRequests.length,
      activeLoansCount: activeLines.length,
      overdueCount,
      dueTodayCount,
    };
  },
});

export const getStudentStats = query({
  args: {
    token: v.string(),
    clientNow: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const student = await requireStudent(ctx, args.token);
    const now = args.clientNow ?? Date.now();

    const transactions = await ctx.db
      .query("borrowTransactions")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .take(50);

    let activeLaptopsCount = 0;
    let hasOverdue = false;
    let nearestDueAt: number | null = null;

    for (const tx of transactions) {
      const lines = await ctx.db
        .query("loanLines")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
        .collect();

      const activeLines = lines.filter((l) => l.status === "ACTIVE");
      if (activeLines.length > 0) {
        activeLaptopsCount += activeLines.length;
        if (tx.dueAt < now) {
          hasOverdue = true;
        }
        if (!nearestDueAt || tx.dueAt < nearestDueAt) {
          nearestDueAt = tx.dueAt;
        }
      }
    }

    const pendingRequests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_student_and_status", (q) =>
        q.eq("studentId", student._id).eq("status", "PENDING")
      )
      .take(10);

    return {
      activeLaptopsCount,
      hasOverdue,
      nearestDueAt,
      pendingRequestsCount: pendingRequests.length,
    };
  },
});
