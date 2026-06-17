# Redesign + Feature Updates

This is a large multi-part change. I'll group it into 4 phases and implement them in order.

## Phase 1 — Branding & Visual Polish
- Rename **نظام إدارة الكنترول** → **لجنة الامتحانات العامة** everywhere (AppShell title, page titles, auth page, PDF headers, dashboard).
- Tone down triangle patterns:
  - Remove dense overlays from sidebar/headers/auth panel.
  - Keep triangles only as: (a) subtle footer band, (b) small corner accents on hero cards, (c) faint watermark behind auth logo.
- Replace auth page bullets (`حماية متقدمة / صلاحيات دقيقة / أتمتة كاملة / ملصقات بضغطة`) with a **modern feature grid** listing real features: إدارة الأعضاء، إدارة المقررات والأقسام، جدولة الامتحانات اليومية، توليد ملصقات المظاريف والأرشفة، جداول مراقبة الأعضاء، تتبع الاستلام والتسليم، صلاحيات متعددة المستويات، تقارير وإحصاءات لحظية — each as a card with icon + short description.

## Phase 2 — Dashboard Redesign
- Brand hero with greeting, current semester/year, quick stats.
- KPI row: عدد الامتحانات اليوم، الأعضاء، المقررات، الأقسام، نسبة الاستلام، تنبيهات التعارض.
- Shortcuts grid (8 tiles) to common actions: إضافة امتحان، إضافة عضو، إضافة مقرر، توليد ملصقات، جداول المراقبة، الأرشفة، الإعدادات، المشرفون.
- Summary widgets: أحدث الامتحانات، تعارضات نشطة، الاستلام المتأخر، توزيع الامتحانات على المقرات (simple bars).
- **Role-aware dashboard**: read current admin permissions; hide shortcuts/widgets the user can't access. If permissions are narrow, show a focused dashboard with only allowed items.

## Phase 3 — Data Model & Feature Changes

### Receipt states (3 instead of 2)
Change `حالات الاستلام` from `{received, delivered}` pair to three stages:
1. **الاستلام من المدرس** (`teacherPickup`)
2. **تسليم المدرس** (`teacherReturn`)
3. **الاستلام الأرشفي** (`archiveReceipt`)

Each stage stores `{ checked, date, supervisor, by }`. Enforce: cannot mark `checked` without `supervisor` AND `date` — show warning toast and prevent toggle. Migrate older entries gracefully (map old `received`→teacherPickup, `delivered`→teacherReturn).

### Members
- Add **الرقم الجامعي** (`universityId`) field — becomes the immutable primary reference. Internal `id` stays; scheduling references switch to `universityId` so renaming/editing other fields doesn't break links.
- Add filters: department, base, search.
- Update CrudTable to support filter bar.

### Bases (المقرات)
- Remove hard-coded bases from `store.ts`.
- Add new admin section `/data/bases` with CRUD (code + name). System still treats them the same (code is the join key, exactly like departments).
- Update all consumers (members, daily entry, stickers) to read from `bases` store instead of constant. Seed with the current 4 on first run so existing data keeps working.

### Daily Entry
- Add warning when `paperCount` < `studentCount` (non-blocking).
- Auto-fill `classCode` (already done, verify).
- Filters bar on `/data/daily`: by date range, department, course, base, exam type, conflicts only.

### Monitor schedule (جدول مراقبة الأعضاء)
- Add per-row eye toggle to hide room (shows `••••`).
- Add global "Hide all rooms" toggle (like hiding bank balance) — affects view + print.

### Auth
- Show error message on invalid login (currently silent).

### Back button
- Add a small back button in `PageHeader` on every non-dashboard page (`router.history.back()`).

## Phase 4 — Files Touched (Technical)
- `src/lib/store.ts` — new receipt schema, `universityId`, `bases` collection, `EXAM_TYPES` already done, role-permission helper, migration on load.
- `src/components/AppShell.tsx` — rename, tone down triangles, role-aware nav.
- `src/components/ui/PageHeader.tsx` — back button, simplified triangle accent.
- `src/routes/auth.tsx` — rename, feature grid, error message, lighter pattern.
- `src/routes/_app.dashboard.tsx` — full redesign, role-aware.
- `src/routes/_app.data.members.tsx` — filters, universityId.
- `src/routes/_app.data.daily.tsx` — filters, warning, 3-state receipt UI.
- `src/components/DailyEntryForm.tsx` — paperCount warning, supervisor+date enforcement.
- `src/routes/_app.data.bases.tsx` — **new** route for bases CRUD.
- `src/routes/_app.functions.monitors.tsx` — hide-room toggles.
- `src/routes/_app.functions.envelopes.tsx`, `_app.functions.archive.tsx`, `src/components/stickers/Stickers.tsx`, `src/lib/pdf.tsx` — use dynamic bases + new naming.
- `src/styles.css` — restrained pattern utilities, footer band only.

## Notes / Trade-offs
- Receipt-state migration: I'll keep old fields readable but write the new ones. Existing entries' `received/delivered` map to `teacherPickup/teacherReturn`; `archiveReceipt` starts empty.
- Role-aware dashboard reads from existing admin/permissions store; if no permission system is fully wired, I'll add a minimal `usePermissions()` hook returning allowed sections so dashboard can branch.
- The bases section preserves the 4 existing codes (M, F, RM, RF) as seed so reports/stickers don't break.

Approve and I'll implement all phases.