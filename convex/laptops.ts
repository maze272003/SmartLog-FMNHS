import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireTeacher, getUserFromSession } from "./auth";
import { isLaptopIssuable } from "./domain";

export const listLaptops = query({
  args: {
    token: v.string(),
    availability: v.optional(v.string()),
    condition: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) {
      throw new Error("UNAUTHENTICATED");
    }

    let laptops = await ctx.db.query("laptops").take(200);

    if (args.availability && args.availability !== "ALL") {
      laptops = laptops.filter((l) => l.availability === args.availability);
    }
    if (args.condition && args.condition !== "ALL") {
      laptops = laptops.filter((l) => l.condition === args.condition);
    }
    if (args.search && args.search.trim() !== "") {
      const term = args.search.toLowerCase();
      laptops = laptops.filter(
        (l) =>
          l.assetCode.toLowerCase().includes(term) ||
          l.model.toLowerCase().includes(term) ||
          l.location.toLowerCase().includes(term) ||
          (l.serialNumber && l.serialNumber.toLowerCase().includes(term))
      );
    }

    if (user.role === "STUDENT") {
      return laptops.map((l) => ({
        id: l._id,
        assetCode: l.assetCode,
        model: l.model,
        location: l.location,
        condition: l.condition,
        availability: l.availability,
        isAvailable: isLaptopIssuable(l),
      }));
    }

    return laptops.map((l) => ({
      id: l._id,
      assetCode: l.assetCode,
      qrToken: l.qrToken,
      model: l.model,
      serialNumber: l.serialNumber,
      location: l.location,
      condition: l.condition,
      availability: l.availability,
      notes: l.notes,
      responsibleTeacherId: l.responsibleTeacherId,
    }));
  },
});

export const getLaptop = query({
  args: {
    token: v.string(),
    laptopId: v.id("laptops"),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("UNAUTHENTICATED");

    const laptop = await ctx.db.get("laptops", args.laptopId);
    if (!laptop) return null;

    if (user.role === "STUDENT") {
      return {
        id: laptop._id,
        assetCode: laptop.assetCode,
        model: laptop.model,
        location: laptop.location,
        condition: laptop.condition,
        availability: laptop.availability,
        isAvailable: isLaptopIssuable(laptop),
      };
    }

    // Teacher receives full history as well
    const loanLines = await ctx.db
      .query("loanLines")
      .withIndex("by_laptopId_and_status", (q) => q.eq("laptopId", laptop._id))
      .take(20);

    return {
      id: laptop._id,
      assetCode: laptop.assetCode,
      qrToken: laptop.qrToken,
      model: laptop.model,
      serialNumber: laptop.serialNumber,
      location: laptop.location,
      condition: laptop.condition,
      availability: laptop.availability,
      notes: laptop.notes,
      recentLoans: loanLines,
    };
  },
});

export const resolveQr = query({
  args: {
    token: v.string(),
    qrToken: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromSession(ctx, args.token);
    if (!user) throw new Error("UNAUTHENTICATED");

    const laptop = await ctx.db
      .query("laptops")
      .withIndex("by_qrToken", (q) => q.eq("qrToken", args.qrToken.trim()))
      .unique();

    if (!laptop) return null;

    return {
      id: laptop._id,
      assetCode: laptop.assetCode,
      model: laptop.model,
      location: laptop.location,
      condition: laptop.condition,
      availability: laptop.availability,
      isAvailable: isLaptopIssuable(laptop),
    };
  },
});

export const createLaptop = mutation({
  args: {
    token: v.string(),
    assetCode: v.string(),
    model: v.string(),
    serialNumber: v.optional(v.string()),
    location: v.string(),
    condition: v.union(v.literal("GOOD"), v.literal("FAIR"), v.literal("DAMAGED")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);

    const cleanAsset = args.assetCode.trim().toUpperCase();
    const existing = await ctx.db
      .query("laptops")
      .withIndex("by_assetCode", (q) => q.eq("assetCode", cleanAsset))
      .unique();

    if (existing) {
      throw new Error(`CONFLICT: Laptop with asset code ${cleanAsset} already exists`);
    }

    // Generate unique QR token
    const qrToken = `LT-${cleanAsset}-${Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;

    const laptopId = await ctx.db.insert("laptops", {
      assetCode: cleanAsset,
      qrToken,
      model: args.model.trim(),
      serialNumber: args.serialNumber?.trim(),
      location: args.location.trim(),
      condition: args.condition,
      availability: args.condition === "DAMAGED" ? "UNAVAILABLE" : "AVAILABLE",
      responsibleTeacherId: teacher._id,
      notes: args.notes?.trim(),
    });

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "LAPTOP_REGISTERED",
      entityType: "laptops",
      entityId: laptopId,
      details: `Teacher ${teacher.fullName} registered ${cleanAsset} (${args.model}) in ${args.location}`,
      timestamp: Date.now(),
    });

    return { success: true, laptopId };
  },
});

export const updateLaptop = mutation({
  args: {
    token: v.string(),
    laptopId: v.id("laptops"),
    model: v.string(),
    serialNumber: v.optional(v.string()),
    location: v.string(),
    condition: v.union(v.literal("GOOD"), v.literal("FAIR"), v.literal("DAMAGED")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);
    const laptop = await ctx.db.get("laptops", args.laptopId);
    if (!laptop) throw new Error("NOT_FOUND: Laptop not found");

    let availability = laptop.availability;
    if (laptop.availability !== "BORROWED") {
      if (args.condition === "DAMAGED") {
        availability = "UNAVAILABLE";
      } else if (laptop.availability === "UNAVAILABLE") {
        availability = "AVAILABLE";
      }
    }

    await ctx.db.patch("laptops", args.laptopId, {
      model: args.model.trim(),
      serialNumber: args.serialNumber?.trim(),
      location: args.location.trim(),
      condition: args.condition,
      availability,
      notes: args.notes?.trim(),
    });

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "LAPTOP_UPDATED",
      entityType: "laptops",
      entityId: args.laptopId,
      details: `Teacher ${teacher.fullName} updated details for ${laptop.assetCode}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const retireLaptop = mutation({
  args: {
    token: v.string(),
    laptopId: v.id("laptops"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);
    const laptop = await ctx.db.get("laptops", args.laptopId);
    if (!laptop) throw new Error("NOT_FOUND: Laptop not found");

    if (laptop.availability === "BORROWED") {
      throw new Error("INVALID_STATE: Cannot retire a laptop that is currently borrowed");
    }

    await ctx.db.patch("laptops", args.laptopId, {
      availability: "RETIRED",
      notes: `${laptop.notes ?? ""}\n[Retired: ${args.reason}]`.trim(),
    });

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "LAPTOP_RETIRED",
      entityType: "laptops",
      entityId: args.laptopId,
      details: `Teacher ${teacher.fullName} retired ${laptop.assetCode}: ${args.reason}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const recordLoss = mutation({
  args: {
    token: v.string(),
    laptopId: v.id("laptops"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const teacher = await requireTeacher(ctx, args.token);
    const laptop = await ctx.db.get("laptops", args.laptopId);
    if (!laptop) throw new Error("NOT_FOUND: Laptop not found");

    await ctx.db.patch("laptops", args.laptopId, {
      availability: "LOST",
      notes: `${laptop.notes ?? ""}\n[Reported Lost: ${args.notes}]`.trim(),
    });

    await ctx.db.insert("activityLogs", {
      actorId: teacher._id,
      actorRole: "TEACHER",
      action: "LAPTOP_MARKED_LOST",
      entityType: "laptops",
      entityId: args.laptopId,
      details: `Teacher ${teacher.fullName} reported ${laptop.assetCode} as lost: ${args.notes}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
