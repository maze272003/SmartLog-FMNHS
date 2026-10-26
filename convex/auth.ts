import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { hashPassword, verifyPassword } from "./crypto";
import { Doc, Id } from "./_generated/dataModel";

export async function getUserFromSession(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<Doc<"users"> | null> {
  if (!token) return null;
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user || user.status !== "ACTIVE") {
    return null;
  }
  return user;
}

export async function requireTeacher(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<Doc<"users">> {
  const user = await getUserFromSession(ctx, token);
  if (!user || user.role !== "TEACHER") {
    throw new Error("UNAUTHORIZED: Teacher access required");
  }
  return user;
}

export async function requireStudent(
  ctx: QueryCtx | MutationCtx,
  token: string
): Promise<Doc<"users">> {
  const user = await getUserFromSession(ctx, token);
  if (!user || user.role !== "STUDENT") {
    throw new Error("UNAUTHORIZED: Student access required");
  }
  return user;
}

// Login mutation: supports LRN (for students) or Email (for teachers/students)
export const login = mutation({
  args: {
    identifier: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const rawId = args.identifier.trim();
    const isEmail = rawId.includes("@");

    let user: Doc<"users"> | null = null;
    if (isEmail) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", rawId.toLowerCase()))
        .unique();
    } else {
      user = await ctx.db
        .query("users")
        .withIndex("by_lrn", (q) => q.eq("lrn", rawId))
        .unique();
    }

    if (!user) {
      return { success: false, error: "Invalid credentials or account does not exist" };
    }

    if (user.status !== "ACTIVE") {
      return { success: false, error: "Account is inactive. Please contact your teacher." };
    }

    const isValid = await verifyPassword(args.password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // Generate secure session token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    // Record login activity
    await ctx.db.insert("activityLogs", {
      actorId: user._id,
      actorRole: user.role,
      action: "USER_LOGIN",
      entityType: "users",
      entityId: user._id,
      details: `${user.fullName} logged in`,
      timestamp: Date.now(),
    });

    return {
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        lrn: user.lrn,
        role: user.role,
        program: user.program,
        gradeLevel: user.gradeLevel,
        section: user.section,
      },
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
    }
    return { success: true };
  },
});

// Short-lived verification for critical student actions (borrow / return)
export const verifyActionCredentials = mutation({
  args: {
    token: v.string(),
    password: v.string(),
    actionType: v.string(), // "BORROW" | "RETURN"
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) {
      throw new Error("UNAUTHENTICATED");
    }

    const isValid = await verifyPassword(args.password, user.passwordHash, user.passwordSalt);
    if (!isValid) {
      return { success: false, error: "Invalid password confirmation" };
    }

    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minute verification window
    await ctx.db.insert("actionVerifications", {
      userId: user._id,
      actionType: args.actionType,
      expiresAt,
    });

    return { success: true, expiresAt };
  },
});

// Get current session user
export const getCurrentUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) return null;
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      lrn: user.lrn,
      role: user.role,
      status: user.status,
      program: user.program,
      gradeLevel: user.gradeLevel,
      section: user.section,
      employeeId: user.employeeId,
      department: user.department,
    };
  },
});
