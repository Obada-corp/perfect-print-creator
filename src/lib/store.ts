import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ============================================================
 * Bases (المقرات) — admin-managed
 * ========================================================== */

export interface BaseItem {
  id: string;
  code: string;
  name: string;
  createdAt: number;
}

export const DEFAULT_BASES: { code: string; name: string }[] = [
  { code: "M", name: "المقر الرئيسي - طلاب" },
  { code: "F", name: "المقر الرئيسي - طالبات" },
  { code: "RM", name: "مقر الرس - طلاب" },
  { code: "RF", name: "مقر الرس - طالبات" },
];

/** Backward-compat string union ALIAS — now just a plain string. */
export type Base = string;

export type Rank = "معيد" | "محاضر" | "أستاذ مساعد" | "أستاذ مشارك" | "أستاذ";
export const RANKS: Rank[] = ["معيد", "محاضر", "أستاذ مساعد", "أستاذ مشارك", "أستاذ"];

export const PERIODS = ["الأولى", "الثانية", "الثالثة", "الرابعة"] as const;
export const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"] as const;
export const EXAM_TYPES = ["رئيسي", "بديل"] as const;

/* ============================================================
 * Receipt stages (الاستلام والتسليم) — 3-stage workflow
 * ========================================================== */

export type ReceiptStage = "teacherPickup" | "teacherReturn" | "archiveReceipt";

export const RECEIPT_STAGES: { key: ReceiptStage; label: string; short: string }[] = [
  { key: "teacherPickup", label: "الاستلام من المدرس", short: "استلام من المدرس" },
  { key: "teacherReturn", label: "تسليم المدرس", short: "تسليم للمدرس" },
  { key: "archiveReceipt", label: "الاستلام الأرشفي", short: "استلام أرشفي" },
];

export interface ReceiptRecord {
  checked: boolean;
  date: string;
  supervisor: string; // المشرف
}

const emptyReceipt = (): ReceiptRecord => ({ checked: false, date: "", supervisor: "" });

/* ============================================================
 * Entities
 * ========================================================== */

export interface Member {
  id: string;
  universityId: string; // الرقم الجامعي — primary stable reference
  name: string;
  base: Base;
  rank: Rank;
  mobile: string;
  extension: string;
  email: string;
  department?: string;
  createdAt: number;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  createdAt: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  teachers: string[];
  coordinator: string;
  department?: string;
  createdAt: number;
}

export const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

export function dayFromDate(iso: string): (typeof DAYS)[number] | "" {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "";
  const name = ARABIC_DAYS[d.getDay()];
  return (DAYS as readonly string[]).includes(name) ? (name as (typeof DAYS)[number]) : "";
}

export interface DailyEntry {
  id: string;
  order: number;
  courseCode: string;
  groupNo: string;
  courseName: string;
  teacher: string;
  coordinator: string;
  coordinatorMobile: string;
  hall: string;
  period: (typeof PERIODS)[number] | "";
  studentsCount: number | "";
  monitor1: string;
  monitor2: string;
  monitor3: string;
  date: string;
  day: (typeof DAYS)[number] | "";
  examType: (typeof EXAM_TYPES)[number] | "";
  base: Base | "";
  department: string;
  notes: string;
  papersBefore: number | "";
  papersAfter: number | "";
  envelopeNum: number | "";
  envelopeTotal: number | "";
  classCode: string;
  receipts: Record<ReceiptStage, ReceiptRecord>;
  createdAt: number;
}

export type Permission =
  | "view_dashboard"
  | "manage_members"
  | "manage_courses"
  | "manage_departments"
  | "manage_bases"
  | "manage_daily"
  | "manage_functions"
  | "manage_admins"
  | "manage_settings";

export const ALL_PERMISSIONS: { key: Permission; label: string }[] = [
  { key: "view_dashboard", label: "عرض لوحة التحكم" },
  { key: "manage_members", label: "إدارة الأعضاء" },
  { key: "manage_departments", label: "إدارة الأقسام" },
  { key: "manage_bases", label: "إدارة المقرات" },
  { key: "manage_courses", label: "إدارة المقررات" },
  { key: "manage_daily", label: "إدخال البيانات اليومية" },
  { key: "manage_functions", label: "الوصول للوظائف والملصقات" },
  { key: "manage_admins", label: "إدارة المشرفين" },
  { key: "manage_settings", label: "تعديل الإعدادات" },
];

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  password: string;
  isSupreme: boolean;
  permissions: Permission[];
  createdAt: number;
}

export interface Settings {
  collegeName: string;
  unitName: string;
  controlNumber: string;
  semester: string;
  academicYear: string;
  examSession: string;
  theme: "light" | "dark";
}

interface AppState {
  members: Member[];
  departments: Department[];
  bases: BaseItem[];
  courses: Course[];
  daily: DailyEntry[];
  admins: AdminUser[];
  settings: Settings;
  currentUserId: string | null;
  hasHydrated: boolean;

  login: (username: string, password: string) => AdminUser | null;
  logout: () => void;

  addMember: (m: Omit<Member, "id" | "createdAt">) => void;
  updateMember: (id: string, m: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  addDepartment: (d: Omit<Department, "id" | "createdAt">) => void;
  updateDepartment: (id: string, d: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  addBase: (b: Omit<BaseItem, "id" | "createdAt">) => void;
  updateBase: (id: string, b: Partial<BaseItem>) => void;
  deleteBase: (id: string) => void;

  addCourse: (c: Omit<Course, "id" | "createdAt">) => void;
  updateCourse: (id: string, c: Partial<Course>) => void;
  deleteCourse: (id: string) => void;

  addDaily: (d: Omit<DailyEntry, "id" | "createdAt">) => void;
  updateDaily: (id: string, d: Partial<DailyEntry>) => void;
  deleteDaily: (id: string) => void;

  addAdmin: (a: Omit<AdminUser, "id" | "createdAt" | "isSupreme">) => void;
  updateAdmin: (id: string, a: Partial<AdminUser>) => void;
  deleteAdmin: (id: string) => void;

  updateSettings: (s: Partial<Settings>) => void;
  setHydrated: () => void;
}

const SUPREME_ID = "supreme-admin";
const supreme: AdminUser = {
  id: SUPREME_ID,
  name: "Alaaeddin Moussa",
  username: "Alaaeddin Moussa",
  password: "2736",
  isSupreme: true,
  permissions: ALL_PERMISSIONS.map((p) => p.key),
  createdAt: Date.now(),
};

const uid = () => Math.random().toString(36).slice(2, 11);

const defaultDailyFields = (): Partial<DailyEntry> => ({
  department: "",
  notes: "",
  papersBefore: "",
  papersAfter: "",
  envelopeNum: "",
  envelopeTotal: "",
  classCode: "",
  receipts: {
    teacherPickup: emptyReceipt(),
    teacherReturn: emptyReceipt(),
    archiveReceipt: emptyReceipt(),
  },
});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      members: [],
      departments: [],
      bases: DEFAULT_BASES.map((b) => ({ ...b, id: uid(), createdAt: Date.now() })),
      courses: [],
      daily: [],
      admins: [supreme],
      settings: {
        collegeName: "كلية الأعمال والاقتصاد",
        unitName: "لجنة الامتحانات العامة",
        controlNumber: "472",
        semester: "الصيفي",
        academicYear: "١٤٤٧/١٤٤٨",
        examSession: "النهائية",
        theme: "light",
      },
      currentUserId: null,
      hasHydrated: false,

      login: (username, password) => {
        const user = get().admins.find(
          (a) => a.username.trim() === username.trim() && a.password === password,
        );
        if (user) {
          set({ currentUserId: user.id });
          return user;
        }
        return null;
      },
      logout: () => set({ currentUserId: null }),

      addMember: (m) =>
        set((s) => ({
          members: [
            ...s.members,
            { ...m, universityId: (m.universityId || "").trim(), id: uid(), createdAt: Date.now() },
          ],
        })),
      updateMember: (id, m) =>
        set((s) => {
          const prev = s.members.find((x) => x.id === id);
          const oldName = prev?.name;
          const newName = (m.name ?? oldName)?.trim();
          const renamed = oldName && newName && oldName !== newName;
          return {
            members: s.members.map((x) => (x.id === id ? { ...x, ...m, name: newName ?? x.name } : x)),
            ...(renamed
              ? {
                  daily: s.daily.map((d) => ({
                    ...d,
                    teacher: d.teacher === oldName ? newName! : d.teacher,
                    coordinator: d.coordinator === oldName ? newName! : d.coordinator,
                    monitor1: d.monitor1 === oldName ? newName! : d.monitor1,
                    monitor2: d.monitor2 === oldName ? newName! : d.monitor2,
                    monitor3: d.monitor3 === oldName ? newName! : d.monitor3,
                  })),
                  courses: s.courses.map((c) => ({
                    ...c,
                    teachers: c.teachers.map((t) => (t === oldName ? newName! : t)),
                    coordinator: c.coordinator === oldName ? newName! : c.coordinator,
                  })),
                }
              : {}),
          };
        }),
      deleteMember: (id) =>
        set((s) => {
          const member = s.members.find((x) => x.id === id);
          const name = member?.name;
          return {
            members: s.members.filter((x) => x.id !== id),
            ...(name
              ? {
                  daily: s.daily.map((d) => ({
                    ...d,
                    teacher: d.teacher === name ? "" : d.teacher,
                    coordinator: d.coordinator === name ? "" : d.coordinator,
                    monitor1: d.monitor1 === name ? "" : d.monitor1,
                    monitor2: d.monitor2 === name ? "" : d.monitor2,
                    monitor3: d.monitor3 === name ? "" : d.monitor3,
                  })),
                  courses: s.courses.map((c) => ({
                    ...c,
                    teachers: c.teachers.filter((t) => t !== name),
                    coordinator: c.coordinator === name ? "" : c.coordinator,
                  })),
                }
              : {}),
          };
        }),

      addDepartment: (d) =>
        set((s) => ({ departments: [...s.departments, { ...d, id: uid(), createdAt: Date.now() }] })),
      updateDepartment: (id, d) =>
        set((s) => {
          const prev = s.departments.find((x) => x.id === id);
          const oldCode = prev?.code;
          const newCode = (d.code ?? oldCode)?.trim();
          const recoded = oldCode && newCode && oldCode !== newCode;
          return {
            departments: s.departments.map((x) => (x.id === id ? { ...x, ...d, code: newCode ?? x.code } : x)),
            ...(recoded
              ? {
                  courses: s.courses.map((c) => (c.department === oldCode ? { ...c, department: newCode! } : c)),
                  members: s.members.map((m) => (m.department === oldCode ? { ...m, department: newCode! } : m)),
                  daily: s.daily.map((dd) => (dd.department === oldCode ? { ...dd, department: newCode! } : dd)),
                }
              : {}),
          };
        }),
      deleteDepartment: (id) =>
        set((s) => {
          const dept = s.departments.find((x) => x.id === id);
          const code = dept?.code;
          return {
            departments: s.departments.filter((x) => x.id !== id),
            ...(code
              ? {
                  courses: s.courses.map((c) => (c.department === code ? { ...c, department: "" } : c)),
                  members: s.members.map((m) => (m.department === code ? { ...m, department: "" } : m)),
                  daily: s.daily.map((dd) => (dd.department === code ? { ...dd, department: "" } : dd)),
                }
              : {}),
          };
        }),

      addBase: (b) =>
        set((s) => ({ bases: [...s.bases, { ...b, id: uid(), createdAt: Date.now() }] })),
      updateBase: (id, b) =>
        set((s) => {
          const prev = s.bases.find((x) => x.id === id);
          const oldName = prev?.name;
          const newName = (b.name ?? oldName)?.trim();
          const renamed = oldName && newName && oldName !== newName;
          return {
            bases: s.bases.map((x) => (x.id === id ? { ...x, ...b, name: newName ?? x.name } : x)),
            ...(renamed
              ? {
                  members: s.members.map((m) => (m.base === oldName ? { ...m, base: newName! } : m)),
                  daily: s.daily.map((d) => (d.base === oldName ? { ...d, base: newName! } : d)),
                }
              : {}),
          };
        }),
      deleteBase: (id) =>
        set((s) => {
          const base = s.bases.find((x) => x.id === id);
          const name = base?.name;
          return {
            bases: s.bases.filter((x) => x.id !== id),
            ...(name
              ? {
                  members: s.members.map((m) => (m.base === name ? { ...m, base: "" } : m)),
                  daily: s.daily.map((d) => (d.base === name ? { ...d, base: "" } : d)),
                }
              : {}),
          };
        }),

      addCourse: (c) =>
        set((s) => ({ courses: [...s.courses, { ...c, id: uid(), createdAt: Date.now() }] })),
      updateCourse: (id, c) =>
        set((s) => {
          const prev = s.courses.find((x) => x.id === id);
          const oldCode = prev?.code;
          const newCode = (c.code ?? oldCode)?.trim();
          const newName = c.name ?? prev?.name;
          const newDept = c.department ?? prev?.department;
          const recoded = oldCode && newCode && oldCode !== newCode;
          return {
            courses: s.courses.map((x) => (x.id === id ? { ...x, ...c, code: newCode ?? x.code } : x)),
            daily: s.daily.map((d) =>
              d.courseCode === oldCode
                ? {
                    ...d,
                    courseCode: recoded ? newCode! : d.courseCode,
                    courseName: newName ?? d.courseName,
                    department: newDept ?? d.department,
                  }
                : d,
            ),
          };
        }),
      deleteCourse: (id) =>
        set((s) => {
          const course = s.courses.find((x) => x.id === id);
          const code = course?.code;
          return {
            courses: s.courses.filter((x) => x.id !== id),
            ...(code
              ? {
                  daily: s.daily.map((d) =>
                    d.courseCode === code ? { ...d, courseCode: "", courseName: "" } : d,
                  ),
                }
              : {}),
          };
        }),

      addDaily: (d) =>
        set((s) => ({
          daily: [
            ...s.daily,
            { ...defaultDailyFields(), ...d, id: uid(), createdAt: Date.now() } as DailyEntry,
          ],
        })),
      updateDaily: (id, d) =>
        set((s) => ({ daily: s.daily.map((x) => (x.id === id ? { ...x, ...d } : x)) })),
      deleteDaily: (id) => set((s) => ({ daily: s.daily.filter((x) => x.id !== id) })),

      addAdmin: (a) =>
        set((s) => ({
          admins: [
            ...s.admins,
            { ...a, id: uid(), isSupreme: false, createdAt: Date.now() },
          ],
        })),
      updateAdmin: (id, a) =>
        set((s) => ({
          admins: s.admins.map((x) => (x.id === id ? { ...x, ...a, isSupreme: x.isSupreme } : x)),
        })),
      deleteAdmin: (id) =>
        set((s) => ({ admins: s.admins.filter((x) => x.id !== id || x.isSupreme) })),

      updateSettings: (s2) => set((s) => ({ settings: { ...s.settings, ...s2 } })),
      setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: "control-platform-v1",
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.admins.some((a) => a.isSupreme)) {
            state.admins = [supreme, ...state.admins];
          }
          state.departments = state.departments ?? [];
          // Bases — seed defaults on first load
          if (!Array.isArray(state.bases) || state.bases.length === 0) {
            state.bases = DEFAULT_BASES.map((b) => ({ ...b, id: uid(), createdAt: Date.now() }));
          }
          // Members — ensure universityId
          state.members = (state.members ?? []).map((m) => ({
            ...m,
            universityId: (m as Member).universityId ?? "",
          }));
          state.courses = (state.courses ?? []).map((c) => ({
            ...c,
            teachers: Array.isArray(c.teachers) ? c.teachers : [],
            coordinator: c.coordinator ?? "",
            department: c.department ?? "",
          }));
          // Daily — migrate legacy received/delivered flags to receipts{}
          state.daily = (state.daily ?? []).map((d) => {
            const merged = { ...(defaultDailyFields() as DailyEntry), ...d } as DailyEntry;
            const legacy = d as unknown as {
              receivedChecked?: boolean;
              receivedDate?: string;
              receivedBy?: string;
              deliveredChecked?: boolean;
              deliveredDate?: string;
              deliveredBy?: string;
            };
            if (!merged.receipts) {
              merged.receipts = {
                teacherPickup: emptyReceipt(),
                teacherReturn: emptyReceipt(),
                archiveReceipt: emptyReceipt(),
              };
            }
            if (legacy.receivedChecked && !merged.receipts.teacherPickup.checked) {
              merged.receipts.teacherPickup = {
                checked: true,
                date: legacy.receivedDate ?? "",
                supervisor: legacy.receivedBy ?? "",
              };
            }
            if (legacy.deliveredChecked && !merged.receipts.teacherReturn.checked) {
              merged.receipts.teacherReturn = {
                checked: true,
                date: legacy.deliveredDate ?? "",
                supervisor: legacy.deliveredBy ?? "",
              };
            }
            return merged;
          });
          state.settings = {
            ...{ examSession: "النهائية" },
            ...state.settings,
          } as Settings;
          state.setHydrated();
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", state.settings.theme === "dark");
          }
        }
      },
    },
  ),
);

export const useCurrentUser = () => {
  const id = useStore((s) => s.currentUserId);
  const admins = useStore((s) => s.admins);
  return admins.find((a) => a.id === id) || null;
};

/** Permission check hook — true for supreme. */
export function usePermission(perm?: Permission): boolean {
  const user = useCurrentUser();
  if (!user) return false;
  if (user.isSupreme) return true;
  if (!perm) return true;
  return user.permissions.includes(perm);
}

/** Returns a `can(perm)` function. */
export function usePermissions() {
  const user = useCurrentUser();
  return (perm?: Permission) => {
    if (!user) return false;
    if (user.isSupreme) return true;
    if (!perm) return true;
    return user.permissions.includes(perm);
  };
}

/** Resolve base code (e.g. "M") from a base name. */
export function useBaseCode() {
  const bases = useStore((s) => s.bases);
  return (name: string) => bases.find((b) => b.name === name)?.code ?? name;
}
