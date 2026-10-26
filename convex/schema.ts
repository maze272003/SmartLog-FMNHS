import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (Teachers & Students)
  users: defineTable({
    fullName: v.string(),
    email: v.optional(v.string()), // Required for teachers, optional for students
    lrn: v.optional(v.string()),   // Required for students (text with leading zeros)
    role: v.union(v.literal("TEACHER"), v.literal("STUDENT")),
    status: v.union(v.literal("ACTIVE"), v.literal("INACTIVE")),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    program: v.optional(v.literal("SPICT")), // SPICT for students
    gradeLevel: v.optional(v.union(v.literal(7), v.literal(8), v.literal(9), v.literal(10))),
    section: v.optional(v.string()), // e.g. Cybernauts, Python, Azure, AI
    employeeId: v.optional(v.string()),
    department: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_lrn", ["lrn"])
    .index("by_role_and_status", ["role", "status"]),

  // Auth Sessions
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  // Short-lived Action Verification Tokens (for LRN/password confirmation)
  actionVerifications: defineTable({
    userId: v.id("users"),
    actionType: v.string(), // "BORROW" | "RETURN"
    expiresAt: v.number(),
  }).index("by_user_and_action", ["userId", "actionType"]),

  // Laptops Inventory
  laptops: defineTable({
    assetCode: v.string(), // Unique asset code (e.g. LAP-001)
    qrToken: v.string(),   // Unique opaque token for QR code
    model: v.string(),
    serialNumber: v.optional(v.string()),
    location: v.string(),
    condition: v.union(v.literal("GOOD"), v.literal("FAIR"), v.literal("DAMAGED")),
    availability: v.union(
      v.literal("AVAILABLE"),
      v.literal("BORROWED"),
      v.literal("UNAVAILABLE"),
      v.literal("LOST"),
      v.literal("RETIRED")
    ),
    responsibleTeacherId: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("by_assetCode", ["assetCode"])
    .index("by_qrToken", ["qrToken"])
    .index("by_availability", ["availability"])
    .index("by_condition", ["condition"]),

  // Borrow Requests
  borrowRequests: defineTable({
    studentId: v.id("users"),
    purpose: v.string(),
    requestedQuantity: v.number(),
    requestedDueAt: v.optional(v.number()),
    approvedDueAt: v.optional(v.number()),
    status: v.union(
      v.literal("PENDING"),
      v.literal("APPROVED"),
      v.literal("REJECTED"),
      v.literal("CANCELLED"),
      v.literal("FULFILLED")
    ),
    reviewedByTeacherId: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewReason: v.optional(v.string()),
    submittedAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_status", ["status"])
    .index("by_student_and_status", ["studentId", "status"]),

  // Request to Laptop Line Items
  requestLaptops: defineTable({
    requestId: v.id("borrowRequests"),
    laptopId: v.id("laptops"),
  })
    .index("by_requestId", ["requestId"])
    .index("by_laptopId", ["laptopId"])
    .index("by_request_and_laptop", ["requestId", "laptopId"]),

  // Borrow Transactions (Headers)
  borrowTransactions: defineTable({
    requestId: v.id("borrowRequests"),
    studentId: v.id("users"),
    borrowerNameSnapshot: v.string(),
    lrnSnapshot: v.string(),
    gradeSectionSnapshot: v.string(),
    issuedQuantity: v.number(),
    issuedAt: v.number(),
    dueAt: v.number(),
    issuedByTeacherId: v.id("users"),
  })
    .index("by_studentId", ["studentId"])
    .index("by_issuedAt", ["issuedAt"])
    .index("by_requestId", ["requestId"]),

  // Individual Loan Lines (Per-laptop issue and return tracking)
  loanLines: defineTable({
    transactionId: v.id("borrowTransactions"),
    laptopId: v.id("laptops"),
    assetCodeSnapshot: v.string(),
    modelSnapshot: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("RETURNED")),
    conditionOut: v.union(v.literal("GOOD"), v.literal("FAIR"), v.literal("DAMAGED")),
    issueNotes: v.optional(v.string()),
    returnedAt: v.optional(v.number()),
    receivedByTeacherId: v.optional(v.id("users")),
    conditionIn: v.optional(v.union(v.literal("GOOD"), v.literal("FAIR"), v.literal("DAMAGED"))),
    returnNotes: v.optional(v.string()),
  })
    .index("by_transactionId", ["transactionId"])
    .index("by_laptopId_and_status", ["laptopId", "status"])
    .index("by_status", ["status"]),

  // Student Return Submissions
  returnSubmissions: defineTable({
    loanLineId: v.id("loanLines"),
    studentId: v.id("users"),
    submittedAt: v.number(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("REJECTED"),
      v.literal("CANCELLED")
    ),
    reviewedByTeacherId: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewReason: v.optional(v.string()),
  })
    .index("by_loanLineId", ["loanLineId"])
    .index("by_studentId_and_status", ["studentId", "status"]),

  // Audit Activity Logs
  activityLogs: defineTable({
    actorId: v.id("users"),
    actorRole: v.union(v.literal("TEACHER"), v.literal("STUDENT")),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_actor", ["actorId"]),

  // Research Evaluation Synthetic/Observation Records
  researchObservations: defineTable({
    observationCode: v.string(),
    method: v.union(v.literal("MANUAL"), v.literal("LOGTAP")),
    taskType: v.string(),
    laptopQuantity: v.number(),
    elapsedSeconds: v.number(),
    isComplete: v.boolean(),
    errorCount: v.number(),
    timestamp: v.number(),
  }).index("by_method", ["method"]),
});
