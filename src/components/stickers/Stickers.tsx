import { useStore, useBaseCode, type DailyEntry } from "@/lib/store";
import {
  ENVELOPE_FIELDS,
  ENVELOPE_W,
  ENVELOPE_H,
  ARCHIVE_FIELDS,
  ARCHIVE_W,
  ARCHIVE_H,
  type Rect,
  type StickerSettings,
} from "./fields";
const envelopeBg = { url: "/envelope_bg.png" };
const archiveBg = { url: "/archive_bg.png" };
import "./sticker-styles.css";

function useDeptName() {
  const departments = useStore((s) => s.departments);
  return (code: string) => {
    if (!code) return "";
    const d = departments.find((x) => x.code === code);
    return d?.name || code;
  };
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${+m[3]}/${+m[2]}/${m[1]}`;
}

function envelopeStr(entry: Partial<DailyEntry>): string {
  if (entry.envelopeNum && entry.envelopeTotal)
    return `${entry.envelopeNum} من ${entry.envelopeTotal}`;
  if (entry.envelopeNum) return String(entry.envelopeNum);
  return "";
}

function fitFontSize(text: string, rect: Rect, max = 16, min = 7): number {
  const w = rect[2] - rect[0];
  const h = rect[3] - rect[1];
  const byH = Math.min(max, h - 2);
  if (!text) return Math.max(min, byH);
  // Approx average advance for Cairo bold @ size px: ~0.55 * size
  const maxByWidth = (w - 8) / (text.length * 0.55);
  return Math.max(min, Math.min(byH, maxByWidth));
}

function Field({
  rect,
  value,
  pageH,
  max = 16,
  min = 7,
  big,
  multi,
}: {
  rect: Rect;
  value: string;
  pageH: number;
  max?: number;
  min?: number;
  big?: boolean;
  multi?: boolean;
}) {
  const [x1, y1, x2, y2] = rect;
  const size = fitFontSize(value, rect, max, min);
  const style: React.CSSProperties = {
    top: pageH - y2,
    left: x1,
    width: x2 - x1,
    height: y2 - y1,
    fontSize: `${size}px`,
  };
  return (
    <div
      className={`sticker-field${big ? " big" : ""}${multi ? " multi" : ""}`}
      style={style}
    >
      {value || ""}
    </div>
  );
}

function buildEnvelopeValues(
  entry: Partial<DailyEntry>,
  settings: StickerSettings,
  baseCode: (name: string) => string,
): Record<string, string> {
  const examSession = settings.examSession || "النهائية";
  return {
    room: String(entry.hall ?? ""),
    courseCode: String(entry.courseCode ?? ""),
    sectionNumber: String(entry.groupNo ?? ""),
    courseName: String(entry.courseName ?? ""),
    teacher: String(entry.teacher ?? ""),
    coordinator: String(entry.coordinator ?? ""),
    date: formatDate(entry.date),
    day: String(entry.day ?? ""),
    period: String(entry.period ?? ""),
    location: entry.base ? baseCode(String(entry.base)) : "",
    monitor1: String(entry.monitor1 ?? ""),
    monitor2: String(entry.monitor2 ?? ""),
    monitor3: String(entry.monitor3 ?? ""),
    department: String(entry.department ?? ""),
    papersBefore:
      entry.papersBefore !== "" && entry.papersBefore !== undefined
        ? String(entry.papersBefore)
        : "",
    papersAfter:
      entry.papersAfter !== "" && entry.papersAfter !== undefined
        ? String(entry.papersAfter)
        : "",
    semester: String(settings.semester ?? ""),
    examSession,
    academicYear: String(settings.academicYear ?? ""),
  };
}

function buildArchiveValues(
  entry: Partial<DailyEntry>,
  settings: StickerSettings,
  baseCode: (name: string) => string,
): Record<string, string> {
  const examSession = settings.examSession || "النهائية";
  const classCode = entry.classCode || settings.controlNumber || "";
  const env = envelopeStr(entry);
  return {
    department: String(entry.department ?? ""),
    semester: String(settings.semester ?? ""),
    examSession,
    academicYear: String(settings.academicYear ?? ""),
    courseCode: String(entry.courseCode ?? ""),
    courseCodeBottom: String(entry.courseCode ?? ""),
    courseName: String(entry.courseName ?? ""),
    teacher: String(entry.teacher ?? ""),
    sectionNumber: String(entry.groupNo ?? ""),
    sectionNumberBottom: String(entry.groupNo ?? ""),
    semesterCode: classCode,
    semesterCodeBottom: classCode,
    departmentBottom: String(entry.department ?? ""),
    room: String(entry.hall ?? ""),
    coordinator: String(entry.coordinator ?? ""),
    date: formatDate(entry.date),
    day: String(entry.day ?? ""),
    papers:
      entry.studentsCount !== "" && entry.studentsCount !== undefined
        ? String(entry.studentsCount)
        : "",
    location: entry.base ? baseCode(String(entry.base)) : "",
    period: String(entry.period ?? ""),
    envelopeLabel: env,
    envelopeLabelBottom: env,
  };
}

// Fields that should render in a larger/bolder style
const ENV_BIG = new Set(["room", "courseCode", "sectionNumber"]);
const ARC_BIG = new Set([
  "semesterCode",
  "semesterCodeBottom",
  "courseCodeBottom",
  "sectionNumberBottom",
  "papers",
]);

const ENV_MULTI = new Set(["department"]);

export function EnvelopeSticker({
  entry,
  settings,
}: {
  entry: Partial<DailyEntry>;
  settings: StickerSettings;
}) {
  const deptName = useDeptName();
  const baseCode = useBaseCode();
  const values = buildEnvelopeValues({ ...entry, department: deptName(String(entry.department ?? "")) }, settings, baseCode);
  return (
    <div
      className="sticker-root"
      style={{ width: ENVELOPE_W, height: ENVELOPE_H }}
    >
      <img className="sticker-bg" src={envelopeBg.url} alt="" />
      {Object.entries(ENVELOPE_FIELDS).map(([name, rect]) => (
        <Field
          key={name}
          rect={rect}
          value={values[name] ?? ""}
          pageH={ENVELOPE_H}
          big={ENV_BIG.has(name)}
          multi={ENV_MULTI.has(name)}
          max={ENV_BIG.has(name) ? 26 : ENV_MULTI.has(name) ? 14 : 15}
          min={ENV_BIG.has(name) ? 12 : 7}
        />
      ))}
    </div>
  );
}

export function ArchiveSticker({
  entry,
  settings,
}: {
  entry: Partial<DailyEntry>;
  settings: StickerSettings;
}) {
  const deptName = useDeptName();
  const baseCode = useBaseCode();
  const values = buildArchiveValues({ ...entry, department: deptName(String(entry.department ?? "")) }, settings, baseCode);
  return (
    <div
      className="sticker-root"
      style={{ width: ARCHIVE_W, height: ARCHIVE_H }}
    >
      <img className="sticker-bg" src={archiveBg.url} alt="" />
      {Object.entries(ARCHIVE_FIELDS).map(([name, rect]) => (
        <Field
          key={name}
          rect={rect}
          value={values[name] ?? ""}
          pageH={ARCHIVE_H}
          big={ARC_BIG.has(name)}
          max={ARC_BIG.has(name) ? 22 : 14}
          min={ARC_BIG.has(name) ? 11 : 7}
        />
      ))}
    </div>
  );
}
