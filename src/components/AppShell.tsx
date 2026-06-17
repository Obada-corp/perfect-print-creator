import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCurrentUser, useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  Tag,
  Archive,
  ClipboardList,
  Settings as SettingsIcon,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Database,
  Sparkles,
  Menu,
  X,
  Building2,
  Building,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
const universityLogo = { url: "/university_logo.png" };
const collegeLogo = { url: "/college_logo.png" };

const nav = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, perm: "view_dashboard" },
  {
    label: "قاعدة البيانات",
    icon: Database,
    children: [
      { to: "/data/members", label: "الأعضاء", icon: Users, perm: "manage_members" },
      { to: "/data/departments", label: "الأقسام", icon: Building2, perm: "manage_departments" },
      { to: "/data/bases", label: "المقرات", icon: Building, perm: "manage_bases" },
      { to: "/data/courses", label: "المقررات", icon: BookOpen, perm: "manage_courses" },
      { to: "/data/daily", label: "البيانات اليومية", icon: CalendarDays, perm: "manage_daily" },
    ],
  },
  {
    label: "الوظائف",
    icon: Sparkles,
    children: [
      { to: "/functions/envelopes", label: "ملصقات للمغلفات", icon: Tag, perm: "manage_functions" },
      { to: "/functions/archive", label: "ملصق حاوية للأرشفة", icon: Archive, perm: "manage_functions" },
      { to: "/functions/monitors", label: "جدول مراقبات الأعضاء", icon: ClipboardList, perm: "manage_functions" },
    ],
  },
  {
    label: "الإعدادات",
    icon: SettingsIcon,
    children: [
      { to: "/settings/admins", label: "المشرفون", icon: ShieldCheck, perm: "manage_admins" },
      { to: "/settings", label: "الإعدادات العامة", icon: SettingsIcon, perm: "manage_settings" },
    ],
  },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const hydrated = useStore((s) => s.hasHydrated);
  const logout = useStore((s) => s.logout);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/auth", replace: true });
  }, [hydrated, user, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center app-backdrop">
        <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const toggleTheme = () => {
    const t = settings.theme === "dark" ? "light" : "dark";
    updateSettings({ theme: t });
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  const can = (perm?: string) => !perm || user.isSupreme || user.permissions.includes(perm as never);

  return (
    <div className="relative min-h-screen app-backdrop">
      <div aria-hidden className="no-print pointer-events-none fixed inset-x-0 top-0 z-20 h-[3px] gradient-brand" />

      <Toaster richColors position="top-center" dir="rtl" />

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/85 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-foreground hover:bg-muted"
          aria-label="فتح القائمة"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="tri-mark" />
          <span className="font-extrabold tracking-tight text-foreground">لجنة الامتحانات العامة</span>
        </div>
        <button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-muted">
          {settings.theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "no-print fixed inset-y-0 right-0 z-40 w-72 gradient-sidebar text-sidebar-foreground transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            open ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          )}
        >
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/10" />

          <div className="relative flex h-full flex-col">
            {/* Identity zone */}
            <div className="border-b border-sidebar-border/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/95 p-2.5 shadow-soft">
                    <img src={universityLogo.url} alt="جامعة القصيم" className="h-10 w-auto object-contain" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="tri-mark" />
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/60">
                      Exam Committee
                    </div>
                  </div>
                  <div className="mt-1 text-base font-extrabold tracking-tight">لجنة الامتحانات العامة</div>
                  <div className="mt-0.5 text-[11px] text-sidebar-foreground/65">
                    {settings.collegeName}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-5">
              {nav.map((group, gi) => {
                if (!("children" in group)) {
                  const Icon = group.icon;
                  if (!can(group.perm)) return null;
                  const active = pathname === group.to;
                  return (
                    <Link
                      key={group.to}
                      to={group.to}
                      className={cn(
                        "group relative mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      {active && (
                        <span aria-hidden className="absolute inset-y-1.5 right-0 w-1 rounded-full bg-accent" />
                      )}
                      <Icon className={cn("size-4", active ? "text-accent" : "")} />
                      {group.label}
                    </Link>
                  );
                }
                const visibleChildren = group.children.filter((c) => can(c.perm));
                if (visibleChildren.length === 0) return null;
                const GIcon = group.icon;
                return (
                  <div key={gi} className="mb-5">
                    <div className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">
                      <GIcon className="size-3" />
                      {group.label}
                    </div>
                    {visibleChildren.map((c) => {
                      const Icon = c.icon;
                      const active = pathname === c.to;
                      return (
                        <Link
                          key={c.to}
                          to={c.to}
                          className={cn(
                            "relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground",
                          )}
                        >
                          {active && (
                            <span aria-hidden className="absolute inset-y-1 right-0 w-0.5 rounded-full bg-accent" />
                          )}
                          <Icon className={cn("size-4", active ? "text-accent" : "opacity-80")} />
                          {c.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>

            <div className="border-t border-sidebar-border/70 p-4">
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-sidebar-accent/30 p-2.5">
                <div className="flex size-10 items-center justify-center rounded-full gradient-spotlight text-sm font-bold text-sidebar">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{user.name}</div>
                  <div className="text-[11px] text-sidebar-foreground/60">
                    {user.isSupreme ? "المشرف الأعلى" : "مشرف"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-xs font-semibold hover:bg-sidebar-accent"
                >
                  {settings.theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                  {settings.theme === "dark" ? "نهاري" : "ليلي"}
                </button>
                <button
                  onClick={() => {
                    logout();
                    navigate({ to: "/auth", replace: true });
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20"
                >
                  <LogOut className="size-3.5" />
                  خروج
                </button>
              </div>
            </div>
          </div>
        </aside>

        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main */}
        <main className="flex min-h-screen flex-1 flex-col px-4 py-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-7xl flex-1">
            <Outlet />
          </div>

          {/* Subtle triangle footer band */}
          <footer className="no-print relative mt-12">
            <div aria-hidden className="brand-footer-band absolute inset-x-0 -top-1 h-12 opacity-70" />
            <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 border-t border-border pt-6 px-1 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-card p-1.5 shadow-xs ring-1 ring-border">
                  <img src={collegeLogo.url} alt="CBE — AACSB Accredited" className="h-7 w-auto object-contain" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-bold text-foreground">كلية الأعمال والاقتصاد</div>
                  <div className="text-[11px] text-muted-foreground">College of Business & Economics · Qassim University</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="hidden sm:inline">AACSB Accredited</span>
                <span aria-hidden className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
                <span>© {new Date().getFullYear()} لجنة الامتحانات العامة</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
