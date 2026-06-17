import { createFileRoute } from "@tanstack/react-router";
import { useStore, type Course, type Department } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/CrudTable";
import { BookOpen, Plus, Pencil, Trash2, Search, X, Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/data/courses")({
  head: () => ({ meta: [{ title: "المقررات الدراسية | لجنة الامتحانات العامة" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const rows = useStore((s) => s.courses);
  const members = useStore((s) => s.members);
  const departments = useStore((s) => s.departments);
  const add = useStore((s) => s.addCourse);
  const update = useStore((s) => s.updateCourse);
  const remove = useStore((s) => s.deleteCourse);
  const [editing, setEditing] = useState<Course | "new" | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      q
        ? rows.filter(
            (r) =>
              r.code.toLowerCase().includes(q.toLowerCase()) ||
              r.name.toLowerCase().includes(q.toLowerCase()) ||
              r.teachers.some((t) => t.toLowerCase().includes(q.toLowerCase())),
          )
        : rows,
    [rows, q],
  );

  return (
    <div>
      <PageHeader
        title="المقررات الدراسية"
        description="ربط كل مقرر بمدرسيه ومنسقه. ستظهر القيم تلقائياً في إدخال البيانات اليومية."
        icon={BookOpen}
        actions={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow"
          >
            <Plus className="size-4" /> إضافة مقرر
          </button>
        }
      />

      <div className="mb-4 relative w-full sm:max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث برمز أو اسم المقرر أو المدرس..."
          className="w-full rounded-lg border border-input bg-background py-2 pr-9 pl-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-right text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">رمز المقرر</th>
              <th className="px-4 py-3">اسم المقرر</th>
              <th className="px-4 py-3">المدرسون</th>
              <th className="px-4 py-3">المنسق</th>
              <th className="w-28 px-4 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "ابدأ بإضافة أول مقرر." : "لا نتائج مطابقة."}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-t border-border transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3">
                    {c.teachers.length === 0 ? (
                      <span className="text-xs text-muted-foreground">— لم يحدد —</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.teachers.map((t) => (
                          <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{t}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">{c.coordinator || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(c)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="تعديل"><Pencil className="size-4" /></button>
                      <button onClick={() => setConfirmDel(c.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="حذف"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "إضافة مقرر" : "تعديل المقرر"} size="lg">
          <CourseForm
            initial={editing === "new" ? null : editing}
            memberNames={members.map((m) => m.name)}
            departments={departments}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => {
              if (editing === "new") {
                add(v);
                toast.success("تم إضافة المقرر");
              } else {
                update(editing.id, v);
                toast.success("تم تحديث المقرر");
              }
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} title="تأكيد الحذف">
          <p className="mb-5 text-sm text-muted-foreground">هل أنت متأكد من حذف هذا المقرر؟</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDel(null)} className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">إلغاء</button>
            <button
              onClick={() => { remove(confirmDel); setConfirmDel(null); toast.success("تم الحذف"); }}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"
            >حذف</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CourseForm({
  initial,
  memberNames,
  departments,
  onSubmit,
  onCancel,
}: {
  initial: Course | null;
  memberNames: string[];
  departments: Department[];
  onSubmit: (v: { code: string; name: string; teachers: string[]; coordinator: string; department: string }) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [teachers, setTeachers] = useState<string[]>(initial?.teachers ?? []);
  const [coordinator, setCoordinator] = useState(initial?.coordinator ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [teacherQ, setTeacherQ] = useState("");

  const toggle = (n: string) =>
    setTeachers((arr) => (arr.includes(n) ? arr.filter((x) => x !== n) : [...arr, n]));

  const filteredMembers = teacherQ
    ? memberNames.filter((n) => n.toLowerCase().includes(teacherQ.toLowerCase()))
    : memberNames;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!code.trim() || !name.trim()) {
          toast.error("الرمز والاسم مطلوبان");
          return;
        }
        onSubmit({
          code: code.trim(),
          name: name.trim(),
          teachers,
          coordinator: coordinator.trim(),
          department,
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">رمز المقرر <span className="text-destructive">*</span></label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="IC102" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">اسم المقرر <span className="text-destructive">*</span></label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">القسم</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">— لم يحدد —</option>
            {departments.map((d) => <option key={d.id} value={d.code}>{d.name} ({d.code})</option>)}
          </select>
          {departments.length === 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">أضف الأقسام أولاً من صفحة الأقسام.</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">منسق المقرر</label>
          <select value={coordinator} onChange={(e) => setCoordinator(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">— لم يحدد —</option>
            {memberNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-bold">المدرسون المعتمدون لهذا المقرر</div>
          <div className="text-xs text-muted-foreground">المحدد: <b className="text-foreground">{teachers.length}</b></div>
        </div>
        {memberNames.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background py-6 text-center text-xs text-muted-foreground">
            أضف أعضاء هيئة التدريس أولاً من صفحة الأعضاء.
          </div>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="بحث عن مدرس..."
                value={teacherQ}
                onChange={(e) => setTeacherQ(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pr-9 pl-3 text-sm"
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-input bg-background p-2">
              <div className="grid gap-1 sm:grid-cols-2">
                {filteredMembers.map((n) => {
                  const active = teachers.includes(n);
                  return (
                    <button
                      type="button"
                      key={n}
                      onClick={() => toggle(n)}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-right text-sm transition-colors ${active ? "bg-primary/10 text-primary" : "hover:bg-muted/60"}`}
                    >
                      <span className={`flex size-4 items-center justify-center rounded border ${active ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                        {active && <Check className="size-3" />}
                      </span>
                      <span className="flex-1 truncate">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {teachers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {teachers.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {t}
                    <button type="button" onClick={() => toggle(t)} className="rounded-full hover:bg-primary/20"><X className="size-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">إلغاء</button>
        <button type="submit" className="rounded-lg gradient-primary px-5 py-2 text-sm font-bold text-primary-foreground">حفظ</button>
      </div>
    </form>
  );
}
