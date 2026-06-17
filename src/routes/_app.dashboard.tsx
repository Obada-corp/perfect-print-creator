import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUser, useStore, usePermissions, type Permission } from "@/lib/store";
import {
  Users,
  BookOpen,
  CalendarDays,
  Tag,
  Archive,
  ClipboardList,
  Building,
  Building2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Settings as SettingsIcon,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
const collegeLogo = { url: "/college_logo.png" };

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | لجنة الامتحانات العامة" },
      { name: "description", content: "نظرة سريعة على إحصائيات اللجنة والاختبارات." },
    ],
  }),
  component: Dashboard,
});

interface Shortcut {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perm: Permission;
  hint?: string;
}

const ALL_SHORTCUTS: Shortcut[] = [
  { to: "/data/daily", label: "إدخال اختبار", icon: CalendarDays, perm: "manage_daily", hint: "إضافة بيانات اختبار جديد" },
  { to: "/data/members", label: "إضافة عضو", icon: Users, perm: "manage_members", hint: "أعضاء هيئة التدريس" },
  { to: "/data/courses", label: "إضافة مقرر", icon: BookOpen, perm: "manage_courses", hint: "ربط المقررات بالمدرسين" },
  { to: "/data/departments", label: "الأقسام", icon: Building2, perm: "manage_departments", hint: "أقسام الكلية" },
  { to: "/data/bases", label: "المقرات", icon: Building, perm: "manage_bases", hint: "مقرات الاختبارات" },
  { to: "/functions/envelopes", label: "ملصقات المغلفات", icon: Tag, perm: "manage_functions", hint: "توليد بضغطة" },
  { to: "/functions/archive", label: "ملصقات الأرشفة", icon: Archive, perm: "manage_functions", hint: "للحاويات" },
  { to: "/functions/monitors", label: "جدول المراقبات", icon: ClipboardList, perm: "manage_functions", hint: "جاهز للطباعة" },
  { to: "/settings/admins", label: "المشرفون", icon: ShieldCheck, perm: "manage_admins", hint: "إدارة الصلاحيات" },
  { to: "/settings", label: "الإعدادات", icon: SettingsIcon, perm: "manage_settings", hint: "الكلية والكنترول" },
];

function Dashboard() {
  const user = useCurrentUser();
  const can = usePermissions();
  const members = useStore((s) => s.members);
  const courses = useStore((s) => s.courses);
  const departments = useStore((s) => s.departments);
  const bases = useStore((s) => s.bases);
  const daily = useStore((s) => s.daily);
  const settings = useStore((s) => s.settings);

  const today = new Date().toISOString().slice(0, 10);
  const todaysExams = daily.filter((d) => d.date === today).length;
  const totalMonitors = daily.reduce(
    (a, d) => a + [d.monitor1, d.monitor2, d.monitor3].filter(Boolean).length,
    0,
  );
  const receiptsDone = daily.filter((d) => d.receipts?.archiveReceipt?.checked).length;
  const receiptRate = daily.length > 0 ? Math.round((receiptsDone / daily.length) * 100) : 0;

  // Conflicts
  const conflicts = (() => {
    const halls = new Map<string, number>();
    const people = new Map<string, number>();
    daily.forEach((d) => {
      if (!d.date || !d.period) return;
      if (d.hall) {
        const k = `${d.date}|${d.period}|${d.hall.trim().toLowerCase()}`;
        halls.set(k, (halls.get(k) || 0) + 1);
      }
      [d.teacher, d.monitor1, d.monitor2, d.monitor3].forEach((m) => {
        if (!m) return;
        const k = `${d.date}|${d.period}|${m}`;
        people.set(k, (people.get(k) || 0) + 1);
      });
    });
    let c = 0;
    halls.forEach((n) => n > 1 && c++);
    people.forEach((n) => n > 1 && c++);
    return c;
  })();

  // KPI cards filtered by permission
  const kpiAll = [
    { label: "اختبارات اليوم", value: todaysExams, icon: CalendarDays, accent: "teal", perm: "manage_daily" as Permission },
    { label: "إجمالي الاختبارات", value: daily.length, icon: CalendarDays, accent: "navy", perm: "manage_daily" as Permission },
    { label: "أعضاء هيئة التدريس", value: members.length, icon: Users, accent: "lime", perm: "manage_members" as Permission },
    { label: "المقررات", value: courses.length, icon: BookOpen, accent: "cyan", perm: "manage_courses" as Permission },
    { label: "الأقسام", value: departments.length, icon: Building2, accent: "navy", perm: "manage_departments" as Permission },
    { label: "المقرات", value: bases.length, icon: Building, accent: "teal", perm: "manage_bases" as Permission },
    { label: "مجموع المراقبات", value: totalMonitors, icon: ClipboardList, accent: "cyan", perm: "manage_functions" as Permission },
    { label: "نسبة الأرشفة", value: `${receiptRate}%`, icon: TrendingUp, accent: "lime", perm: "manage_daily" as Permission },
  ];
  const kpis = kpiAll.filter((k) => can(k.perm)).slice(0, 8);

  const accentMap: Record<string, { bar: string; dot: string }> = {
    teal: { dot: "bg-[var(--brand-teal)]", bar: "bg-[var(--brand-teal)]" },
    lime: { dot: "bg-[var(--brand-lime)]", bar: "bg-[var(--brand-lime)]" },
    navy: { dot: "bg-[var(--brand-navy)]", bar: "bg-[var(--brand-navy)]" },
    cyan: { dot: "bg-[var(--brand-cyan)]", bar: "bg-[var(--brand-cyan)]" },
  };

  const shortcuts = ALL_SHORTCUTS.filter((s) => can(s.perm));

  const upcoming = [...daily]
    .filter((d) => d.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 6);

  const baseStats = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.base] = (acc[m.base] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Editorial hero */}
      <section className="relative mb-8 overflow-hidden rounded-[28px] brand-mesh text-white shadow-elev">
        {/* Single tasteful triangle accent — leading corner */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-72 opacity-80"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 280'><polygon points='280,0 280,140 140,0' fill='%23C7E04A' opacity='0.40'/><polygon points='240,40 240,160 120,40' fill='%2355D2D8' opacity='0.20'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
          }}
        />

        <div className="relative grid gap-8 p-8 md:grid-cols-[1.4fr,1fr] md:p-12">
          <div>
            <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">
              <span className="inline-block size-1.5 rounded-full bg-[var(--brand-lime)]" />
              CBE · لجنة الامتحانات العامة · {new Date().toLocaleDateString("ar-SA", { weekday: "long" })}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-[2.4rem]">
              مرحباً، {user?.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
              {settings.collegeName} — {settings.unitName} · كنترول رقم{" "}
              <span className="font-bold text-[var(--brand-lime)]">{settings.controlNumber}</span>.
              {user?.isSupreme ? " صلاحيات كاملة." : " صلاحيات مخصصة."}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {can("manage_daily") && (
                <Link
                  to="/data/daily"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[var(--brand-navy)] shadow-soft transition-transform hover:-translate-y-0.5"
                >
                  إدخال اختبار جديد
                  <ArrowLeft className="size-4" />
                </Link>
              )}
              {can("manage_functions") && (
                <Link
                  to="/functions/envelopes"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Tag className="size-4" />
                  ملصقات المغلفات
                </Link>
              )}
            </div>
          </div>

          <div className="relative hidden self-end md:block">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                  <Sparkles className="size-3.5 text-[var(--brand-lime)]" />
                  ملخص اللحظة
                </div>
                <img src={collegeLogo.url} alt="CBE" className="h-8 w-auto rounded bg-white p-1 shadow-soft" />
              </div>
              <dl className="grid grid-cols-3 gap-4">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/60">اليوم</dt>
                  <dd className="mt-1 text-3xl font-extrabold tabular-nums text-white">{todaysExams}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/60">الكل</dt>
                  <dd className="mt-1 text-3xl font-extrabold tabular-nums text-white">{daily.length}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-white/60">الأرشفة</dt>
                  <dd className="mt-1 text-3xl font-extrabold tabular-nums text-white">{receiptRate}%</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Conflict banner */}
      {can("manage_daily") && conflicts > 0 && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-3 text-sm font-semibold text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4" />
            يوجد {conflicts} تعارض نشط في الاختبارات.
          </div>
          <Link to="/data/daily" className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">
            معالجة
          </Link>
        </div>
      )}

      {/* KPI strip */}
      {kpis.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((s) => {
            const Icon = s.icon;
            const a = accentMap[s.accent];
            return (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elev"
              >
                <div className={`absolute inset-y-0 right-0 w-1 ${a.bar}`} />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${a.dot}`} />
                      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {s.label}
                      </span>
                    </div>
                    <div className="mt-3 text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
                      {s.value}
                    </div>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground/70 transition-colors group-hover:bg-foreground group-hover:text-background">
                    <Icon className="size-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shortcuts */}
      {shortcuts.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent/30 text-[var(--brand-navy)]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">اختصارات سريعة</h2>
                <p className="text-[11px] text-muted-foreground">حسب صلاحياتك</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {shortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-soft"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 text-primary transition-all group-hover:gradient-primary group-hover:text-white">
                    <Icon className="size-5" />
                  </div>
                  <div className="text-sm font-bold text-foreground">{s.label}</div>
                  {s.hint && <div className="text-[11px] text-muted-foreground">{s.hint}</div>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {can("manage_daily") && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-l from-transparent to-muted/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="size-4" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">الاختبارات القادمة</h2>
                  <p className="text-[11px] text-muted-foreground">أحدث 6 اختبارات</p>
                </div>
              </div>
              <Link to="/data/daily" className="text-xs font-bold text-primary hover:underline">
                عرض الكل ←
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                لا توجد اختبارات قادمة. ابدأ بإدخال البيانات اليومية.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">المقرر</th>
                      <th className="px-3 py-3">القاعة</th>
                      <th className="px-3 py-3">التاريخ</th>
                      <th className="px-3 py-3">الفترة</th>
                      <th className="px-5 py-3">المقر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((d) => (
                      <tr key={d.id} className="border-t border-border transition-colors hover:bg-muted/30">
                        <td className="px-5 py-3 font-semibold">{d.courseCode} — {d.courseName}</td>
                        <td className="px-3 py-3">{d.hall}</td>
                        <td className="px-3 py-3 tabular-nums">{d.date}</td>
                        <td className="px-3 py-3">{d.period}</td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">{d.base}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {can("manage_members") && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="border-b border-border bg-gradient-to-l from-transparent to-muted/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg gradient-spotlight text-white">
                  <Building className="size-4" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">توزيع الأعضاء</h2>
                  <p className="text-[11px] text-muted-foreground">حسب المقر</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {Object.keys(baseStats).length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">لا توجد بيانات بعد.</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(baseStats).map(([base, count], i) => {
                    const pct = Math.round((count / members.length) * 100);
                    const grads = ["gradient-brand", "gradient-spotlight", "gradient-primary"];
                    return (
                      <div key={base}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-semibold">{base || "غير محدد"}</span>
                          <span className="tabular-nums font-bold text-foreground">
                            {count}{" "}
                            <span className="font-medium text-muted-foreground">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${grads[i % grads.length]} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
