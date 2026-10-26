import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeacher, requireStudent, getUserFromSession } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { deriveLoanCounts, isLaptopIssuable, availabilityAfterReturn, isOverdue } from "./domain";

export const releaseTransaction = mutation({
  args: {
    token: v.string(),
    requestId: v.id("borrowRequests"),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);

    const req = await ctx.db.get("borrowRequests", args.requestId);
    if (!req) throw new Error("NOT_FOUND: Borrow request not found");

    if (req.status !== "APPROVED") {
      throw new Error(`STATE_CONFLICT: Request must be in APPROVED state to release, currently: ${req.status}`);
    }

    const student = await ctx.db.get("users", req.studentId);
    if (!student || student.status !== "ACTIVE") {
      throw new Error("INELIGIBLE_STUDENT: Student account is not active");
    }

    if (!req.approvedDueAt || req.approvedDueAt <= Date.now()) {
      throw new Error("VALIDATION_ERROR: Request has no valid future due date");
    }

    // Get all requested laptops
    const reqLaptops = await ctx.db
      .query("requestLaptops")
      .withIndex("by_request_and_laptop", (q) => q.eq("requestId", req._id))
      .collect();

    if (reqLaptops.length === 0) {
      throw new Error("VALIDATION_ERROR: No laptops attached to request");
    }

    const laptops: Doc<"laptops">[] = [];
    for (const rl of reqLaptops) {
      const laptop = await ctx.db.get("laptops", rl.laptopId);
      if (!laptop) {
        throw new Error(`NOT_FOUND: Laptop ${rl.laptopId} not found`);
      }
      if (!isLaptopIssuable(laptop)) {
        throw new Error(
          `LAPTOP_UNAVAILABLE: Laptop ${laptop.assetCode} is not available (status: ${laptop.availability}, condition: ${laptop.condition})`
        );
      }
      laptops.push(laptop);
    }

    const issuedAt = Date.now();

    // 1. Create Transaction Header
    const transactionId = await ctx.db.insert("borrowTransactions", {
      requestId: req._id,
      studentId: student._id,
      borrowerNameSnapshot: student.fullName,
      lrnSnapshot: student.lrn ?? "",
      gradeSectionSnapshot: `Grade ${student.gradeLevel ?? ""} - ${student.section ?? ""}`,
      issuedQuantity: laptops.length,
      issuedAt,
      dueAt: req.approvedDueAt,
      issuedByTeacherId: teacher._id,
    });

    // 2. Create individual Loan Lines and update Laptop availability
    for (const laptop of laptops) {
      await ctx.db.insert("loanLines", {
        transactionId,
        laptopId: laptop._id,
        assetCodeSnapshot: laptop.assetCode,
        modelSnapshot: laptop.model,
        status: "ACTIVE",
        conditionOut: laptop.condition,
      });

      await ctx.db.patch("laptops", laptop._id, {
        availability: "BORROWED",
      });
    }

    // 3. Mark request as FULFILLED
    await ctx.db.patch("borrowRequests", req._id, {
      status: "FULFILLED",
    });

    // 4. Cancel competing open requests that include any of these issued laptops
    for (const laptop of laptops) {
      const conflictingReqLaptops = await ctx.db
        .query("requestLaptops")
        .withIndex("by_laptopId", (q) => q.eq("laptopId", laptop._id))
        .collect();

      for (const crl of conflictingReqLaptops) {
        if (crl.requestId === req._id) continue;
        const otherReq = await ctx.db.get("borrowRequests", crl.requestId);
        if (otherReq && (otherReq.status === "PENDING" || otherReq.status === "APPROVED")) {
          await ctx.db.patch("borrowRequests", otherReq._id, {
            status: "CANCELLED",
            reviewReason: `Laptop ${laptop.assetCode} was issued in another transaction`,
          });
        }
      }
    }

    // 5. Activity Log
    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "LAPTOPS_RELEASED",
      entityType: "borrowTransactions",
      entityId: transactionId,
      details: `Teacher ${teacher.fullName} issued ${laptops.length} laptop(s) to ${student.fullName} (LRN: ${student.lrn})`,
      timestamp: issuedAt,
    });

    return {
      success: true,
      transactionId,
      issuedQuantity: laptops.length,
    };
  },
});

export const submitReturn = mutation({
  args: {
    token: v.string(),
    loanLineIds: v.array(v.id("loanLines")),
  },
  handler: async (ctx, args) => {
    const student = await requireStudent(ctx, args.token);

    if (args.loanLineIds.length === 0) {
      throw new Error("VALIDATION_ERROR: Select at least one laptop to return");
    }

    // Verify recent action credentials
    const recentVerification = await ctx.db
      .query("actionVerifications")
      .withIndex("by_user_and_action", (q) =>
        q.eq("userId", student._id).eq("actionType", "RETURN")
      )
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!recentVerification) {
      throw new Error("IDENTITY_CONFIRMATION_REQUIRED: Please confirm your password to return");
    }

    let submittedCount = 0;
    for (const lineId of args.loanLineIds) {
      const line = await ctx.db.get("loanLines", lineId);
      if (!line || line.status !== "ACTIVE") {
        throw new Error(`STATE_CONFLICT: Loan line ${lineId} is not active`);
      }

      const tx = await ctx.db.get("borrowTransactions", line.transactionId);
      if (!tx || tx.studentId !== student._id) {
        throw new Error("UNAUTHORIZED: You can only return your own borrowed laptops");
      }

      // Check if already has pending submission
      const existingSubmission = await ctx.db
        .query("returnSubmissions")
        .withIndex("by_loanLineId", (q) => q.eq("loanLineId", line._id))
        .filter((q) => q.eq(q.field("status"), "PENDING"))
        .first();

      if (!existingSubmission) {
        await ctx.db.insert("returnSubmissions", {
          loanLineId: line._id,
          studentId: student._id,
          submittedAt: Date.now(),
          status: "PENDING",
        });
        submittedCount++;
      }
    }

    await ctx.db.insert("activityLogs", {
      actorId: student._id,
      actorRole: "STUDENT",
      action: "RETURN_SUBMITTED",
      entityType: "loanLines",
      entityId: args.loanLineIds[0],
      details: `Student ${student.fullName} initiated return submission for ${submittedCount} laptop(s)`,
      timestamp: Date.now(),
    });

    return { success: true, submittedCount };
  },
});

export const confirmReturn = mutation({
  args: {
    token: v.string(),
    lineReturns: v.array(
      v.object({
        loanLineId: v.id("loanLines"),
        conditionIn: v.union(v.literal("GOOD"), v.literal("FAIR"), v.literal("DAMAGED")),
        returnNotes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);

    if (args.lineReturns.length === 0) {
      throw new Error("VALIDATION_ERROR: No return items specified");
    }

    const returnTimestamp = Date.now();
    let returnedCount = 0;

    for (const item of args.lineReturns) {
      const line = await ctx.db.get("loanLines", item.loanLineId);
      if (!line || line.status !== "ACTIVE") {
        continue; // Skip already returned or invalid
      }

      // 1. Mark line as RETURNED
      await ctx.db.patch("loanLines", line._id, {
        status: "RETURNED",
        returnedAt: returnTimestamp,
        receivedByTeacherId: teacher._id,
        conditionIn: item.conditionIn,
        returnNotes: item.returnNotes?.trim(),
      });

      // 2. Update laptop condition & availability
      const laptop = await ctx.db.get("laptops", line.laptopId);
      if (laptop) {
        await ctx.db.patch("laptops", laptop._id, {
          condition: item.conditionIn,
          availability: availabilityAfterReturn(item.conditionIn),
          notes: item.returnNotes
            ? `${laptop.notes ?? ""}\n[Return note: ${item.returnNotes}]`.trim()
            : laptop.notes,
        });
      }

      // 3. Close any pending returnSubmissions for this line
      const pendingSubmissions = await ctx.db
        .query("returnSubmissions")
        .withIndex("by_loanLineId", (q) => q.eq("loanLineId", line._id))
        .filter((q) => q.eq(q.field("status"), "PENDING"))
        .collect();

      for (const sub of pendingSubmissions) {
        await ctx.db.patch("returnSubmissions", sub._id, {
          status: "CONFIRMED",
          reviewedByTeacherId: teacher._id,
          reviewedAt: returnTimestamp,
        });
      }

      returnedCount++;
    }

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "RETURN_CONFIRMED",
      entityType: "loanLines",
      entityId: args.lineReturns[0].loanLineId,
      details: `Teacher ${teacher.fullName} confirmed return of ${returnedCount} laptop(s)`,
      timestamp: returnTimestamp,
    });

    return { success: true, returnedCount };
  },
});

export const listMyBorrowed = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const student = await requireStudent(ctx, args.token);

    const transactions = await ctx.db
      .query("borrowTransactions")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(50);

    const result = [];
    for (const tx of transactions) {
      const lines = await ctx.db
        .query("loanLines")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
        .collect();

      const activeLines = lines.filter((l) => l.status === "ACTIVE");
      const returnedLines = lines.filter((l) => l.status === "RETURNED");
      const { returnedQuantity, outstandingQuantity, displayStatus } =
        deriveLoanCounts(lines);

      result.push({
        transactionId: tx._id,
        issuedQuantity: tx.issuedQuantity,
        returnedQuantity,
        outstandingQuantity,
        issuedAt: tx.issuedAt,
        dueAt: tx.dueAt,
        displayStatus,
        activeLines: activeLines.map((l) => ({
          id: l._id,
          laptopId: l.laptopId,
          assetCode: l.assetCodeSnapshot,
          model: l.modelSnapshot,
          conditionOut: l.conditionOut,
        })),
        returnedLines: returnedLines.map((l) => ({
          id: l._id,
          laptopId: l.laptopId,
          assetCode: l.assetCodeSnapshot,
          model: l.modelSnapshot,
          returnedAt: l.returnedAt,
          conditionIn: l.conditionIn,
        })),
      });
    }

    return result;
  },
});

export const getMyCalendar = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const student = await requireStudent(ctx, args.token);

    const transactions = await ctx.db
      .query("borrowTransactions")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .take(50);

    const activeEvents = [];
    for (const tx of transactions) {
      const lines = await ctx.db
        .query("loanLines")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
        .collect();

      const activeLines = lines.filter((l) => l.status === "ACTIVE");
      if (activeLines.length > 0) {
        activeEvents.push({
          transactionId: tx._id,
          dueAt: tx.dueAt,
          issuedAt: tx.issuedAt,
          outstandingQuantity: activeLines.length,
          laptops: activeLines.map((l) => ({
            id: l._id,
            assetCode: l.assetCodeSnapshot,
            model: l.modelSnapshot,
          })),
        });
      }
    }

    return activeEvents;
  },
});

export const listTeacherTransactions = query({
  args: {
    token: v.string(),
    filterStatus: v.optional(v.string()), // "ACTIVE" | "CLOSED" | "ALL"
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx, args.token);

    const transactions = await ctx.db
      .query("borrowTransactions")
      .order("desc")
      .take(100);

    const result = [];
    for (const tx of transactions) {
      const lines = await ctx.db
        .query("loanLines")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
        .collect();

      const activeLines = lines.filter((l) => l.status === "ACTIVE");
      const returnedLines = lines.filter((l) => l.status === "RETURNED");
      const { displayStatus } = deriveLoanCounts(lines);

      if (args.filterStatus === "ACTIVE" && displayStatus === "CLOSED") {
        continue;
      }
      if (args.filterStatus === "CLOSED" && displayStatus !== "CLOSED") {
        continue;
      }

      // Check if there are pending return submissions for any active line
      let hasPendingReturns = false;
      for (const al of activeLines) {
        const sub = await ctx.db
          .query("returnSubmissions")
          .withIndex("by_loanLineId", (q) => q.eq("loanLineId", al._id))
          .filter((q) => q.eq(q.field("status"), "PENDING"))
          .first();
        if (sub) {
          hasPendingReturns = true;
          break;
        }
      }

      result.push({
        id: tx._id,
        borrowerName: tx.borrowerNameSnapshot,
        lrn: tx.lrnSnapshot,
        gradeSection: tx.gradeSectionSnapshot,
        issuedQuantity: tx.issuedQuantity,
        returnedQuantity: returnedLines.length,
        outstandingQuantity: activeLines.length,
        issuedAt: tx.issuedAt,
        dueAt: tx.dueAt,
        displayStatus,
        hasPendingReturns,
        lines: lines.map((l) => ({
          id: l._id,
          laptopId: l.laptopId,
          assetCode: l.assetCodeSnapshot,
          model: l.modelSnapshot,
          status: l.status,
          conditionOut: l.conditionOut,
          conditionIn: l.conditionIn,
          returnedAt: l.returnedAt,
        })),
      });
    }

    return result;
  },
});

// Full transaction line details, snapshots, and timestamps (asd.md §12.4).
// Teachers may inspect any transaction; students only their own.
export const getTransactionDetails = query({
  args: {
    token: v.string(),
    transactionId: v.id("borrowTransactions"),
    clientNow: v.number(), // supplied by the client; queries never read the clock
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("UNAUTHENTICATED");

    const tx = await ctx.db.get("borrowTransactions", args.transactionId);
    if (!tx) return null;

    if (user.role === "STUDENT" && tx.studentId !== user._id) {
      throw new Error("UNAUTHORIZED: You can only view your own transactions");
    }

    const lines = await ctx.db
      .query("loanLines")
      .withIndex("by_transactionId", (q) => q.eq("transactionId", tx._id))
      .collect();

    const activeLines = lines.filter((l) => l.status === "ACTIVE");
    const { returnedQuantity, outstandingQuantity, displayStatus } =
      deriveLoanCounts(lines);

    const now = args.clientNow ?? tx.issuedAt;

    // Per-line pending return submissions (student submissions awaiting receipt)
    const linesWithSubmissions = [];
    for (const line of lines) {
      const pendingSubmission = await ctx.db
        .query("returnSubmissions")
        .withIndex("by_loanLineId", (q) => q.eq("loanLineId", line._id))
        .filter((q) => q.eq(q.field("status"), "PENDING"))
        .first();

      linesWithSubmissions.push({
        id: line._id,
        laptopId: line.laptopId,
        assetCode: line.assetCodeSnapshot,
        model: line.modelSnapshot,
        status: line.status,
        conditionOut: line.conditionOut,
        conditionIn: line.conditionIn,
        issuedNotes: line.issueNotes,
        returnNotes: line.returnNotes,
        returnedAt: line.returnedAt,
        receivedByTeacherId: line.receivedByTeacherId,
        hasPendingReturnSubmission: !!pendingSubmission,
      });
    }

    const issuedBy = await ctx.db.get("users", tx.issuedByTeacherId);
    let receivedBy: { id: Id<"users">; fullName: string } | null = null;
    const receivedIds = Array.from(
      new Set(
        lines
          .map((l) => l.receivedByTeacherId)
          .filter((id): id is Id<"users"> => id !== undefined)
      )
    );
    if (receivedIds.length === 1) {
      const rt = await ctx.db.get("users", receivedIds[0]);
      if (rt) receivedBy = { id: rt._id, fullName: rt.fullName };
    }

    return {
      id: tx._id,
      requestId: tx.requestId,
      studentId: tx.studentId,
      borrowerName: tx.borrowerNameSnapshot,
      lrn: tx.lrnSnapshot,
      gradeSection: tx.gradeSectionSnapshot,
      issuedQuantity: tx.issuedQuantity,
      issuedAt: tx.issuedAt,
      dueAt: tx.dueAt,
      issuedByTeacherName: issuedBy?.fullName ?? "",
      receivedByTeacherName: receivedBy?.fullName ?? null,
      returnedQuantity,
      outstandingQuantity,
      displayStatus,
      isOverdue: activeLines.length > 0 && isOverdue(tx.dueAt, now),
      lines: linesWithSubmissions,
    };
  },
});

