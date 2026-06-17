import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/PageHeader";
import { Settings as SettingsIcon, Save, Database, Trash2, Upload, UserCog } from "lucide-react";
import { useStore, useCurrentUser } from "@/lib/store";
import { useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings/")({
  head: () => ({ meta: [{ title: "الإعدادات العامة | لجنة الامتحانات العامة" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const me = useCurrentUser();
  const updateAdmin = useStore((s) => s.updateAdmin);
  const [form, setForm] = useState(settings);
  const [profile, setProfile] = useState({
    name: me?.name ?? "",
    username: me?.username ?? "",
    password: me?.password ?? "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const exportAll = () => {
    const state = useStore.getState();
    const data = {
      members: state.members,
      courses: state.courses,
      daily: state.daily,
      admins: state.admins,
      settings: state.settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `control-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات");
  };

  const importAll = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== "object") throw new Error("invalid");
      useStore.setState((s) => ({
        members: Array.isArray(data.members) ? data.members : s.members,
        courses: Array.isArray(data.courses) ? data.courses : s.courses,
        daily: Array.isArray(data.daily) ? data.daily : s.daily,
        admins: Array.isArray(data.admins) && data.admins.some((a: { isSupreme?: boolean }) => a.isSupreme)
          ? data.admins
          : s.admins,
        settings: data.settings ? { ...s.settings, ...data.settings } : s.settings,
      }));
      toast.success("تم استيراد البيانات بنجاح");
    } catch {
      toast.error("ملف غير صالح");
    }
  };

  const resetAll = () => {
    if (!confirm("هل أنت متأكد؟ سيتم حذف جميع البيانات.")) return;
    localStorage.removeItem("control-platform-v1");
    location.reload();
  };

  return (
    <div>
      <PageHeader
        title="الإعدادات العامة"
        description="معلومات الكلية والكنترول، الحساب الشخصي، والنسخ الاحتياطي."
        icon={SettingsIcon}
      />

      {/* Profile / supreme admin name */}
      {me && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!profile.name.trim() || !profile.username.trim() || !profile.password) {
              toast.error("جميع الحقول مطلوبة");
              return;
            }
            updateAdmin(me.id, {
              name: profile.name.trim(),
              username: profile.username.trim(),
              password: profile.password,
            });
            toast.success("تم تحديث الحساب");
          }}
          className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
            <UserCog className="size-5 text-primary" /> الحساب الشخصي
            {me.isSupreme && (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold" style={{ color: "oklch(0.5 0.15 60)" }}>
                المشرف الأعلى
              </span>
            )}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            يمكنك تغيير اسمك واسم المستخدم وكلمة المرور من هنا. يستخدم الاسم لتسجيل الدخول.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">الاسم الكامل</label>
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">اسم المستخدم</label>
              <input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">كلمة المرور</label>
              <input type="text" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow">
              <Save className="size-4" /> حفظ الحساب
            </button>
          </div>
        </form>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateSettings(form);
          toast.success("تم الحفظ");
        }}
        className="rounded-2xl border border-border bg-card p-6 shadow-soft"
      >
        <h2 className="mb-1 text-lg font-bold">معلومات الكلية والكنترول</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          تظهر هذه المعلومات في الملصقات وجداول المراقبة المطبوعة.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["collegeName", "اسم الكلية"],
            ["unitName", "اسم الوحدة"],
            ["controlNumber", "رقم الكنترول"],
            ["semester", "الفصل الدراسي"],
            ["academicYear", "العام الدراسي"],
          ] as const).map(([k, l]) => (
            <div key={k}>
              <label className="mb-1 block text-xs font-semibold">{l}</label>
              <input
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow">
            <Save className="size-4" /> حفظ التغييرات
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold">
          <Database className="size-5 text-primary" /> البيانات والنسخ الاحتياطي
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          صدّر نسخة احتياطية كاملة (JSON) أو استورد نسخة سابقة لاستعادة البيانات.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportAll} className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
            <Database className="size-4" /> تصدير نسخة احتياطية
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
            <Upload className="size-4" /> استيراد نسخة احتياطية
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importAll(f);
              e.target.value = "";
            }}
          />
          <button onClick={resetAll} className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20">
            <Trash2 className="size-4" /> مسح جميع البيانات
          </button>
        </div>
      </div>
    </div>
  );
}
