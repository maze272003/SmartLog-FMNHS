import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { hashPassword } from "./crypto";

export const seedInitialData = mutation({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const shouldForce = args.force ?? true; // Default to re-seeding cleanly when triggered

    const existingUsers = await ctx.db.query("users").first();
    if (existingUsers && !shouldForce) {
      return { message: "Database already has users. Skipping seed." };
    }

    if (shouldForce) {
      // Clean existing data for clean reseed
      const tables = [
        "users",
        "sessions",
        "actionVerifications",
        "laptops",
        "borrowRequests",
        "requestLaptops",
        "borrowTransactions",
        "loanLines",
        "returnSubmissions",
        "activityLogs",
      ] as const;

      for (const table of tables) {
        const records = await ctx.db.query(table).collect();
        for (const record of records) {
          // Union-typed table loop: the id cast keeps the explicit-table API
          // satisfied while deleting across every operational table.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await ctx.db.delete(table, record._id as any);
        }
      }
    }

    const defaultPassword = "Password123!";
    const { hash, salt } = await hashPassword(defaultPassword);

    // 1. Create Teacher
    const teacherId = await ctx.db.insert("users", {
      fullName: "Mr. Juan Dela Cruz",
      email: "teacher@fmnhs.edu.ph",
      role: "TEACHER",
      status: "ACTIVE",
      passwordHash: hash,
      passwordSalt: salt,
      employeeId: "EMP-2026-001",
      department: "ICT Department / Computer Laboratory",
    });

    // 2. Create Sample Students from SPICT Cohorts (Grades 7–10)
    const studentsData = [
      {
        fullName: "Zyrine Amber Titan",
        lrn: "105580160009",
        email: "user@example.com",
        gradeLevel: 7 as const,
        section: "Cybernauts",
      },
      {
        fullName: "Maria Ramos",
        lrn: "109283746502",
        email: "maria.ramos@student.fmnhs.edu.ph",
        gradeLevel: 8 as const,
        section: "Python",
      },
      {
        fullName: "Carl Mendoza",
        lrn: "109283746503",
        email: "carl.mendoza@student.fmnhs.edu.ph",
        gradeLevel: 9 as const,
        section: "Azure",
      },
      {
        fullName: "Bea Dela Torre",
        lrn: "109283746504",
        email: "bea.delatorre@student.fmnhs.edu.ph",
        gradeLevel: 10 as const,
        section: "AI",
      },
    ];

    for (const s of studentsData) {
      await ctx.db.insert("users", {
        fullName: s.fullName,
        lrn: s.lrn,
        email: s.email,
        role: "STUDENT",
        status: "ACTIVE",
        passwordHash: hash,
        passwordSalt: salt,
        program: "SPICT",
        gradeLevel: s.gradeLevel,
        section: s.section,
      });
    }

    // 3. Create Sample Laptops
    const laptopsData = [
      {
        assetCode: "LAP-001",
        model: "Dell Latitude 3420 (Core i5, 16GB)",
        serialNumber: "SN-DL3420-001",
        location: "Computer Lab Cart A - Slot 1",
        condition: "GOOD" as const,
        availability: "AVAILABLE" as const,
      },
      {
        assetCode: "LAP-002",
        model: "Dell Latitude 3420 (Core i5, 16GB)",
        serialNumber: "SN-DL3420-002",
        location: "Computer Lab Cart A - Slot 2",
        condition: "GOOD" as const,
        availability: "AVAILABLE" as const,
      },
      {
        assetCode: "LAP-003",
        model: "HP ProBook 440 G8 (Ryzen 5, 16GB)",
        serialNumber: "SN-HP440-003",
        location: "Computer Lab Cart A - Slot 3",
        condition: "GOOD" as const,
        availability: "AVAILABLE" as const,
      },
      {
        assetCode: "LAP-004",
        model: "Lenovo ThinkPad L14 (Core i5, 8GB)",
        serialNumber: "SN-L14-004",
        location: "Computer Lab Cart B - Slot 1",
        condition: "FAIR" as const,
        availability: "AVAILABLE" as const,
      },
      {
        assetCode: "LAP-005",
        model: "Acer TravelMate P2 (Core i3, 8GB)",
        serialNumber: "SN-TMP2-005",
        location: "Computer Lab Cart B - Slot 2",
        condition: "DAMAGED" as const,
        availability: "UNAVAILABLE" as const,
        notes: "Keyboard key loose, needs technician servicing.",
      },
    ];

    for (const l of laptopsData) {
      const qrToken = `LT-${l.assetCode}-DEMO`;
      await ctx.db.insert("laptops", {
        assetCode: l.assetCode,
        qrToken,
        model: l.model,
        serialNumber: l.serialNumber,
        location: l.location,
        condition: l.condition,
        availability: l.availability,
        responsibleTeacherId: teacherId,
        notes: l.notes,
      });
    }

    await ctx.db.insert("activityLogs", {
      actorId: teacherId,
      actorRole: "TEACHER",
      action: "DATABASE_SEEDED",
      entityType: "system",
      entityId: "seed",
      details: "Initial development seed data created with Zyrine Amber Titan (LRN: 105580160009)",
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "Database seeded successfully with 1 Teacher, 4 Students (including Zyrine Amber Titan), and 5 Laptops",
    };
  },
});
