# LogTap — FMNHS Automated Laptop Monitoring System

LogTap is an automated laptop monitoring and custody system designed for **Fort Magsaysay National High School (FMNHS)** serving the **Special Program in ICT (SPICT)** computer laboratory.

Built with **Next.js 16 (App Router, React 19, TypeScript, TailwindCSS v4)** and **Convex (`^1.44.0`)** reactive backend, following the mandatory **UI/UX-promax** design system.

---

## 🚀 Key Features

1. **Two-Role Authentication & Access Control**:
   - **Teacher Portal**: Inventory management, student account enrollment, request reviews, custody release, return reception, and logbook exports.
   - **Student Portal**: LRN (Learner Reference Number) login with leading-zero preservation, camera QR scanning, multi-laptop selection, personal loan due calendar.
2. **Distinct Multi-Laptop Quantity Tracking**:
   - Explicit recording of requested, borrowed, returned, and outstanding laptop quantities.
   - Full support for partial returns.
3. **QR Detection & Printable Sticker Sheets**:
   - In-browser camera scanning (`jsQR` / HTML5 canvas) with manual asset-code fallback.
   - Printable QR label sheets (`/teacher/inventory/labels`) formatted for sticker paper.
4. **ACID Transactional Consistency**:
   - Physical issue and return operations run as atomic Convex mutations with zero risk of partial state or double-borrowing.
5. **Research Evaluation Methodology (Chapter II)**:
   - 4-point Likert scale analysis utility (`scripts/evaluate.ts`) calculating frequencies, percentages, weighted means, and verbal interpretations.
   - Separation of identifiable operational logs from de-identified research metric exports.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: TailwindCSS v4, UI/UX-promax design system (dark mode, palette: Blue, white, gray, accent: blue)
- **Backend & Database**: Convex (`^1.44.0`) — reactive queries, transactional mutations, indexed schema
- **QR Scanning**: `jsQR` client-side canvas barcode detection
- **QR Generation**: `qrcode` SVG/Canvas generator

---

## 👥 Demo Accounts (Seed Data)

Click **"Seed Initial FMNHS Data"** on the landing page (`/`) to populate sample records:

| Role | Name | Email / LRN | Password | Cohort |
| :--- | :--- | :--- | :--- | :--- |
| **Teacher** | Mr. Juan Dela Cruz | `teacher@fmnhs.edu.ph` | `Password123!` | ICT Lab Custodian |
| **Student** | Zyrine Amber Titan | `105580160009` | `Password123!` | Grade 7 - Cybernauts |
| **Student** | Maria Ramos | `109283746502` | `Password123!` | Grade 8 - Python |
| **Student** | Carl Mendoza | `109283746503` | `Password123!` | Grade 9 - Azure |
| **Student** | Bea Dela Torre | `109283746504` | `Password123!` | Grade 10 - AI |

Students may also sign in with their email alias (`user@example.com` maps to Zyrine Amber Titan).

---

## 💻 Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run both Convex and Next.js**:
   ```bash
   npm run dev
   ```

3. **Run Typecheck**:
   ```bash
   npm run typecheck
   ```

4. **Run Lint**:
   ```bash
   npm run lint
   ```

5. **Run Unit Tests** (Convex server functions + domain logic + React components):
   ```bash
   npm test
   ```

6. **Run Research Evaluation Analysis**:
   ```bash
   npx tsx scripts/evaluate.ts
   ```

---

## 🧪 Testing

The test suite uses **Vitest** with two projects:

| Project | Environment | Scope |
| :--- | :--- | :--- |
| `convex` | `@edge-runtime/vm` + `convex-test` | Real Convex mutations/queries run in-memory — auth, sessions, inventory, requests, atomic release/return, dashboards, exports |
| `app` | `jsdom` + Testing Library | Pure domain logic (`convex/domain.ts`), evaluation math, and React components (Navbar, AuthContext, ActionConfirmModal) |

Tests cover the asd.md §17 acceptance scenarios: `AUTH-*`, `SCOPE-*`, `INV-01`, `QR-01/02`,
`REQ-*`, `ISSUE-*`, `RET-*`, `TIME-01`, `CAL-01`, `LOG-01`, `PRIV-01`, and `EVAL-01`.

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Shared business rules (loan-state derivation, Manila calendar math, issuance rules,
LRN validation, weighted-mean formulas, CSV escaping) live in
[`convex/domain.ts`](convex/domain.ts) and are imported by Convex functions, the
frontend, the evaluation script, and the tests.
