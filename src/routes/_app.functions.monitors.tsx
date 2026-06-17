import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClipboardList, Printer, Download, Filter, Eye, EyeOff } from "lucide-react";
import { useStore, PERIODS, type DailyEntry } from "@/lib/store";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/functions/monitors")({
  head: () => ({ meta: [{ title: "جدول مراقبات الأعضاء | لجنة الامتحانات العامة" }] }),
  component: MonitorsPage,
});

function MonitorsPage() {
  const daily = useStore((s) => s.daily);
  const members = useStore((s) => s.members);
  const bases = useStore((s) => s.bases);
  const settings = useStore((s) => s.settings);

  const [filterBase, setFilterBase] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [memberId, setMemberId] = useState<string>("__all__");
  const [hideAllRooms, setHideAllRooms] = useState(false);
  const [hiddenRooms, setHiddenRooms] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) =>
    setHiddenRooms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const isHidden = (id: string) => hideAllRooms || hiddenRooms.has(id);

  // Build per-member rows
  const memberMap = useMemo(() => {
    const map = new Map<string, DailyEntry[]>();
    daily.forEach((d) => {
      [d.monitor1, d.monitor2, d.monitor3].forEach((m) => {
        if (!m) return;
        if (filterBase && d.base !== filterBase) return;
        if (filterPeriod && d.period !== filterPeriod) return;
        if (filterDate && d.date !== filterDate) return;
        if (!map.has(m)) map.set(m, []);
        map.get(m)!.push(d);
      });
    });
    return map;
  }, [daily, filterBase, filterPeriod, filterDate]);

  const targetMembers =
    memberId === "__all__"
      ? Array.from(memberMap.keys()).sort((a, b) => a.localeCompare(b, "ar"))
      : [members.find((m) => m.id === memberId)?.name].filter(Boolean) as string[];

  const print = () => window.print();

  const exportCsv = () => {
    const rows = [
      ["العضو", "تسلسل", "رمز المقرر", "رقم الشعبة", "اسم المقرر", "القاعة", "الفترة", "تاريخ الاختبار", "اليوم", "المقر"],
    ];
    targetMembers.forEach((name) => {
      const items = memberMap.get(name) || [];
      items.forEach((d, i) => {
        rows.push([name, String(i + 1), d.courseCode, d.groupNo, d.courseName, d.hall, d.period, d.date, d.day, d.base]);
      });
    });
    const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "monitor-schedules.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم التصدير");
  };

  return (
    <div>
      <PageHeader
        title="جدول مراقبات الأعضاء"
        description="جدول مراقبات كل عضو من بيانات الاختبارات اليومية، جاهز للطباعة أو التصدير."
        icon={ClipboardList}
      />

      <div className="no-print mb-5 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Filter className="size-4 text-primary" />
          خيارات العرض
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="__all__">جميع الأعضاء</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={filterBase} onChange={(e) => setFilterBase(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">جميع المقرات</option>
            {bases.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل الفترات</option>
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => { setHideAllRooms((v) => !v); if (!hideAllRooms) setHiddenRooms(new Set()); }}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          {hideAllRooms ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          {hideAllRooms ? "إظهار كل القاعات" : "إخفاء كل القاعات"}
        </button>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
            <Download className="size-4" /> تصدير CSV
          </button>
          <button onClick={print} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow">
            <Printer className="size-4" /> طباعة الجدول
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {targetMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
            لا توجد مراقبات مطابقة. تأكد من إدخال الاختبارات وتعيين المراقبين.
          </div>
        ) : (
          targetMembers.map((name) => {
            const items = memberMap.get(name) || [];
            const member = members.find((m) => m.name === name);
            return (
              <div key={name} className="print-page overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <div className="gradient-primary p-4 text-primary-foreground">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <div className="text-xs opacity-90">{settings.collegeName} — لجنة الاختبارات العامة</div>
                      <div className="text-lg font-extrabold">جدول مراقبات العضو</div>
                    </div>
                    <div className="text-xs opacity-95">
                      <div>{settings.academicYear} — {settings.semester}</div>
                      <div>كنترول {settings.controlNumber}</div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 border-b border-border bg-muted/40 px-5 py-3 text-sm sm:grid-cols-4">
                  <div><b>الاسم:</b> {name}</div>
                  <div><b>الرتبة:</b> {member?.rank || "—"}</div>
                  <div><b>المقر:</b> {member?.base || "—"}</div>
                  <div><b>عدد المراقبات:</b> {items.length}</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">تسلسل</th>
                        <th className="px-3 py-2">رمز المقرر</th>
                        <th className="px-3 py-2">رقم الشعبة</th>
                        <th className="px-3 py-2">اسم المقرر</th>
                        <th className="px-3 py-2">القاعة</th>
                        <th className="px-3 py-2">الفترة</th>
                        <th className="px-3 py-2">التاريخ</th>
                        <th className="px-3 py-2">اليوم</th>
                        <th className="px-3 py-2">المقر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr><td colSpan={9} className="py-6 text-center text-muted-foreground">لا مراقبات.</td></tr>
                      ) : items.map((d, i) => {
                        const hidden = isHidden(d.id);
                        return (
                          <tr key={d.id} className="border-t border-border">
                            <td className="px-3 py-2 tabular-nums">{i + 1}</td>
                            <td className="px-3 py-2">{d.courseCode}</td>
                            <td className="px-3 py-2">{d.groupNo}</td>
                            <td className="px-3 py-2">{d.courseName}</td>
                            <td className="px-3 py-2 font-bold">
                              <span className="inline-flex items-center gap-2">
                                <span className={hidden ? "tracking-widest text-muted-foreground" : ""}>
                                  {hidden ? "••••" : d.hall}
                                </span>
                                <button
                                  onClick={() => toggleRow(d.id)}
                                  className="no-print rounded p-0.5 text-muted-foreground hover:text-foreground"
                                  title={hidden ? "إظهار" : "إخفاء"}
                                  type="button"
                                >
                                  {hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                                </button>
                              </span>
                            </td>
                            <td className="px-3 py-2">{d.period}</td>
                            <td className="px-3 py-2 tabular-nums">{d.date}</td>
                            <td className="px-3 py-2">{d.day}</td>
                            <td className="px-3 py-2 text-xs">{d.base}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
