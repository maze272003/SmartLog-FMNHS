import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStudent, requireTeacher, getUserFromSession } from "./auth";

export const submitBorrowRequest = mutation({
  args: {
    token: v.string(),
    laptopIds: v.array(v.id("laptops")),
    purpose: v.string(),
    requestedDueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const student = await requireStudent(ctx, args.token);

    if (args.laptopIds.length === 0) {
      throw new Error("VALIDATION_ERROR: At least one laptop must be selected");
    }

    // Ensure distinct laptop selection
    const uniqueIds = Array.from(new Set(args.laptopIds));
    if (uniqueIds.length !== args.laptopIds.length) {
      throw new Error("VALIDATION_ERROR: Duplicate laptops selected in request");
    }

    // Check recent action verification within last 5 minutes
    const recentVerification = await ctx.db
      .query("actionVerifications")
      .withIndex("by_user_and_action", (q) =>
        q.eq("userId", student._id).eq("actionType", "BORROW")
      )
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    if (!recentVerification) {
      throw new Error("IDENTITY_CONFIRMATION_REQUIRED: Please confirm your password to submit");
    }

    // Validate laptop availability & usability
    for (const lid of uniqueIds) {
      const laptop = await ctx.db.get(lid);
      if (!laptop) {
        throw new Error(`NOT_FOUND: Laptop ${lid} not found`);
      }
      if (laptop.availability !== "AVAILABLE" || laptop.condition === "DAMAGED") {
        throw new Error(
          `LAPTOP_UNAVAILABLE: Laptop ${laptop.assetCode} is currently not available for borrowing`
        );
      }
    }

    // Check if student already has a pending/approved request with any of these laptops
    const openRequests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_student_and_status", (q) =>
        q.eq("studentId", student._id)
      )
      .filter((q) =>
        q.or(q.eq(q.field("status"), "PENDING"), q.eq(q.field("status"), "APPROVED"))
      )
      .collect();

    for (const req of openRequests) {
      const reqLaptops = await ctx.db
        .query("requestLaptops")
        .withIndex("by_requestId", (q) => q.eq("requestId", req._id))
        .collect();
      const existingLidSet = new Set(reqLaptops.map((rl) => rl.laptopId));
      for (const lid of uniqueIds) {
        if (existingLidSet.has(lid)) {
          throw new Error("DUPLICATE_REQUEST: You already have an open request for one of these laptops");
        }
      }
    }

    const requestId = await ctx.db.insert("borrowRequests", {
      studentId: student._id,
      purpose: args.purpose.trim(),
      requestedQuantity: uniqueIds.length,
      requestedDueAt: args.requestedDueAt,
      status: "PENDING",
      submittedAt: Date.now(),
    });

    for (const lid of uniqueIds) {
      await ctx.db.insert("requestLaptops", {
        requestId,
        laptopId: lid,
      });
    }

    await ctx.db.insert("activityLogs", {
      actorId: student._id,
      actorRole: "STUDENT",
      action: "BORROW_REQUEST_SUBMITTED",
      entityType: "borrowRequests",
      entityId: requestId,
      details: `Student ${student.fullName} requested ${uniqueIds.length} laptop(s) for: ${args.purpose}`,
      timestamp: Date.now(),
    });

    return { success: true, requestId, requestedQuantity: uniqueIds.length };
  },
});

export const approveRequest = mutation({
  args: {
    token: v.string(),
    requestId: v.id("borrowRequests"),
    approvedDueAt: v.number(),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("NOT_FOUND: Request not found");

    if (req.status !== "PENDING") {
      throw new Error(`STATE_CONFLICT: Cannot approve request in ${req.status} state`);
    }

    if (args.approvedDueAt <= Date.now()) {
      throw new Error("VALIDATION_ERROR: Due date must be in the future");
    }

    await ctx.db.patch(args.requestId, {
      status: "APPROVED",
      approvedDueAt: args.approvedDueAt,
      reviewedByTeacherId: teacher._id,
      reviewedAt: Date.now(),
    });

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "BORROW_REQUEST_APPROVED",
      entityType: "borrowRequests",
      entityId: args.requestId,
      details: `Teacher ${teacher.fullName} approved request ${args.requestId}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const rejectRequest = mutation({
  args: {
    token: v.string(),
    requestId: v.id("borrowRequests"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("NOT_FOUND: Request not found");

    if (req.status !== "PENDING" && req.status !== "APPROVED") {
      throw new Error(`STATE_CONFLICT: Cannot reject request in ${req.status} state`);
    }

    await ctx.db.patch(args.requestId, {
      status: "REJECTED",
      reviewReason: args.reason.trim(),
      reviewedByTeacherId: teacher._id,
      reviewedAt: Date.now(),
    });

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "BORROW_REQUEST_REJECTED",
      entityType: "borrowRequests",
      entityId: args.requestId,
      details: `Teacher ${teacher.fullName} rejected request: ${args.reason}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const cancelRequest = mutation({
  args: {
    token: v.string(),
    requestId: v.id("borrowRequests"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("UNAUTHENTICATED");

    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("NOT_FOUND: Request not found");

    if (user.role === "STUDENT" && req.studentId !== user._id) {
      throw new Error("UNAUTHORIZED: You can only cancel your own requests");
    }

    if (req.status !== "PENDING" && req.status !== "APPROVED") {
      throw new Error(`STATE_CONFLICT: Cannot cancel request in ${req.status} state`);
    }

    await ctx.db.patch(args.requestId, {
      status: "CANCELLED",
      reviewReason: user.role === "STUDENT" ? "Cancelled by student" : "Cancelled by teacher",
    });

    await ctx.db.insert("activityLogs", {
      actorId: user._id,
      actorRole: user.role,
      action: "BORROW_REQUEST_CANCELLED",
      entityType: "borrowRequests",
      entityId: args.requestId,
      details: `Request cancelled by ${user.fullName}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const listMyRequests = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const student = await requireStudent(ctx, args.token);

    const requests = await ctx.db
      .query("borrowRequests")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .take(50);

    const result = [];
    for (const req of requests) {
      const lineLaptops = await ctx.db
        .query("requestLaptops")
        .withIndex("by_requestId", (q) => q.eq("requestId", req._id))
        .collect();

      const laptops = [];
      for (const rl of lineLaptops) {
        const l = await ctx.db.get(rl.laptopId);
        if (l) {
          laptops.push({
            id: l._id,
            assetCode: l.assetCode,
            model: l.model,
          });
        }
      }

      result.push({
        id: req._id,
        purpose: req.purpose,
        requestedQuantity: req.requestedQuantity,
        requestedDueAt: req.requestedDueAt,
        approvedDueAt: req.approvedDueAt,
        status: req.status,
        submittedAt: req.submittedAt,
        reviewedAt: req.reviewedAt,
        reviewReason: req.reviewReason,
        laptops,
      });
    }

    return result;
  },
});

export const listPendingRequests = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireTeacher(ctx, args.token);

    const pending = await ctx.db
      .query("borrowRequests")
      .withIndex("by_status", (q) => q.eq("status", "PENDING"))
      .order("desc")
      .take(50);

    const approved = await ctx.db
      .query("borrowRequests")
      .withIndex("by_status", (q) => q.eq("status", "APPROVED"))
      .order("desc")
      .take(50);

    const allRequests = [...pending, ...approved];

    const result = [];
    for (const req of allRequests) {
      const student = await ctx.db.get(req.studentId);
      const lineLaptops = await ctx.db
        .query("requestLaptops")
        .withIndex("by_requestId", (q) => q.eq("requestId", req._id))
        .collect();

      const laptops = [];
      for (const rl of lineLaptops) {
        const l = await ctx.db.get(rl.laptopId);
        if (l) {
          laptops.push({
            id: l._id,
            assetCode: l.assetCode,
            model: l.model,
            availability: l.availability,
            condition: l.condition,
          });
        }
      }

      result.push({
        id: req._id,
        student: student
          ? {
              id: student._id,
              fullName: student.fullName,
              lrn: student.lrn,
              gradeLevel: student.gradeLevel,
              section: student.section,
            }
          : null,
        purpose: req.purpose,
        requestedQuantity: req.requestedQuantity,
        requestedDueAt: req.requestedDueAt,
        approvedDueAt: req.approvedDueAt,
        status: req.status,
        submittedAt: req.submittedAt,
        reviewedAt: req.reviewedAt,
        laptops,
      });
    }

    return result;
  },
});
