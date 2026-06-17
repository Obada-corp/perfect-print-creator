import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShieldCheck, Plus, Pencil, Trash2, Crown, X } from "lucide-react";
import { useCurrentUser, useStore, ALL_PERMISSIONS, type Permission, type AdminUser } from "@/lib/store";
import { useState } from "react";
import { Modal } from "@/components/CrudTable";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings/admins")({
  head: () => ({ meta: [{ title: "إدارة المشرفين | لجنة الامتحانات العامة" }] }),
  component: AdminsPage,
});

function AdminsPage() {
  const me = useCurrentUser();
  const admins = useStore((s) => s.admins);
  const add = useStore((s) => s.addAdmin);
  const update = useStore((s) => s.updateAdmin);
  const remove = useStore((s) => s.deleteAdmin);
  const [editing, setEditing] = useState<AdminUser | "new" | null>(null);

  if (!me?.isSupreme) {
    return (
      <div>
        <PageHeader title="إدارة المشرفين" icon={ShieldCheck} />
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          هذه الصفحة متاحة فقط للمشرف الأعلى.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="إدارة المشرفين"
        description="إضافة وحذف المشرفين، وتحديد الصلاحيات الخاصة بكل منهم."
        icon={ShieldCheck}
        actions={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow"
          >
            <Plus className="size-4" /> إضافة مشرف
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {admins.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-primary-foreground">
                  {a.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold">
                    {a.name}
                    {a.isSupreme && <Crown className="size-4 text-warning" />}
                  </div>
                  <div className="text-xs text-muted-foreground">@{a.username}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(a)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="تعديل"><Pencil className="size-4" /></button>
                {!a.isSupreme && (
                  <button onClick={() => { remove(a.id); toast.success("تم الحذف"); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="حذف"><Trash2 className="size-4" /></button>
                )}
              </div>
            </div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">الصلاحيات</div>
            <div className="flex flex-wrap gap-1.5">
              {a.isSupreme ? (
                <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning-foreground" style={{ color: "oklch(0.5 0.15 60)" }}>صلاحيات كاملة</span>
              ) : a.permissions.length === 0 ? (
                <span className="text-xs text-muted-foreground">لا توجد صلاحيات</span>
              ) : (
                ALL_PERMISSIONS.filter((p) => a.permissions.includes(p.key)).map((p) => (
                  <span key={p.key} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{p.label}</span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? "إضافة مشرف" : "تعديل مشرف"} size="lg">
          <AdminForm
            initial={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => {
              if (editing === "new") {
                add(v);
                toast.success("تم إضافة المشرف");
              } else {
                update(editing.id, v);
                toast.success("تم التحديث");
              }
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function AdminForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: AdminUser | null;
  onSubmit: (v: { name: string; username: string; password: string; permissions: Permission[] }) => void;
  onCancel: () => void;
}) {
  const isSupreme = !!initial?.isSupreme;
  const [name, setName] = useState(initial?.name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [perms, setPerms] = useState<Permission[]>(
    initial?.permissions ?? ALL_PERMISSIONS.map((p) => p.key),
  );

  const toggle = (k: Permission) =>
    setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name: name.trim(),
          username: username.trim(),
          password,
          permissions: isSupreme ? ALL_PERMISSIONS.map((p) => p.key) : perms,
        });
      }}
      className="space-y-4"
    >
      {isSupreme && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold" style={{ color: "oklch(0.5 0.15 60)" }}>
          المشرف الأعلى — جميع الصلاحيات ممنوحة تلقائياً.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">الاسم الكامل</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold">اسم المستخدم</label>
          <input required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold">كلمة المرور</label>
          <input required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      {!isSupreme && (
        <div>
          <div className="mb-2 text-sm font-bold">الصلاحيات</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_PERMISSIONS.map((p) => (
              <label key={p.key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-muted/50">
                <input type="checkbox" checked={perms.includes(p.key)} onChange={() => toggle(p.key)} className="size-4 accent-primary" />
                {p.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">إلغاء</button>
        <button type="submit" className="rounded-lg gradient-primary px-5 py-2 text-sm font-bold text-primary-foreground">حفظ</button>
      </div>
    </form>
  );
}
