import { useEffect, useMemo, useState } from "react";
import { useStore, PERIODS, type DailyEntry } from "@/lib/store";
import { Modal } from "@/components/CrudTable";
import { Printer, Download, Plus, Filter, FileText, FileDown, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import {
  downloadStickerPdf,
  buildStickerPdfBlob,
  buildStickerPdfUrl,
  downloadCombinedPdf,
  printStickerPdf,
  printCombinedPdf,
  type StickerKind,
} from "@/lib/pdf";

export function StickerWorkspace({ kind }: { kind: StickerKind }) {
  const daily = useStore((s) => s.daily);
  const settings = useStore((s) => s.settings);
  const bases = useStore((s) => s.bases);
  const [filterBase, setFilterBase] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterHall, setFilterHall] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<Partial<DailyEntry> | null>(null);
  const [busy, setBusy] = useState<null | string>(null);

  const filtered = useMemo(() => {
    return daily.filter(
      (d) =>
        (!filterBase || d.base === filterBase) &&
        (!filterPeriod || d.period === filterPeriod) &&
        (!filterDate || d.date === filterDate) &&
        (!filterHall || d.hall.toLowerCase().includes(filterHall.toLowerCase())),
    );
  }, [daily, filterBase, filterPeriod, filterDate, filterHall]);

  const printOne = async (entry: Partial<DailyEntry>) => {
    try {
      setBusy("جاري تحضير الملصق للطباعة...");
      await printStickerPdf(entry, kind, settings);
    } catch (e) {
      console.error(e);
      toast.error("تعذّر الطباعة");
    } finally {
      setBusy(null);
    }
  };

  const printAllFiltered = async () => {
    if (filtered.length === 0) return;
    try {
      setBusy(`جاري تحضير ${filtered.length} ملصق للطباعة...`);
      await printCombinedPdf(filtered, kind, settings, (i, t) =>
        setBusy(`جاري التجهيز ${i} / ${t}`),
      );
    } catch (e) {
      console.error(e);
      toast.error("تعذّر الطباعة");
    } finally {
      setBusy(null);
    }
  };

  const downloadOnePdf = async (entry: Partial<DailyEntry>) => {
    try {
      setBusy("جاري إنشاء PDF...");
      await downloadStickerPdf(entry, kind, settings);
      toast.success("تم تنزيل الملصق");
    } catch (e) {
      toast.error("تعذّر إنشاء الملف");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const exportZip = async () => {
    if (filtered.length === 0) return;
    try {
      setBusy(`جاري إعداد ${filtered.length} ملصق...`);
      const zip = new JSZip();
      for (let i = 0; i < filtered.length; i++) {
        const d = filtered[i];
        setBusy(`جاري إعداد ${i + 1} / ${filtered.length}`);
        const blob = await buildStickerPdfBlob(d, kind, settings);
        const name = `${String(i + 1).padStart(3, "0")}_${d.courseCode || "sticker"}_${d.hall || ""}.pdf`;
        zip.file(name, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind === "envelope" ? "envelope" : "archive"}-stickers.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`تم تصدير ${filtered.length} ملصق PDF`);
    } catch (e) {
      toast.error("تعذّر التصدير");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  const exportCombinedPdf = async () => {
    if (filtered.length === 0) return;
    try {
      setBusy(`جاري التجميع 1 / ${filtered.length}`);
      await downloadCombinedPdf(filtered, kind, settings, undefined, (i, t) =>
        setBusy(`جاري التجميع ${i} / ${t}`),
      );
      toast.success("تم التصدير كملف PDF واحد");
    } catch (e) {
      toast.error("تعذّر التصدير");
      console.error(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="no-print mb-5 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Filter className="size-4 text-primary" />
          تصفية الملصقات
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={filterBase}
            onChange={(e) => setFilterBase(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">جميع المقرات</option>
            {bases.map((b) => <option key={b.id} value={b.name}>{b.name} ({b.code})</option>)}
          </select>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">كل الفترات</option>
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <input
            placeholder="القاعة"
            value={filterHall}
            onChange={(e) => setFilterHall(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              setFilterBase(""); setFilterPeriod(""); setFilterDate(""); setFilterHall("");
            }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            تفريغ الفلاتر
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          عدد الملصقات: <b className="text-foreground">{filtered.length}</b>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCustomOpen(true)}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            <Plus className="size-4" /> إنشاء ملصق مخصص
          </button>
          <button
            onClick={exportCombinedPdf}
            disabled={filtered.length === 0 || !!busy}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            <FileDown className="size-4" /> تصدير الكل (PDF واحد)
          </button>
          <button
            onClick={exportZip}
            disabled={filtered.length === 0 || !!busy}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            <Download className="size-4" /> تصدير الكل (ZIP)
          </button>
          <button
            onClick={printAllFiltered}
            disabled={filtered.length === 0 || !!busy}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow disabled:opacity-50"
          >
            <Printer className="size-4" /> طباعة الكل
          </button>
        </div>
      </div>

      {busy && (
        <div className="no-print mb-4 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
          <Loader2 className="size-4 animate-spin" /> {busy}
        </div>
      )}

      {/* Grid of stickers (lightweight summary cards) */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-3 size-10 opacity-40" />
            لا توجد ملصقات. أضف اختبارات في صفحة "البيانات اليومية" أو أنشئ ملصقاً مخصصاً.
          </div>
        ) : (
          filtered.map((d) => (
            <div
              key={d.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-base font-bold">{d.courseCode || "—"}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{d.courseName}</div>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                  {d.hall || "—"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <div>التاريخ: <span className="text-foreground">{d.date || "—"}</span></div>
                <div>الفترة: <span className="text-foreground">{d.period || "—"}</span></div>
                <div className="col-span-2">المقر: <span className="text-foreground">{d.base || "—"}</span></div>
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  onClick={() => setPreviewEntry(d)}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  <Eye className="size-3.5" /> معاينة
                </button>
                <button
                  onClick={() => printOne(d)}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                >
                  <Printer className="size-3.5" /> طباعة
                </button>
                <button
                  onClick={() => downloadOnePdf(d)}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                >
                  <Download className="size-3.5" /> تنزيل PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom sticker creator */}
      {customOpen && (
        <Modal onClose={() => setCustomOpen(false)} title="إنشاء ملصق مخصص" size="lg">
          <CustomStickerForm
            kind={kind}
            onPrint={(e) => {
              setCustomOpen(false);
              void printOne(e);
            }}
            onClose={() => setCustomOpen(false)}
          />
        </Modal>
      )}

      {previewEntry && (
        <Modal onClose={() => setPreviewEntry(null)} title="معاينة الملصق" size="lg">
          <StickerPreview entry={previewEntry} kind={kind} />
        </Modal>
      )}
    </div>
  );
}

function StickerPreview({
  entry,
  kind,
}: {
  entry: Partial<DailyEntry>;
  kind: StickerKind;
}) {
  const settings = useStore((s) => s.settings);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let current: string | null = null;
    setError(null);
    setUrl(null);
    buildStickerPdfUrl(entry, kind, settings)
      .then((u) => {
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        current = u;
        setUrl(u);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setError("تعذّر إنشاء المعاينة");
      });
    return () => {
      cancelled = true;
      if (current) URL.revokeObjectURL(current);
    };
  }, [entry, kind, settings]);

  return (
    <div className="h-[70vh] w-full overflow-hidden rounded-lg border border-border bg-muted">
      {error ? (
        <div className="flex h-full items-center justify-center text-sm text-destructive">
          {error}
        </div>
      ) : !url ? (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> جاري التحضير...
        </div>
      ) : (
        <iframe
          title="sticker-preview"
          src={url}
          className="size-full"
          style={{ border: 0 }}
        />
      )}
    </div>
  );
}

function CustomStickerForm({
  kind,
  onPrint,
  onClose,
}: {
  kind: StickerKind;
  onPrint: (e: Partial<DailyEntry>) => void;
  onClose: () => void;
}) {
  const addDaily = useStore((s) => s.addDaily);
  const [v, setV] = useState<Partial<DailyEntry>>({});
  const field = (key: keyof DailyEntry, label: string, type: string = "text") => (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      <input
        type={type}
        value={(v[key] as string) ?? ""}
        onChange={(e) => setV({ ...v, [key]: e.target.value })}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {field("courseCode", "رمز المقرر")}
        {field("courseName", "اسم المقرر")}
        {field("groupNo", "رقم الشعبة")}
        {field("hall", "القاعة")}
        {field("teacher", "مدرس المقرر")}
        {field("coordinator", "المنسق")}
        {field("period", "الفترة")}
        {field("date", "تاريخ الاختبار", "date")}
        {field("base", "المقر")}
        {field("studentsCount", "عدد الطلاب", "number")}
        {field("monitor1", "المراقب الأول")}
        {field("monitor2", "المراقب الثاني")}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">إلغاء</button>
        <button
          onClick={() => {
            addDaily({
              order: 0,
              courseCode: v.courseCode ?? "",
              groupNo: v.groupNo ?? "",
              courseName: v.courseName ?? "",
              teacher: v.teacher ?? "",
              coordinator: v.coordinator ?? "",
              coordinatorMobile: "",
              hall: v.hall ?? "",
              period: (v.period as DailyEntry["period"]) ?? "",
              studentsCount: v.studentsCount ? Number(v.studentsCount) : "",
              monitor1: v.monitor1 ?? "",
              monitor2: v.monitor2 ?? "",
              monitor3: v.monitor3 ?? "",
              date: v.date ?? "",
              day: "" as DailyEntry["day"],
              examType: "" as DailyEntry["examType"],
              base: (v.base as DailyEntry["base"]) ?? "",
              department: (v as DailyEntry).department ?? "",
              notes: (v as DailyEntry).notes ?? "",
              papersBefore: (v as DailyEntry).papersBefore ?? "",
              papersAfter: (v as DailyEntry).papersAfter ?? "",
              envelopeNum: (v as DailyEntry).envelopeNum ?? "",
              envelopeTotal: (v as DailyEntry).envelopeTotal ?? "",
              classCode: (v as DailyEntry).classCode ?? "",
              receipts: {
                teacherPickup: { checked: false, date: "", supervisor: "" },
                teacherReturn: { checked: false, date: "", supervisor: "" },
                archiveReceipt: { checked: false, date: "", supervisor: "" },
              },
            });
            toast.success("تم حفظ الملصق ضمن البيانات اليومية");
            onClose();
          }}
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          حفظ مع البيانات
        </button>
        <button
          onClick={() => onPrint(v)}
          className="rounded-lg gradient-primary px-5 py-2 text-sm font-bold text-primary-foreground"
        >
          {kind === "envelope" ? "طباعة الملصق" : "طباعة"}
        </button>
      </div>
    </div>
  );
}
