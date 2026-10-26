import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeacher } from "./auth";
import { hashPassword } from "./crypto";

export const createStudent = mutation({
  args: {
    token: v.string(),
    fullName: v.string(),
    lrn: v.string(),
    email: v.optional(v.string()),
    gradeLevel: v.union(v.literal(7), v.literal(8), v.literal(9), v.literal(10)),
    section: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);

    const cleanLrn = args.lrn.trim();
    if (!/^\d+$/.test(cleanLrn)) {
      throw new Error("VALIDATION_ERROR: LRN must contain only digits");
    }

    // Check unique LRN
    const existingLrn = await ctx.db
      .query("users")
      .withIndex("by_lrn", (q) => q.eq("lrn", cleanLrn))
      .unique();

    if (existingLrn) {
      throw new Error("CONFLICT: A student with this LRN already exists");
    }

    // Check unique email if provided
    let cleanEmail: string | undefined = undefined;
    if (args.email && args.email.trim() !== "") {
      cleanEmail = args.email.trim().toLowerCase();
      const existingEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", cleanEmail))
        .unique();
      if (existingEmail) {
        throw new Error("CONFLICT: A user with this email already exists");
      }
    }

    const { hash, salt } = await hashPassword(args.password);

    const studentId = await ctx.db.insert("users", {
      fullName: args.fullName.trim(),
      lrn: cleanLrn,
      email: cleanEmail,
      role: "STUDENT",
      status: "ACTIVE",
      passwordHash: hash,
      passwordSalt: salt,
      program: "SPICT",
      gradeLevel: args.gradeLevel,
      section: args.section.trim(),
    });

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "STUDENT_ENROLLED",
      entityType: "users",
      entityId: studentId,
      details: `Teacher ${teacher.fullName} enrolled student ${args.fullName} (LRN: ${cleanLrn}, Grade ${args.gradeLevel} - ${args.section})`,
      timestamp: Date.now(),
    });

    return { success: true, studentId };
  },
});

export const updateStudent = mutation({
  args: {
    token: v.string(),
    studentId: v.id("users"),
    fullName: v.string(),
    email: v.optional(v.string()),
    gradeLevel: v.union(v.literal(7), v.literal(8), v.literal(9), v.literal(10)),
    section: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE")),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);
    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "STUDENT") {
      throw new Error("NOT_FOUND: Student profile not found");
    }

    let cleanEmail: string | undefined = undefined;
    if (args.email && args.email.trim() !== "") {
      cleanEmail = args.email.trim().toLowerCase();
      const existingEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", cleanEmail))
        .unique();
      if (existingEmail && existingEmail._id !== args.studentId) {
        throw new Error("CONFLICT: Another user has this email address");
      }
    }

    await ctx.db.patch(args.studentId, {
      fullName: args.fullName.trim(),
      email: cleanEmail,
      gradeLevel: args.gradeLevel,
      section: args.section.trim(),
      status: args.status,
    });

    // If deactivated, delete live sessions & cancel pending requests
    if (args.status === "INACTIVE") {
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_userId", (q) => q.eq("userId", args.studentId))
        .collect();
      for (const s of sessions) {
        await ctx.db.delete(s._id);
      }

      const pendingRequests = await ctx.db
        .query("borrowRequests")
        .withIndex("by_student_and_status", (q) =>
          q.eq("studentId", args.studentId).eq("status", "PENDING")
        )
        .collect();
      for (const req of pendingRequests) {
        await ctx.db.patch(req._id, {
          status: "CANCELLED",
          reviewReason: "Student account was deactivated",
        });
      }
    }

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "STUDENT_UPDATED",
      entityType: "users",
      entityId: args.studentId,
      details: `Teacher ${teacher.fullName} updated profile for ${student.fullName}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const resetStudentPassword = mutation({
  args: {
    token: v.string(),
    studentId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);
    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "STUDENT") {
      throw new Error("NOT_FOUND: Student profile not found");
    }

    const { hash, salt } = await hashPassword(args.newPassword);
    await ctx.db.patch(args.studentId, {
      passwordHash: hash,
      passwordSalt: salt,
    });

    // Invalidate existing sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", args.studentId))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "STUDENT_PASSWORD_RESET",
      entityType: "users",
      entityId: args.studentId,
      details: `Teacher ${teacher.fullName} reset password for student ${student.fullName} (LRN: ${student.lrn})`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const listStudents = query({
  args: {
    token: v.string(),
    gradeLevel: v.optional(v.union(v.literal(7), v.literal(8), v.literal(9), v.literal(10))),
    section: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx, args.token);

    // Fetch up to 200 students bounded
    let students = await ctx.db
      .query("users")
      .withIndex("by_role_and_status", (q) => q.eq("role", "STUDENT"))
      .take(200);

    if (args.gradeLevel !== undefined) {
      students = students.filter((s) => s.gradeLevel === args.gradeLevel);
    }
    if (args.section && args.section.trim() !== "") {
      const sec = args.section.toLowerCase();
      students = students.filter((s) => s.section?.toLowerCase() === sec);
    }
    if (args.search && args.search.trim() !== "") {
      const term = args.search.toLowerCase();
      students = students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(term) ||
          (s.lrn && s.lrn.includes(term)) ||
          (s.email && s.email.toLowerCase().includes(term))
      );
    }

    return students.map((s) => ({
      id: s._id,
      fullName: s.fullName,
      lrn: s.lrn,
      email: s.email,
      gradeLevel: s.gradeLevel,
      section: s.section,
      status: s.status,
      program: s.program,
    }));
  },
});

export const getStudentById = query({
  args: {
    token: v.string(),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx, args.token);
    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "STUDENT") return null;

    // Active loan count
    const transactions = await ctx.db
      .query("borrowTransactions")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .take(50);

    const activeLines = [];
    for (const t of transactions) {
      const lines = await ctx.db
        .query("loanLines")
        .withIndex("by_transactionId", (q) => q.eq("transactionId", t._id))
        .collect();
      for (const line of lines) {
        if (line.status === "ACTIVE") {
          activeLines.push(line);
        }
      }
    }

    return {
      student: {
        id: student._id,
        fullName: student.fullName,
        lrn: student.lrn,
        email: student.email,
        gradeLevel: student.gradeLevel,
        section: student.section,
        status: student.status,
        program: student.program,
      },
      activeBorrowedCount: activeLines.length,
      totalTransactionsCount: transactions.length,
    };
  },
});
