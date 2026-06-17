import { useEffect, useMemo, useState } from "react";
import {
  useStore,
  PERIODS,
  EXAM_TYPES,
  RECEIPT_STAGES,
  dayFromDate,
  type DailyEntry,
  type ReceiptRecord,
  type ReceiptStage,
} from "@/lib/store";
import { toast } from "sonner";
import { AlertTriangle, Check, X } from "lucide-react";

type FormState = Omit<DailyEntry, "id" | "createdAt" | "order">;

const emptyReceipt = (): ReceiptRecord => ({ checked: false, date: "", supervisor: "" });

const empty: FormState = {
  courseCode: "",
  groupNo: "",
  courseName: "",
  teacher: "",
  coordinator: "",
  coordinatorMobile: "",
  hall: "",
  period: "",
  studentsCount: "",
  monitor1: "",
  monitor2: "",
  monitor3: "",
  date: "",
  day: "",
  examType: "",
  base: "",
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
};

export function DailyEntryForm({
  initial,
  excludeId,
  onCancel,
  onSubmit,
}: {
  initial?: DailyEntry | null;
  excludeId?: string;
  onCancel: () => void;
  onSubmit: (v: FormState) => void;
}) {
  const courses = useStore((s) => s.courses);
  const members = useStore((s) => s.members);
  const departments = useStore((s) => s.departments);
  const bases = useStore((s) => s.bases);
  const admins = useStore((s) => s.admins);
  const daily = useStore((s) => s.daily);
  const settings = useStore((s) => s.settings);

  const [v, setV] = useState<FormState>(() => {
    const base = initial ? { ...empty, ...initial } : { ...empty };
    // ensure receipts object is complete
    base.receipts = {
      teacherPickup: { ...emptyReceipt(), ...(base.receipts?.teacherPickup || {}) },
      teacherReturn: { ...emptyReceipt(), ...(base.receipts?.teacherReturn || {}) },
      archiveReceipt: { ...emptyReceipt(), ...(base.receipts?.archiveReceipt || {}) },
    };
    if (!base.classCode && settings.controlNumber) base.classCode = settings.controlNumber;
    return base;
  });

  const set = <K extends keyof FormState>(k: K, val: FormState[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const setReceipt = (stage: ReceiptStage, patch: Partial<ReceiptRecord>) =>
    setV((s) => ({
      ...s,
      receipts: { ...s.receipts, [stage]: { ...s.receipts[stage], ...patch } },
    }));

  const coursesForTeacher = useMemo(
    () => (v.teacher ? courses.filter((c) => c.teachers.includes(v.teacher)) : courses),
    [courses, v.teacher],
  );
  const teachersForCourse = useMemo(() => {
    const selected = courses.find((c) => c.code === v.courseCode);
    if (selected && selected.teachers.length > 0) return selected.teachers;
    return members.map((m) => m.name);
  }, [courses, members, v.courseCode]);

  useEffect(() => {
    if (!v.courseCode) return;
    const c = courses.find((x) => x.code === v.courseCode);
    if (!c) return;
    setV((s) => ({
      ...s,
      courseName: s.courseName || c.name,
      coordinator: s.coordinator || c.coordinator || s.coordinator,
      department: s.department || c.department || s.department,
      teacher:
        s.teacher && c.teachers.includes(s.teacher)
          ? s.teacher
          : c.teachers.length === 1
            ? c.teachers[0]
            : s.teacher,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.courseCode]);

  useEffect(() => {
    const d = dayFromDate(v.date);
    if (d && d !== v.day) set("day", d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.date]);

  useEffect(() => {
    if (!v.coordinator) return;
    const m = members.find((m) => m.name === v.coordinator);
    if (m && m.mobile && m.mobile !== v.coordinatorMobile) {
      set("coordinatorMobile", m.mobile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.coordinator]);

  useEffect(() => {
    if (!v.teacher || v.base) return;
    const m = members.find((m) => m.name === v.teacher);
    if (m) set("base", m.base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.teacher]);

  const busyMembersAtSlot = useMemo(() => {
    if (!v.date || !v.period) return new Set<string>();
    const busy = new Set<string>();
    daily.forEach((d) => {
      if (d.id === excludeId) return;
      if (d.date === v.date && d.period === v.period) {
        [d.teacher, d.monitor1, d.monitor2, d.monitor3].forEach((m) => m && busy.add(m));
      }
    });
    return busy;
  }, [daily, v.date, v.period, excludeId]);

  const hallConflict = useMemo(() => {
    if (!v.date || !v.period || !v.hall) return null;
    const found = daily.find(
      (d) =>
        d.id !== excludeId &&
        d.date === v.date &&
        d.period === v.period &&
        d.hall.trim().toLowerCase() === v.hall.trim().toLowerCase(),
    );
    return found || null;
  }, [daily, v.date, v.period, v.hall, excludeId]);

  const monitorOptions = (current: string, otherSelected: string[]) => {
    return members
      .map((m) => m.name)
      .filter((n) => {
        if (n === current) return true;
        if (n === v.teacher) return false;
        if (otherSelected.includes(n)) return false;
        if (busyMembersAtSlot.has(n)) return false;
        return true;
      });
  };

  const monitorWarning = (name: string) => {
    if (!name) return null;
    if (name === v.teacher) return "هذا العضو هو مدرس المقرر";
    if (busyMembersAtSlot.has(name) && !(initial && [initial.monitor1, initial.monitor2, initial.monitor3, initial.teacher].includes(name)))
      return "هذا العضو لديه مهمة أخرى في نفس الفترة";
    return null;
  };

  const dupesInForm = () => {
    const arr = [v.monitor1, v.monitor2, v.monitor3].filter(Boolean);
    return arr.length !== new Set(arr).size;
  };

  // Warning: papersBefore < studentsCount
  const papersWarning =
    v.papersBefore !== "" && v.studentsCount !== "" && Number(v.papersBefore) < Number(v.studentsCount)
      ? `عدد الأوراق (${v.papersBefore}) أقل من عدد الطلاب (${v.studentsCount}).`
      : null;

  const canSubmit =
    v.courseCode && v.hall && v.period && v.date && v.base && !dupesInForm();

  const adminNames = admins.map((a) => a.name);

  // Validate receipts: cannot be checked without supervisor and date
  const receiptValidation = (RECEIPT_STAGES as readonly { key: ReceiptStage; label: string }[])
    .map((s) => {
      const r = v.receipts[s.key];
      if (r.checked && (!r.date || !r.supervisor)) return s.label;
      return null;
    })
    .filter(Boolean) as string[];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) {
          toast.error("أكمل الحقول المطلوبة وأزل التكرارات");
          return;
        }
        if (receiptValidation.length > 0) {
          toast.error(`أدخل التاريخ والمشرف لكل خانة محددة: ${receiptValidation.join("، ")}`);
          return;
        }
        if (papersWarning) {
          toast.warning(papersWarning);
        }
        onSubmit({
          ...v,
          courseCode: v.courseCode.trim(),
          courseName:
            v.courseName ||
            courses.find((c) => c.code === v.courseCode)?.name ||
            "",
          studentsCount: v.studentsCount === "" ? "" : Number(v.studentsCount),
          papersBefore: v.papersBefore === "" ? "" : Number(v.papersBefore),
          papersAfter: v.papersAfter === "" ? "" : Number(v.papersAfter),
          envelopeNum: v.envelopeNum === "" ? "" : Number(v.envelopeNum),
          envelopeTotal: v.envelopeTotal === "" ? "" : Number(v.envelopeTotal),
        });
      }}
      className="space-y-5"
    >
      <Section title="بيانات المقرر">
        <Grid>
          <Field label="رمز المقرر" required>
            <select
              required
              value={v.courseCode}
              onChange={(e) => set("courseCode", e.target.value)}
              className={inputCls}
            >
              <option value="">— اختر —</option>
              {coursesForTeacher.map((c) => (
                <option key={c.id} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
            {v.teacher && coursesForTeacher.length === 0 && (
              <Hint kind="warn">لا توجد مقررات معينة لهذا المدرس. أضفه في صفحة المقررات.</Hint>
            )}
            {v.teacher && coursesForTeacher.length > 0 && coursesForTeacher.length < courses.length && (
              <Hint>تم تصفية {coursesForTeacher.length} مقرر مرتبط بـ {v.teacher}.</Hint>
            )}
          </Field>
          <Field label="اسم المقرر">
            <input value={v.courseName} onChange={(e) => set("courseName", e.target.value)} className={inputCls} placeholder="يُملأ تلقائياً" />
          </Field>
          <Field label="القسم">
            <select value={v.department} onChange={(e) => set("department", e.target.value)} className={inputCls}>
              <option value="">— اختر —</option>
              {departments.map((d) => <option key={d.id} value={d.code}>{d.code} — {d.name}</option>)}
            </select>
          </Field>
          <Field label="رقم الشعبة">
            <input value={v.groupNo} onChange={(e) => set("groupNo", e.target.value)} className={inputCls} />
          </Field>
          <Field label="عدد الطلاب">
            <input type="number" min={0} value={v.studentsCount} onChange={(e) => set("studentsCount", e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="رمز الفصل (الكنترول)">
            <input value={v.classCode} onChange={(e) => set("classCode", e.target.value)} className={inputCls} placeholder="يُملأ من الإعدادات تلقائياً" />
          </Field>
        </Grid>
      </Section>

      <Section title="المدرس والمنسق">
        <Grid>
          <Field label="مدرس المقرر">
            <select value={v.teacher} onChange={(e) => set("teacher", e.target.value)} className={inputCls}>
              <option value="">— اختر —</option>
              {teachersForCourse.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            {v.courseCode && teachersForCourse.length === 0 && (
              <Hint kind="warn">لم يحدد مدرسون لهذا المقرر بعد.</Hint>
            )}
          </Field>
          <Field label="المنسق">
            <select value={v.coordinator} onChange={(e) => set("coordinator", e.target.value)} className={inputCls}>
              <option value="">— اختر —</option>
              {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="جوال المنسق">
            <input type="tel" dir="ltr" value={v.coordinatorMobile} onChange={(e) => set("coordinatorMobile", e.target.value)} className={inputCls} placeholder="يُملأ تلقائياً" />
          </Field>
          <Field label="المقر" required>
            <select required value={v.base} onChange={(e) => set("base", e.target.value)} className={inputCls}>
              <option value="">— اختر —</option>
              {bases.map((b) => <option key={b.id} value={b.name}>{b.name} ({b.code})</option>)}
            </select>
          </Field>
        </Grid>
      </Section>

      <Section title="التوقيت والقاعة">
        <Grid>
          <Field label="تاريخ الاختبار" required>
            <input type="date" required value={v.date} onChange={(e) => set("date", e.target.value)} className={inputCls} />
          </Field>
          <Field label="اليوم">
            <input value={v.day} readOnly className={`${inputCls} bg-muted/40`} placeholder="يُحسب تلقائياً" />
          </Field>
          <Field label="الفترة" required>
            <select required value={v.period} onChange={(e) => set("period", e.target.value as DailyEntry["period"])} className={inputCls}>
              <option value="">— اختر —</option>
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="القاعة" required>
            <input required value={v.hall} onChange={(e) => set("hall", e.target.value)} className={inputCls} />
            {hallConflict && (
              <Hint kind="error">القاعة محجوزة في نفس التاريخ والفترة لمقرر {hallConflict.courseCode}.</Hint>
            )}
          </Field>
          <Field label="نوع الاختبار">
            <select value={v.examType} onChange={(e) => set("examType", e.target.value as DailyEntry["examType"])} className={inputCls}>
              <option value="">— اختر —</option>
              {EXAM_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </Grid>
      </Section>

      <Section title="المراقبون" hint="القائمة تستثني المدرس والمراقبين المختارين والمشغولين في نفس الفترة">
        {!v.date || !v.period ? (
          <div className="rounded-lg border border-dashed border-border bg-background py-4 text-center text-xs text-muted-foreground">
            اختر التاريخ والفترة لعرض المراقبين المتاحين.
          </div>
        ) : (
          <Grid>
            {(["monitor1", "monitor2", "monitor3"] as const).map((key, i) => {
              const others = (["monitor1", "monitor2", "monitor3"] as const)
                .filter((k) => k !== key)
                .map((k) => v[k])
                .filter(Boolean) as string[];
              const opts = monitorOptions(v[key], others);
              const warn = monitorWarning(v[key]);
              return (
                <Field key={key} label={`المراقب ${["الأول", "الثاني", "الثالث"][i]}`}>
                  <select value={v[key]} onChange={(e) => set(key, e.target.value)} className={inputCls}>
                    <option value="">— اختر —</option>
                    {opts.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  {warn && <Hint kind="warn">{warn}</Hint>}
                </Field>
              );
            })}
          </Grid>
        )}
        {dupesInForm() && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            <AlertTriangle className="size-4" /> لا يمكن تكرار المراقب نفسه أكثر من مرة.
          </div>
        )}
      </Section>

      <Section title="أوراق الأسئلة والمغلف">
        <Grid>
          <Field label="عدد الأوراق - قبل">
            <input type="number" min={0} value={v.papersBefore} onChange={(e) => set("papersBefore", e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
            {papersWarning && <Hint kind="warn">{papersWarning}</Hint>}
          </Field>
          <Field label="عدد الأوراق - بعد">
            <input type="number" min={0} value={v.papersAfter} onChange={(e) => set("papersAfter", e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="رقم المغلف">
            <input type="number" min={1} value={v.envelopeNum} onChange={(e) => set("envelopeNum", e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="إجمالي المغلفات">
            <input type="number" min={1} value={v.envelopeTotal} onChange={(e) => set("envelopeTotal", e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="ملاحظات">
            <input value={v.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} />
          </Field>
        </Grid>
      </Section>

      <Section
        title="حالات الاستلام والتسليم"
        hint="يلزم تحديد المشرف والتاريخ لكل خانة تُفعَّل"
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {RECEIPT_STAGES.map((s) => (
            <ReceiptCard
              key={s.key}
              title={s.label}
              record={v.receipts[s.key]}
              onChange={(p) => setReceipt(s.key, p)}
              adminNames={adminNames}
            />
          ))}
        </div>
        {receiptValidation.length > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            <AlertTriangle className="size-4" />
            أكمل التاريخ واسم المشرف لكل خانة محددة: {receiptValidation.join("، ")}
          </div>
        )}
      </Section>

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2 text-xs">
          {canSubmit ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 font-bold" style={{ color: "oklch(0.45 0.14 155)" }}>
              <Check className="size-3.5" /> جاهز للحفظ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-semibold text-muted-foreground">
              <X className="size-3.5" /> أكمل الحقول المطلوبة
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">إلغاء</button>
          <button type="submit" disabled={!canSubmit} className="rounded-lg gradient-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50">حفظ</button>
        </div>
      </div>
    </form>
  );
}

function ReceiptCard({
  title,
  record,
  onChange,
  adminNames,
}: {
  title: string;
  record: ReceiptRecord;
  onChange: (p: Partial<ReceiptRecord>) => void;
  adminNames: string[];
}) {
  const incomplete = record.checked && (!record.date || !record.supervisor);
  return (
    <div className={`rounded-xl border-2 p-4 transition-colors ${
      incomplete ? "border-destructive/60 bg-destructive/5"
        : record.checked ? "border-primary/50 bg-primary/5"
        : "border-border bg-background"
    }`}>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          checked={record.checked}
          onChange={(e) => {
            const next = e.target.checked;
            if (next && (!record.date || !record.supervisor)) {
              toast.warning(`أدخل التاريخ واسم المشرف قبل تأكيد "${title}"`);
            }
            onChange({ checked: next });
          }}
          className="size-5 cursor-pointer rounded border-input accent-primary"
        />
        {title}
      </label>
      <div className="mt-3 grid gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold">
            التاريخ {record.checked && <span className="text-destructive">*</span>}
          </label>
          <input
            type="date"
            value={record.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">
            المشرف {record.checked && <span className="text-destructive">*</span>}
          </label>
          <select
            value={record.supervisor}
            onChange={(e) => onChange({ supervisor: e.target.value })}
            className={inputCls}
          >
            <option value="">— اختر مشرف —</option>
            {adminNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function Hint({ kind = "info", children }: { kind?: "info" | "warn" | "error"; children: React.ReactNode }) {
  const cls =
    kind === "error"
      ? "text-destructive"
      : kind === "warn"
        ? "text-warning-foreground"
        : "text-muted-foreground";
  const style = kind === "warn" ? { color: "oklch(0.5 0.15 60)" } : undefined;
  return (
    <div className={`mt-1 text-[11px] font-semibold ${cls}`} style={style}>
      {children}
    </div>
  );
}
