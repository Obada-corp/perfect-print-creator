import { createFileRoute } from "@tanstack/react-router";
import { useStore, RECEIPT_STAGES, type DailyEntry, type ReceiptStage } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/CrudTable";
import { DailyEntryForm } from "@/components/DailyEntryForm";
import { CalendarDays, Plus, Pencil, Trash2, Search, AlertTriangle, Check, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/data/daily")({
  head: () => ({ meta: [{ title: "البيانات اليومية | لجنة الامتحانات العامة" }] }),
  component: DailyPage,
});

function DailyPage() {
  const rows = useStore((s) => s.daily);
  const bases = useStore((s) => s.bases);
  const departments = useStore((s) => s.departments);
  const add = useStore((s) => s.addDaily);
  const update = useStore((s) => s.updateDaily);
  const remove = useStore((s) => s.deleteDaily);
  const [editing, setEditing] = useState<DailyEntry | "new" | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterBase, setFilterBase] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterExamType, setFilterExamType] = useState("");
  const [conflictsOnly, setConflictsOnly] = useState(false);

  const filtered = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return (a.period || "").localeCompare(b.period || "", "ar");
    });
    return sorted.filter((r) => {
      if (filterBase && r.base !== filterBase) return false;
      if (filterDept && r.department !== filterDept) return false;
      if (filterExamType && r.examType !== filterExamType) return false;
      if (filterDateFrom && r.date < filterDateFrom) return false;
      if (filterDateTo && r.date > filterDateTo) return false;
      if (q) {
        const hit = [r.courseCode, r.courseName, r.teacher, r.hall, r.base]
          .some((s) => (s || "").toLowerCase().includes(q.toLowerCase()));
        if (!hit) return false;
      }
      return true;
    });
  }, [rows, q, filterBase, filterDept, filterDateFrom, filterDateTo, filterExamType]);

  const conflicts = useMemo(() => {
    const halls = new Map<string, string[]>();
    const people = new Map<string, string[]>();
    rows.forEach((d) => {
      if (!d.date || !d.period) return;
      if (d.hall) {
        const k = `${d.date}|${d.period}|${d.hall.trim().toLowerCase()}`;
        if (!halls.has(k)) halls.set(k, []);
        halls.get(k)!.push(d.id);
      }
      [d.teacher, d.monitor1, d.monitor2, d.monitor3].forEach((m) => {
        if (!m) return;
        const k = `${d.date}|${d.period}|${m}`;
        if (!people.has(k)) people.set(k, []);
        people.get(k)!.push(d.id);
      });
    });
    const bad = new Set<string>();
    halls.forEach((ids) => ids.length > 1 && ids.forEach((id) => bad.add(id)));
    people.forEach((ids) => ids.length > 1 && ids.forEach((id) => bad.add(id)));
    return bad;
  }, [rows]);

  const visible = conflictsOnly ? filtered.filter((r) => conflicts.has(r.id)) : filtered;

  return (
    <div>
      <PageHeader
        title="إدخال البيانات اليومية"
        description="جميع اختبارات اليوم. النموذج يقوم تلقائياً بالتعبئة والربط ومنع التعارضات."
        icon={CalendarDays}
        actions={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow"
          >
            <Plus className="size-4" /> إضافة اختبار
          </button>
        }
      />

      {conflicts.size > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4" />
          يوجد {conflicts.size} اختبار به تعارض (قاعة أو مراقب مكرر في نفس الفترة).
        </div>
      )}

      <div className="no-print mb-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Filter className="size-4 text-primary" /> فلاتر
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..." className="w-full rounded-lg border border-input bg-background py-2 pr-9 pl-3 text-sm" />
          </div>
          <select value={filterBase} onChange={(e) => setFilterBase(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل المقرات</option>
            {bases.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل الأقسام</option>
            {departments.map((d) => <option key={d.id} value={d.code}>{d.name}</option>)}
          </select>
          <select value={filterExamType} onChange={(e) => setFilterExamType(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل أنواع الاختبارات</option>
            <option value="رئيسي">رئيسي</option>
            <option value="بديل">بديل</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <input type="checkbox" checked={conflictsOnly} onChange={(e) => setConflictsOnly(e.target.checked)} className="size-4 accent-primary" />
            تعارضات فقط
          </label>
          <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" title="من تاريخ" />
          <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" title="إلى تاريخ" />
          <button
            onClick={() => { setQ(""); setFilterBase(""); setFilterDept(""); setFilterDateFrom(""); setFilterDateTo(""); setFilterExamType(""); setConflictsOnly(false); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >تفريغ</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-right text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3">المقرر</th>
              <th className="px-3 py-3">الشعبة</th>
              <th className="px-3 py-3">المدرس</th>
              <th className="px-3 py-3">القاعة</th>
              <th className="px-3 py-3">الفترة</th>
              <th className="px-3 py-3">التاريخ</th>
              <th className="px-3 py-3">المراقبون</th>
              <th className="px-3 py-3">المقر</th>
              {RECEIPT_STAGES.map((s) => (
                <th key={s.key} className="px-3 py-3">{s.short}</th>
              ))}
              <th className="w-24 px-3 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={11 + RECEIPT_STAGES.length} className="py-12 text-center text-sm text-muted-foreground">
                  {rows.length === 0 ? "لا توجد اختبارات. تأكد من إضافة الأعضاء والمقررات أولاً." : "لا نتائج مطابقة."}
                </td>
              </tr>
            ) : (
              visible.map((d) => {
                const conflict = conflicts.has(d.id);
                return (
                  <tr key={d.id} className={`border-t border-border transition-colors hover:bg-muted/30 ${conflict ? "bg-destructive/5" : ""}`}>
                    <td className="px-3 py-2.5">
                      <div className="font-mono font-bold">{d.courseCode}</div>
                      <div className="text-xs text-muted-foreground">{d.courseName}</div>
                    </td>
                    <td className="px-3 py-2.5">{d.groupNo || "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{d.teacher || "—"}</td>
                    <td className="px-3 py-2.5 font-bold">{d.hall}</td>
                    <td className="px-3 py-2.5">{d.period}</td>
                    <td className="px-3 py-2.5 tabular-nums">{d.date}</td>
                    <td className="px-3 py-2.5 text-xs">
                      {[d.monitor1, d.monitor2, d.monitor3].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{d.base}</td>
                    {RECEIPT_STAGES.map((s) => (
                      <td key={s.key} className="px-3 py-2.5 text-xs">
                        <StatusCell stage={s.key} entry={d} />
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        {conflict && (
                          <span title="تعارض" className="rounded-md p-1.5 text-destructive">
                            <AlertTriangle className="size-4" />
                          </span>
                        )}
                        <button onClick={() => setEditing(d)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="تعديل"><Pencil className="size-4" /></button>
                        <button onClick={() => setConfirmDel(d.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="حذف"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "إضافة اختبار" : "تعديل اختبار"} size="lg">
          <DailyEntryForm
            initial={editing === "new" ? null : editing}
            excludeId={editing === "new" ? undefined : editing.id}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => {
              if (editing === "new") {
                add({ ...v, order: rows.length + 1 });
                toast.success("تم إضافة الاختبار");
              } else {
                update(editing.id, v);
                toast.success("تم تحديث الاختبار");
              }
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} title="تأكيد الحذف">
          <p className="mb-5 text-sm text-muted-foreground">هل أنت متأكد من حذف هذا الاختبار؟ لا يمكن التراجع.</p>
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

function StatusCell({ entry, stage }: { entry: DailyEntry; stage: ReceiptStage }) {
  const r = entry.receipts?.[stage];
  if (!r || !r.checked) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary">
        <Check className="size-3" /> {r.date || "✓"}
      </span>
      {r.supervisor && <span className="text-[10px] text-muted-foreground">{r.supervisor}</span>}
    </div>
  );
}
