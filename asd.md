# LogTap — FMNHS Automated Laptop Monitoring System

Version: 3.0  
Updated: 2026-10-26  
Document type: AI coding agent implementation specification  
Status: Revised to align with the supplied research paper, the user's two-role QR application requirements, and the explicit user technology stack: Next.js + Convex (replacing the previous PHP and Google Sheets baseline).  
Supersedes: Version 2.0 of this file.

## 1. Source, precedence, and alignment result

The source is the supplied `Pasted text.txt`, titled **LogTap: Automated Laptop Monitoring System at Fort Magsaysay National High School**, containing Chapters I and II and dated August 2026.

Version 1.0 was partly aligned. It already covered borrower identity, password login, inventory, timestamps, accountability, and role protection. It was too broad about equipment and students, proposed a different technology stack, did not explicitly record multi-laptop transaction quantities, and omitted the paper's evaluation methodology.

Version 2.0 aligned the functional requirements but defaulted to a PHP and Google Sheets architecture based on the conceptual methods in the manuscript.

This Version 3.0 revision applies the user's explicit mandate: **the application technology stack is Next.js and Convex (`convex/`), not PHP and Google Sheets.** Convex provides native ACID transactions, reactive real-time sync, and end-to-end TypeScript safety, which cleanly satisfy and exceed the data integrity, concurrency, and audit requirements of the research study.

This revision applies the following precedence:

1. Explicit user instructions: Next.js + Convex stack (`convex/`); UI/UX-promax design system (dark mode, palette: Blue, white, gray, accent: blue); two roles, teacher/student authenticated areas, email-or-LRN student login, teacher inventory/student management, student borrowed-items/calendar, and QR scanning.
2. The paper's explicit Scope and Delimitations and Materials and Procedures.
3. Proposed engineering details in this file, clearly identified as implementation decisions.

Broad references to other ICT equipment in the introduction, significance, or related literature do not override the explicit laptops-only delimitation. Features of cited studies are background evidence, not automatic LogTap requirements. The research paper itself is not being edited.

### 1.1 Requirements traceability

| ID | Source requirement | Version 2.0 baseline | Revised Convex implementation |
| --- | --- | --- | --- |
| DOC-01 | Named LogTap system for FMNHS | Generic school inventory branding | LogTap branding and FMNHS JHS computer-laboratory context. |
| DOC-02 | SPICT Junior High School students, Grades 7–10 | Any school student | Restrict borrower enrollment to FMNHS SPICT Grades 7–10. |
| DOC-03 | Laptops are the sole equipment covered | Generic reusable assets | Laptop units only; no generic equipment categories in the application. |
| DOC-04 | Borrower identification and LRN/password logging | LRN login present | Required LRN; password authentication; student borrow/return submissions linked to verified identity. |
| DOC-05 | Number of laptops borrowed | Transaction quantity model | Borrowing transaction with one or more individually identified laptops; explicit requested, borrowed, returned, and outstanding counts. |
| DOC-06 | Borrowing date/time and return logging | Mostly covered | Server-generated release/return timestamps, student return submission, teacher custody confirmation, and complete history in Convex. |
| DOC-07 | Unique laptop QR codes and smartphone testing | Generic QR library proposed | OpenCV-based detection/decoding, printable unique laptop labels, and smartphone acceptance tests. |
| DOC-08 | JavaScript and PHP | PHP backend baseline | **Next.js (App Router, React 19, TypeScript) and Convex (`^1.44.0`) backend.** Eliminates PHP; uses Convex server functions (queries, mutations, actions). |
| DOC-09 | Google Sheets or Microsoft Excel for data management | Google Sheets workbook | **Convex real-time database** for operational records, providing native ACID transactions, zero-latency subscriptions, and robust indexing. Generates Excel/CSV-compatible exports for school records and evaluation metrics. |
| DOC-10 | Efficiency, accuracy, inventory tracking, accountability | Features covered | Operational evidence exports plus a documented evaluation protocol. |
| DOC-11 | Four-point questionnaire, frequency, percentage, weighted mean, verbal interpretation | Missing | Evaluation schema, analysis rules, provided scale, and tests in section 14. |
| DOC-12 | Voluntary participation and privacy/confidentiality | Generic security only | Separate research participation from ordinary borrowing access; protect identities and anonymize research exports. |
| DOC-13 | Excludes financial aspects and long-term maintenance | Maintenance recommended | Exclude repair-management and financial modules; keep only condition/unavailable flags needed for accurate inventory. |
| USR-01 | Teacher and student roles with different authenticated paths | Covered | Preserve both role areas with backend Convex authentication and role guards. |
| USR-02 | Student email or LRN login | Covered | Preserve optional email as an additional alias; LRN/password remains mandatory and independently functional. |
| USR-03 | Student current borrowing, calendar, QR scanner | Covered | Preserve all three as user-requested extensions supporting the paper. |
| USR-04 | UI/UX-promax design system | Generic styling | **UI/UX-promax design system**: modern dark mode with Blue, white, and gray palette; accent color is blue; smooth micro-interactions, responsive mobile views. |

## 2. Instructions for the implementing agent

Build a working application, not only a visual prototype. Use persistent records, authenticated backend operations, and a complete borrow/return workflow.

- **Stack Mandate**: Build the application using **Next.js (App Router, React 19, TypeScript, TailwindCSS v4)** and **Convex (`^1.44.0`)**. Do NOT use PHP or Google Sheets.
- **Convex Guidelines**: Always adhere to `convex/_generated/ai/guidelines.md` when writing Convex code. Use object-form function definitions (`query`, `mutation`, `action`), validate all arguments with `v.*` from `convex/values`, define tables and indexes in `convex/schema.ts`, use typed IDs (`Id<"tableName">`), use bounded queries (`.take(n)` or `.paginate()`) instead of unbounded `.collect()`, and never use wall-clock `Date.now()` inside queries.
- **Design System Mandate**: Follow the mandatory UI/UX-promax design system:
  - Color palette: **Blue, white, gray**
  - Theme: **Dark mode** by default
  - Accent color: **Blue**
  - High-craft aesthetics: smooth gradients, sleek card surfaces, glassmorphic touches, clear typography, and responsive touch-friendly elements.
- Implement the six MVP phases in section 16. Continue routine reversible work without stopping for approval after each phase.
- Enforce role, account status, student eligibility, object ownership, and business rules in Convex mutations and queries.
- Use secure authentication with password hashing (e.g., scrypt/argon2/bcrypt via Web Crypto or actions) and Convex session tokens. Do not store plaintext passwords.
- Keep fixtures fictional and development-only. Do not automatically import the paper's authors or population statistics as real user accounts.
- Do not deploy publicly, purchase services, send real messages, recruit respondents, or collect real research responses solely because this plan describes those capabilities.
- Record exact implementation decisions and tests. Distinguish code completion from school approval, actual field evaluation, and proven research outcomes.
- If required credentials or school decisions are missing, build independent parts and report the specific dependency. Never fake a successful integration.

## 3. Scope and proposed policies

### 3.1 Required school and participant scope

The application serves the FMNHS Junior High School computer laboratory and eligible SPICT students in Grades 7–10. Teacher accounts are limited to school-authorized laptop-monitoring personnel acting in the `TEACHER` role. There is no administrator, researcher, or principal login role.

The supplied paper lists these cohorts:

| Grade | Section | Population stated in the paper |
| --- | --- | --- |
| 7 | Cybernauts | 35 |
| 8 | Python | 32 |
| 9 | Azure | 32 |
| 10 | AI | 24 |
| Total | SPICT Junior High School | 123 |

Use grade/section names as initial configuration. These counts describe the paper's population; they are not runtime enrollment caps, guaranteed respondents, or automatically generated accounts. Actual eligible enrollment and participation must be recorded separately in Convex. Do not enable other programs or grades without a scope change.

### 3.2 Policy decisions not supplied by the paper

| Topic | Implementation decision |
| --- | --- |
| Account creation | Teachers create eligible student accounts; teacher accounts use secured provisioning. No public registration. |
| Teacher access | Every provisioned teacher can manage this laptop deployment. Do not infer access for all school employees. |
| Student email | Optional; an LRN-only student can activate, log in, borrow, return, and recover access. |
| Borrowed quantity | One or more distinct laptop units per transaction; the count is derived from selected units, never trusted from a free-text quantity. |
| Physical custody | Teachers confirm actual issue and receipt. Student submissions alone do not change possession. This is an accountability design choice, not a process explicitly dictated by the paper. |
| Due date | Required teacher-selected future date/time to support the user's calendar; no invented seven-day school policy or assumption of take-home permission. |
| Loan limit | No fixed three-laptop limit. Availability and teacher approval control quantity. A configurable limit may be added after a school policy is supplied. |
| Overdue behavior | Show overdue status and alerts. Do not automatically deny another loan or impose a penalty without an explicit school rule. |
| Approval | Permission to collect, not a reservation. Availability is checked again at physical release. |
| Time zone | `Asia/Manila`; store timestamps in UTC. |
| Research participation | Voluntary and separate from borrowing eligibility. Refusing a questionnaire does not deactivate an account. |
| Research instruments | The paper specifies dimensions and a scale, but not the actual questionnaire statements. Do not invent an approved or validated questionnaire. |

## 4. Technical architecture (Next.js + Convex)

### 4.1 Baseline components

| Component | Baseline |
| --- | --- |
| Frontend Application | **Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4**. Features the **UI/UX-promax** design system in dark mode (Blue, white, gray, accent: blue) with responsive teacher and student views. |
| Backend & API | **Convex (`^1.44.0`)** server functions (`queries`, `mutations`, `actions`) providing type-safe reactivity, automatic transactions, and authorization. |
| Operational Database | **Convex Database** with defined schema in `convex/schema.ts`, strict runtime validators (`v.*`), and secondary indexes. All data is persisted reactively in Convex cloud/local backend. |
| Authentication & Sessions | **Convex Session Management**: secure password hashing (scrypt/bcrypt/argon2 via Web Crypto in actions), session token validation via Convex query/mutation context (`ctx`), supporting Teacher email/password and Student LRN/password. |
| QR Detection/Decoding | **OpenCV.js** (or verified HTML5 camera barcode API with OpenCV fallback) running entirely client-side in the browser, keeping camera frames private. |
| QR Generation | Maintained SVG/Canvas generator producing unique opaque tokens mapped to `/q/[token]`. |
| Operational Export | Teacher-only CSV/Excel export generated via Convex query or action, providing school administrators with complete logbooks. |
| Research Analysis | TypeScript/Node evaluation utilities and CSV templates to calculate frequency, percentage, and weighted means per Chapter II specifications. |
| Test Equipment | Computer/laptop, printer, sticker paper, and smartphones. |

### 4.2 OpenCV integration gate

Before deploying the camera scanner, prove detection and decoding of a printed laptop QR on at least one target smartphone browser. Record the OpenCV build/version, browser, and result. Verify which QR APIs are actually exported by the selected JavaScript build; do not infer JavaScript availability from a C++ API page.

If the chosen OpenCV.js bundle lacks the required QR functionality, use a documented build that includes it or integrate a maintained camera QR reader (e.g. `html5-qrcode`) with OpenCV image processing. Manual asset-code entry remains an essential fallback in the UI.

### 4.3 Convex transactional consistency & concurrency model

Convex fundamentally solves the concurrency and atomicity challenges that plagued spreadsheet implementations:

1. **ACID Serializable Transactions**: Every Convex mutation executes as an atomic transaction. Either all changes commit, or all roll back with zero side effects.
2. **Optimistic Concurrency Control (OCC)**: When multiple teachers or students access the system concurrently, Convex automatically detects write conflicts. If a laptop is loaned to Student A, a concurrent release attempt for Student B referencing that same laptop will fail OCC or abort on availability validation.
3. **No External Lock Required**: Unlike Google Sheets, no single-host process locks, file-based markers, or write recovery journals are needed. Convex guarantees state integrity at the database layer.
4. **Real-time Reactivity**: When a mutation modifies a record (e.g. laptop availability or pending requests), all active clients subscribed via `useQuery` immediately receive the updated data over WebSockets without manual polling or browser refreshes.

## 5. Identity, accounts, and permissions

### 5.1 Login and profile requirements

| User | Login | Required details |
| --- | --- | --- |
| Teacher | Email + password | Full name, unique email, trusted auth subject, `TEACHER` role, active/inactive status, optional employee ID/department. |
| Student | LRN + password; optional email + same password/account | Full name, unique LRN (text with preserved leading zeros), SPICT enrollment, grade 7–10, section, `STUDENT` role, active/inactive status. Email optional. |

Store LRN as text and preserve leading zeros. Validate nonempty digits; exact-length rules need a confirmed school rule rather than an invented constraint. Use stable `Id<"users">` for relationships. Email normalization and login aliases must resolve unambiguously to one identity.

Password hashes, salts, and session tokens are stored securely in Convex `users` and `sessions` tables (or Convex Auth) and are NEVER exposed in public queries. Use Web Crypto or secure hashing functions in Convex actions/mutations, CSRF protection, and rate limiting.

### 5.2 Student borrow/return identity confirmation

The normal demonstrated logging path must use LRN and password, as stated in the paper. Email is an additional user-requested login option and must not replace that path.

Before submitting a borrowing transaction or a student return request, require a recent successful LRN/password verification for that same student and action. A five-minute verification window avoids immediately repeating a login. Bind any short-lived proof to the student, session, operation type, and selected laptop/loan IDs in Convex. Never trust a client timestamp or another person's supplied LRN as identity proof.

On shared devices, provide visible logout and clear session state. A teacher may receive a physical return without the student's login when the student is inactive or cannot authenticate; record the teacher and an exception reason. A return must not be blocked in a way that prevents recovering a laptop.

### 5.3 Provisioning and recovery

- Provision teachers through a secured seed script or invitation process; no public teacher signup.
- Teachers create only eligible SPICT Grade 7–10 student profiles.
- Use one-time activation or random temporary credentials with a required password change.
- Support teacher-assisted, single-use recovery for students without email. Teachers cannot read existing passwords.
- Students cannot change their role, LRN, program, grade, section, or account status.
- Deactivation cancels unfulfilled requests but retains borrowing records. It never prevents a teacher from accepting an outstanding return.

### 5.4 Authorization matrix

| Action | Teacher | Student |
| --- | --- | --- |
| View laptop availability | Yes | Yes; no borrower identities exposed |
| Manage laptops and print labels | Yes | No |
| View/manage eligible student accounts | Yes | No |
| Change roles through application UI | No | No |
| Submit a borrow/return request | No impersonation; assists physically | Own records, with identity confirmation |
| Approve/reject/cancel borrow requests | Yes | Cancel own unfulfilled requests only |
| Confirm physical issue or receipt | Yes | No |
| View transactions and audit details | School monitoring records | Own borrowing history only |
| View current borrowed laptops/calendar | School monitoring views | Own only |
| Export identifiable operational logbook | Yes | No |
| Produce research exports | Teacher-generated de-identified output | No access to other responses |
| Participate in research | Voluntary, subject to protocol | Voluntary; not required for service |

Every Convex mutation and query derives the actor from the validated session/auth token. Client-supplied user IDs, roles, quantities, timestamps, and status values are never trusted.

## 6. Routes and modules (Next.js App Router)

Implement the frontend using the Next.js App Router with the **UI/UX-promax** design system (dark mode, palette: Blue, white, gray, accent: blue).

### 6.1 Shared routes

| Route | Behavior |
| --- | --- |
| `app/page.tsx` (`/`) | LogTap branding, FMNHS computer laboratory context, role chooser; redirects authenticated users to their role dashboard. |
| `app/teacher/login/page.tsx` (`/teacher/login`) | Teacher email/password login. |
| `app/student/login/page.tsx` (`/student/login`) | Email-or-LRN/password login with LRN path prominently supported. |
| `app/account/activate/page.tsx` (`/account/activate`) | Valid one-time activation/password setup. |
| `app/account/reset-password/page.tsx` (`/account/reset-password`) | Recovery flow, including no-email teacher-assisted code recovery. |
| `app/account/change-password/page.tsx` (`/account/change-password`) | Authenticated or forced initial password change. |
| `app/q/[token]/page.tsx` (`/q/[token]`) | Authenticated QR handler: resolves laptop QR token, redirects to teacher inventory view or student request view based on role. |

### 6.2 Teacher modules

| Route | Required behavior |
| --- | --- |
| `app/teacher/dashboard/page.tsx` | Summary cards (available, borrowed, unavailable laptops, pending requests, due today, overdue). Outstanding laptop counts per borrower. Quick links to actions. |
| `app/teacher/inventory/page.tsx` | Laptop list; search by asset code/model/serial; filter by location, condition, status. Add/edit units and archive unused records. |
| `app/teacher/inventory/[laptopId]/page.tsx` | Laptop details, QR preview, condition, location, and complete loan history. |
| `app/teacher/inventory/labels/page.tsx` | Printable QR sticker layout with high-contrast laptop asset codes and school branding. |
| `app/teacher/students/page.tsx` | Eligible SPICT student roster, create student form, search by name/LRN, grade/section filters, status toggles. |
| `app/teacher/students/[studentId]/page.tsx` | Student profile, active borrowed quantity, borrowing history, overdue status, password reset trigger. |
| `app/teacher/requests/page.tsx` | Pending and approved requests, laptop list and derived quantity, borrower identity, purpose, teacher-selected due time, approve/reject dialogs. |
| `app/teacher/transactions/page.tsx` | Active, partially returned, and completed borrowings, with pending return submissions indicator. |
| `app/teacher/transactions/[transactionId]/page.tsx` | All laptop lines, explicit borrowed/returned/outstanding counts, timestamps, teachers, and physical return action for selected lines. |
| `app/teacher/logbook/page.tsx` | Searchable/filterable operational logbook with CSV/Excel export option. |
| `app/teacher/profile/page.tsx` | Profile details and password change. |

### 6.3 Student modules

| Route | Required behavior |
| --- | --- |
| `app/student/dashboard/page.tsx` | Active laptop quantity, approaching due times, overdue warnings, request status updates, Scan QR shortcut. |
| `app/student/scan/page.tsx` | OpenCV/camera QR scanner with live viewfinder, manual asset-code fallback, cart/selection list of one or more distinct laptops. |
| `app/student/laptops/[laptopId]/page.tsx` | Safe laptop information and availability, with add-to-request action. |
| `app/student/requests/page.tsx` | Own pending/approved/rejected/cancelled requests and quantities; cancel before release. |
| `app/student/borrowed/page.tsx` | Current laptop lines grouped by transaction; borrowed/returned/outstanding quantity; due time and Request Return action. |
| `app/student/transactions/[transactionId]/page.tsx` | Own laptop list, issue time, per-laptop return status, due time, and chronological history. |
| `app/student/calendar/page.tsx` | Current outstanding laptops by due date, plus accessible agenda view. |
| `app/student/history/page.tsx` | Completed and partially returned transactions with actual per-laptop return dates. |
| `app/student/profile/page.tsx` | Own profile view and password change. |

## 7. Laptop inventory and QR requirements

Each physical laptop document in Convex has: `_id`, `assetCode` (unique text), `qrToken` (unique opaque string), `model`, optional `serialNumber`, `location`, `condition`, `availability`, optional `responsibleTeacherId`, optional `notes`, and timestamps.

Conditions: `GOOD`, `FAIR`, `DAMAGED`.  
Availability: `AVAILABLE`, `BORROWED`, `UNAVAILABLE`, `LOST`, `RETIRED`.

- Only available laptops in good/fair condition can be requested and issued.
- A damaged return becomes unavailable, with a condition note. This is an inventory flag, not a long-term maintenance module.
- A teacher can mark an unloaned laptop usable again after checking its condition and recording a reason.
- An active loan prevents retirement, deletion, or manually switching the laptop to available.
- If a borrowed laptop is reported lost, its loan stays outstanding and its status becomes lost. No automatic financial liability is calculated.
- Recover a lost borrowed laptop through the normal teacher return process; preserve the earlier loss event.
- Archive/retire items without deleting their historical logs.

QR format: an application URL such as `https://<school-domain>/q/<opaque-token>`. Tokens are resolved through an authenticated Convex query/mutation. Duplicate scans in the same selection are rejected without increasing the quantity.

## 8. Borrowing, quantity, and return workflow

### 8.1 Request and physical release

1. The student signs in and scans/selects one or more distinct available laptops.
2. The system displays selected asset codes, derived requested quantity, and a brief purpose field.
3. The student confirms identity using recent LRN/password verification and submits the request (`api.requests.submitBorrowRequest`).
4. A teacher reviews the student, laptop list, quantity, and purpose. The teacher approves the full selection with an explicit due time, or rejects it with a reason (`api.requests.approveRequest` / `rejectRequest`).
5. At physical collection, the teacher verifies the physical laptops, condition, and student identity, then confirms issue (`api.transactions.releaseTransaction`).
6. Convex executes the release in a single atomic mutation: creates the transaction header, creates individual loan lines per laptop, marks all laptops `BORROWED`, cancels overlapping open requests, and records audit logs.
7. If any laptop is unavailable or conflicted at issue time, the mutation rolls back completely with zero partial writes.

### 8.2 Student return submission and teacher receipt

1. The student selects one or more of their own outstanding laptop lines and confirms identity with recent LRN/password verification (`api.transactions.submitReturn`).
2. Convex records the `returnSubmissions` documents. The laptops remain `BORROWED` until physical teacher receipt.
3. The teacher physically inspects the laptops and confirms receipt of selected lines, recording condition and any notes (`api.transactions.confirmReturn`).
4. Convex atomically updates the received loan lines with `returnedAt` and `receivedByTeacherId`, sets laptops to `AVAILABLE` (or `UNAVAILABLE` if damaged), updates return submissions, and calculates transaction state (`OPEN`, `PARTIALLY_RETURNED`, or `CLOSED`).
5. Partial returns are supported: only returned laptops are cleared; unreturned laptops remain outstanding in the student's calendar.

### 8.3 Example quantity contract

A student borrows `LAP-001` and `LAP-002` in one transaction:

- `borrowedQuantity = 2`.
- After `LAP-001` is physically received: `returnedQuantity = 1` and `outstandingQuantity = 1`.
- The transaction is `PARTIALLY_RETURNED`; only `LAP-002` remains in the current-loan calendar.
- After receipt of `LAP-002`: `returnedQuantity = 2` and `outstandingQuantity = 0`.
- The transaction is `CLOSED`.

## 9. State, atomicity, and recovery rules

### 9.1 Stored and derived states

| Record | States and transitions |
| --- | --- |
| Borrow request | `PENDING` → `APPROVED` or `REJECTED`; `PENDING`/`APPROVED` → `CANCELLED`; `APPROVED` → `FULFILLED` only after confirmed physical release. |
| Laptop loan line | `ACTIVE` → `RETURNED` only after teacher-confirmed receipt. |
| Student return submission | `PENDING` → `CONFIRMED`, `REJECTED`, or `CANCELLED`, with reason for rejection. |
| Transaction display state | Derived from loan lines: `OPEN` (0 lines returned), `PARTIALLY_RETURNED` (some returned), `CLOSED` (all returned). |
| Overdue | Derived dynamically when server time exceeds `dueAt` on an active loan line. Not a stored flag. |

### 9.2 Release commit in Convex

In Convex mutation `api.transactions.releaseTransaction`:

1. Authenticate caller and assert `TEACHER` role.
2. Read the approved request, borrower student profile, and all requested laptop documents.
3. Validate that every requested laptop is currently `AVAILABLE` and in `GOOD` or `FAIR` condition.
4. Validate that `approvedDueAt` is in the future.
5. Insert `borrowTransactions` document with borrower/LRN snapshots and `issuedQuantity`.
6. Insert individual `loanLines` documents for each laptop.
7. Patch each laptop's availability to `BORROWED`.
8. Patch request status to `FULFILLED`.
9. Query and cancel any other pending/approved requests containing any of these issued laptops.
10. Insert audit log event in `activityLogs`.

Because Convex mutations are ACID transactions, any failure or condition violation rolls back the entire operation cleanly.

### 9.3 Return commit in Convex

In Convex mutation `api.transactions.confirmReturn`:

1. Authenticate caller and assert `TEACHER` role.
2. For each selected loan line ID: verify line is `ACTIVE` and belongs to the specified transaction.
3. Patch loan line with `returnedAt = Date.now()`, `receivedByTeacherId`, `conditionIn`, and `returnNotes`.
4. Patch the corresponding laptop's condition and set availability: `AVAILABLE` if good/fair, `UNAVAILABLE` if damaged.
5. If a pending `returnSubmissions` exists for this line, patch it to `CONFIRMED`.
6. Insert audit log event.
7. Return updated counts (`returnedQuantity`, `outstandingQuantity`) to the caller.

## 10. Time, dashboards, and calendar

Persist timestamps as UTC millisecond integers (`v.number()`); interpret inputs and render dates in `Asia/Manila` (`UTC+8`) regardless of client browser time zone.

Required timestamps: request submitted, approval/rejection, physical issue, student return submission, actual receipt per laptop, and audit event time.

- Due today: outstanding lines due during the current Manila calendar date.
- Due soon: UI grouping of non-overdue lines due within 48 hours.
- Calendar: displays only the authenticated student's outstanding laptop lines by due date.
- Partial returns: immediately removes received lines; remaining lines stay visible on the calendar.
- Real-time updates: Convex queries automatically re-render dashboards when transactions occur.

## 11. Data model and Convex Schema (`convex/schema.ts`)

Define all operational tables in `convex/schema.ts` using Convex validators.

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (Teachers & Students)
  users: defineTable({
    fullName: v.string(),
    email: v.optional(v.string()), // Required for teachers, optional for students
    lrn: v.optional(v.string()),   // Required for students (stored as text with leading zeros)
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
  }).index("by_token", ["token"]),

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
    .index("by_availability", ["availability"]),

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
    .index("by_status", ["status"]),

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
    .index("by_issuedAt", ["issuedAt"]),

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
    .index("by_entity", ["entityType", "entityId"]),

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
  }),
});
```

## 12. Backend operation contracts (Convex API)

All endpoints are implemented as Convex TypeScript server functions under `convex/`:

### 12.1 Authentication & Profiles (`convex/auth.ts`, `convex/users.ts`)
- `mutation api.auth.login`: Validates email/LRN + password, generates session token.
- `mutation api.auth.logout`: Invalidates session token.
- `mutation api.auth.verifyActionCredentials`: Re-verifies student LRN and password; issues 5-minute action token.
- `query api.users.getCurrentUser`: Returns authenticated user profile, role, and active status.
- `mutation api.users.createStudent`: Teacher-only; creates SPICT Grade 7–10 student profile with initial password.
- `mutation api.users.deactivateStudent`: Teacher-only; deactivates account and cancels pending requests.
- `mutation api.users.resetStudentPassword`: Teacher-assisted recovery without disclosing existing password.

### 12.2 Laptop Inventory & QR (`convex/laptops.ts`)
- `query api.laptops.listLaptops`: Bounded query; returns laptops matching search/filters. Returns safe projection for students.
- `query api.laptops.getLaptop`: Returns single laptop details.
- `query api.laptops.resolveQr`: Resolves `qrToken` to laptop ID and availability.
- `mutation api.laptops.createLaptop`: Teacher-only; inserts laptop with unique asset code and generated QR token.
- `mutation api.laptops.updateLaptop`: Teacher-only; updates location, notes, or condition.
- `mutation api.laptops.retireLaptop`: Teacher-only; archives unborrowed laptop.
- `mutation api.laptops.recordLoss`: Teacher-only; marks laptop as LOST while preserving loan.

### 12.3 Requests & Approvals (`convex/requests.ts`)
- `mutation api.requests.submitBorrowRequest`: Validates student session, recent action verification, distinct available laptop IDs, and purpose.
- `query api.requests.listMyRequests`: Student query for own requests.
- `query api.requests.listPendingRequests`: Teacher query for pending student requests.
- `mutation api.requests.approveRequest`: Teacher-only; sets `approvedDueAt` and approves selection.
- `mutation api.requests.rejectRequest`: Teacher-only; sets reason and marks rejected.
- `mutation api.requests.cancelRequest`: Allows student to cancel unfulfilled request.

### 12.4 Transactions & Custody (`convex/transactions.ts`)
- `mutation api.transactions.releaseTransaction`: Teacher-only atomic mutation. Validates all laptops available; creates `borrowTransactions` and `loanLines`; updates laptop status to `BORROWED`; cancels competing requests; logs event.
- `mutation api.transactions.submitReturn`: Student selects own active lines; creates `returnSubmissions` pending teacher receipt.
- `mutation api.transactions.confirmReturn`: Teacher-only atomic mutation. Confirms physical receipt of lines; marks lines `RETURNED`; updates laptops to `AVAILABLE` (or `DAMAGED`); closes return submissions.
- `query api.transactions.listMyActiveLoans`: Returns student's currently borrowed laptop lines and derived quantities.
- `query api.transactions.getMyCalendar`: Returns student's active loans grouped by due date.
- `query api.transactions.listTeacherTransactions`: Teacher query for active, partial, and closed borrowings.
- `query api.transactions.getTransactionDetails`: Full transaction line details, snapshots, and timestamps.

### 12.5 Dashboards & Reporting (`convex/dashboard.ts`, `convex/logbook.ts`)
- `query api.dashboard.getTeacherStats`: Aggregates total physical laptops, available, borrowed, overdue, and pending requests.
- `query api.dashboard.getStudentStats`: Aggregates active borrowed quantity, approaching due times, and open requests.
- `query api.logbook.exportOperationalLogbook`: Teacher-only; returns full borrow-return records formatted for CSV export.
- `query api.logbook.exportResearchMetrics`: Teacher-only; returns de-identified transaction records (no names, LRNs, or auth data).

## 13. Privacy, audit, and operational evidence

The paper's Ethical Considerations require privacy, confidentiality, informed orientation, and voluntary research participation.

- **Role-based Data Segregation**: Student queries derive identity strictly from the session and filter by `studentId`. They never receive data or identities of other students.
- **De-identification**: Research exports omit student names, LRNs, emails, and exact timestamps. Responses use anonymous participant codes.
- **Audit Trails**: All state transitions (releases, returns, exceptions, condition changes) are recorded in `activityLogs` with trusted server timestamps (`Date.now()`).
- **No Sensitive Logging**: Passwords, hashes, and session tokens are never logged or exported.

## 14. Research evaluation support

This section specifies evaluation deliverables aligned with Chapter II.

### 14.1 Evaluation dimensions from the Statement of the Problem

| Research question group | Dimensions to retain |
| --- | --- |
| System effectiveness | Performance, accuracy, data protection. |
| School benefits | Ease of use, inventory tracking, accountability. |
| Respondent satisfaction | Data privacy, time management, monitoring ability. |
| Acceptability | Functionality, usability, reliability, security. |

Deliver evaluation templates and an analysis utility script (`scripts/evaluate.ts`):
- `evaluation/instrument_items.csv`: item code, question group, dimension, statement.
- `evaluation/survey_responses.csv`: respondent code, item code, score (1–4).
- `evaluation/observations.csv`: task observation metrics.

### 14.2 Questionnaire scoring specified by the paper

| Score | Response | Mean range printed in the paper | Interpretation |
| --- | --- | --- | --- |
| 4 | Strongly Agree | 3.26–4.00 | Highly Acceptable |
| 3 | Agree | 2.51–3.25 | Acceptable |
| 2 | Disagree | 1.76–2.50 | Unacceptable |
| 1 | Strongly Disagree | 1.00–1.75 | Highly Unacceptable |

Formulas implemented in the TypeScript evaluation utility:
- Frequency: Count of valid responses for score $i \in \{1, 2, 3, 4\}$.
- Percentage: $P_i = \frac{f_i}{N_{\text{valid}}} \times 100$.
- Weighted Mean: $\bar{x} = \frac{4f_4 + 3f_3 + 2f_2 + 1f_1}{f_4 + f_3 + f_2 + f_1}$.
- Rounding: retain raw values, round half-up to 2 decimal places for display and range lookup.

## 15. Included extensions and excluded work

- **Included**: Next.js App Router, Convex reactive backend, UI/UX-promax dark mode design system, separate authenticated teacher/student routes, optional email login, student calendar, OpenCV QR scanner, multi-laptop requests, and teacher custody confirmation.
- **Excluded**: Non-laptop equipment, non-SPICT or Senior High School borrowers, multi-school tenancy, additional roles, fine/repair-fee payment gateways, long-term repair scheduling, and device surveillance/biometrics.

## 16. MVP implementation phases

### Phase 0 — Inspect and initialize Next.js + Convex foundation
- [ ] Verify existing Next.js and Convex setup (`package.json`, `convex/`, `app/`).
- [ ] Configure TailwindCSS v4 with the **UI/UX-promax** design system (dark mode, palette: Blue, white, gray, accent: blue).
- [ ] Define the complete schema in `convex/schema.ts` with all required tables, fields, and indexes.
- [ ] Verify OpenCV.js / camera QR scanner decoding on a mobile browser or target viewport.

### Phase 1 — Accounts and authorized areas
- [ ] Implement Convex session management and password hashing for Teacher and Student logins.
- [ ] Implement `app/teacher/login` and `app/student/login` with UI/UX-promax styling.
- [ ] Enforce SPICT Grade 7–10 validation on student profile creation.
- [ ] Implement short-lived LRN/password verification for critical student actions.
- [ ] Implement protected role-based layouts in Next.js App Router (`/teacher/*` and `/student/*`).

### Phase 2 — Laptop inventory and QR
- [ ] Implement `laptops` Convex mutations and queries (`create`, `update`, `retire`, `list`).
- [ ] Create printable QR stickers page (`app/teacher/inventory/labels`) with high-contrast asset codes.
- [ ] Build camera scanner component (`app/student/scan`) with manual asset-code fallback.
- [ ] Handle scanner error states and duplicate scan prevention.

### Phase 3 — Borrow and return logging
- [ ] Implement borrow request submission, teacher approval/rejection, and due-time selection.
- [ ] Implement atomic `releaseTransaction` mutation in Convex (transaction header, loan lines, laptop status, request fulfillment).
- [ ] Implement student return submission and teacher-confirmed return mutation in Convex.
- [ ] Handle partial returns, damaged laptop status flags, and competing request cancellation.

### Phase 4 — Dashboards, calendar, logbook, and evaluation support
- [ ] Build teacher dashboard with real-time inventory counts and overdue alerts.
- [ ] Build student dashboard and calendar showing current outstanding loans by due date.
- [ ] Implement searchable operational logbook with CSV export for teachers.
- [ ] Implement separate de-identified research metrics export.
- [ ] Provide evaluation CSV templates and TypeScript evaluation script implementing the 4-point weighted mean.

### Phase 5 — Verify and hand off
- [ ] Execute section 17 acceptance scenarios across both roles.
- [ ] Verify Next.js build (`npm run build`) and TypeScript typecheck (`npm run typecheck`).
- [ ] Verify mobile responsiveness, dark mode contrast, and camera scanner UX.
- [ ] Document setup instructions in README and `.env.example`.

## 17. Acceptance scenarios

| ID | Scenario | Expected result |
| --- | --- | --- |
| SCOPE-01 | Try enrolling a non-SPICT, Grade 11, or other-school borrower | Rejected by Convex backend validation. |
| SCOPE-02 | Try creating a projector or other equipment category | Rejected; laptop-only schema and validation enforced. |
| AUTH-01 | Teacher signs in with email/password | Receives teacher session token and redirected to teacher dashboard. |
| AUTH-02 | Student signs in with LRN/password (no email) | Receives student session token and access granted. |
| AUTH-03 | Student signs in using email alias | Maps to same student identity and borrowing history. |
| AUTH-04 | Student directly invokes teacher Convex mutation/query | Rejected with authorization error; no data leaked. |
| AUTH-05 | Deactivate a student account | Active sessions terminated; pending requests cancelled; outstanding returns can still be received. |
| AUTH-06 | Student submits borrow/return without recent LRN/password verification | Action blocked until short-lived action verification token is acquired. |
| INV-01 | Concurrent duplicate asset code or QR token creation | Rejected by Convex uniqueness validation; exactly one record succeeds. |
| QR-01 | Scan printed laptop QR label on smartphone | Laptop identified; asset code and availability displayed in cart. |
| QR-02 | Scan same laptop twice or invalid QR | Duplicate scan ignored; invalid token safely rejected. |
| REQ-01 | Student submits request for 2 laptops | Request created with derived quantity of 2 and 2 distinct laptop IDs. |
| REQ-02 | Teacher approves request | Request status set to APPROVED with due time; laptops remain AVAILABLE until issue. |
| ISSUE-01 | Teacher releases approved laptops | Atomic mutation creates transaction, 2 loan lines, marks laptops BORROWED, and fulfills request. |
| ISSUE-02 | One laptop becomes unavailable before release | Entire release mutation aborts; zero loan lines created. |
| ISSUE-03 | Concurrent releases for same laptop | Convex OCC ensures exactly one release succeeds; other fails cleanly. |
| ISSUE-04 | Competing requests overlap issued laptop | Overlapping pending requests are automatically cancelled with availability reason. |
| RET-01 | Student submits return request | Return submission recorded; laptops remain BORROWED until teacher confirms. |
| RET-02 | Teacher confirms receipt of 1 of 2 laptops | 1 line marked RETURNED; laptop AVAILABLE; transaction PARTIALLY_RETURNED; remaining laptop stays on student calendar. |
| RET-03 | Teacher confirms receipt of final laptop | Transaction marked CLOSED; all laptops restored to inventory. |
| RET-04 | Teacher receives damaged laptop | Loan line closed; laptop condition set to DAMAGED and availability UNAVAILABLE. |
| RET-05 | Teacher receives laptop from inactive student | Exception receipt permitted with recorded teacher ID and note. |
| CONV-01 | Real-time dashboard update | Laptop release immediately updates teacher dashboard counts via Convex subscription without page reload. |
| CONV-02 | Bounded queries and pagination | Queries use `.take(n)` or pagination to prevent memory/performance issues. |
| TIME-01 | Server time exceeds due date | Active loan line dynamically displays as overdue without manual status updates. |
| CAL-01 | Student checks calendar | Only currently outstanding laptops appear on their due dates. |
| LOG-01 | Teacher exports operational logbook | CSV download contains full identifiable data (LRN, name, asset codes, timestamps). |
| PRIV-01 | Teacher exports research metrics | CSV download contains de-identified data (no names, LRNs, or credentials). |
| EVAL-01 | Synthetic survey evaluation test | 4 responses (4, 4, 3, 1) yield weighted mean 3.00, verbal interpretation "Acceptable". |
| UI-01 | Responsive mobile & keyboard use | Clean UI/UX-promax dark mode theme, visible focus, blue accent elements, and accessible forms. |

## 18. Definition of done and handoff

The coding agent must deliver:

1. Functional Next.js + Convex codebase adhering to the **UI/UX-promax** design system (Blue, white, gray, dark mode, blue accent).
2. Complete `convex/schema.ts` and type-safe server functions for users, laptops, requests, transactions, and logs.
3. Client-side QR scanner and printable QR labels.
4. Operational logbook CSV export and separate de-identified research metrics export.
5. Evaluation templates and TypeScript analysis script implementing Chapter II weighted mean formulas.
6. Acceptance scenarios verified with clear evidence.

## 19. Technical references

- [Convex Documentation](https://docs.convex.dev) — Convex server functions, schemas, queries/mutations, indexes, and reactive subscriptions.
- [Next.js App Router Documentation](https://nextjs.org/docs/app) — Server/Client components, layouts, routing, and optimization.
- [OpenCV.js Documentation](https://docs.opencv.org/4.x/d4/da1/tutorial_js_setup.html) — Client-side computer vision and barcode detection.
- [TailwindCSS v4 Documentation](https://tailwindcss.com/docs) — Modern CSS styling and dark mode configuration.

## 20. Copyable prompt for the implementing agent

> Read version 3.0 of `asd.md` and repository instructions, then implement the MVP phases for LogTap at FMNHS. Stack mandate: Next.js 16 (App Router, React 19, TypeScript, TailwindCSS v4) with Convex (`^1.44.0`) backend (`convex/`). Adhere to the UI/UX-promax design system: dark mode, Blue, white, gray palette with blue accent. Restrict inventory to laptops and borrowers to SPICT Grades 7–10. Implement separate authenticated teacher and student routes, mandatory LRN/password student login (with optional email alias), teacher-provisioned student accounts, OpenCV smartphone QR scanning with manual asset code fallback, multi-laptop borrowing transactions with explicit quantity tracking, atomic release/return mutations in Convex, student calendar, teacher logbook CSV export, de-identified research exports, and evaluation math utility. Test the acceptance scenarios and verify typecheck passes before declaring completion. Do not add excluded equipment, grades, maintenance/financial modules, or production deployment.
