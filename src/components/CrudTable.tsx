import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";

export interface CrudColumn<T> {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface CrudField {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "tel" | "select" | "date";
  options?: readonly string[];
  optionLabels?: Record<string, string>;
  required?: boolean;
  placeholder?: string;
}

export function CrudTable<T extends { id: string }>({
  rows,
  columns,
  fields,
  onAdd,
  onUpdate,
  onDelete,
  searchKeys,
  emptyHint,
  newButtonLabel = "إضافة جديد",
}: {
  rows: T[];
  columns: CrudColumn<T>[];
  fields: CrudField[];
  onAdd: (v: Record<string, string>) => void;
  onUpdate: (id: string, v: Record<string, string>) => void;
  onDelete: (id: string) => void;
  searchKeys: (keyof T & string)[];
  emptyHint?: string;
  newButtonLabel?: string;
}) {
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const filtered = q
    ? rows.filter((r) =>
        searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q.toLowerCase())),
      )
    : rows;

  const start = (row: T | "new") => setEditing(row);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث..."
            className="w-full rounded-lg border border-input bg-background py-2 pr-9 pl-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <button
          onClick={() => start("new")}
          className="inline-flex items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-soft transition-all hover:shadow-glow"
        >
          <Plus className="size-4" />
          {newButtonLabel}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-right text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                  {c.label}
                </th>
              ))}
              <th className="w-28 px-4 py-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-sm text-muted-foreground">
                  {emptyHint || "لا توجد بيانات بعد."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-border transition-colors hover:bg-muted/30">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => start(row)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        title="تعديل"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDel(row.id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="حذف"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === "new" ? newButtonLabel : "تعديل"}>
          <CrudForm
            fields={fields}
            initial={editing === "new" ? {} : (editing as unknown as Record<string, string>)}
            onCancel={() => setEditing(null)}
            onSubmit={(v) => {
              if (editing === "new") {
                onAdd(v);
                toast.success("تمت الإضافة بنجاح");
              } else {
                onUpdate((editing as T).id, v);
                toast.success("تم تحديث البيانات");
              }
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} title="تأكيد الحذف">
          <p className="mb-5 text-sm text-muted-foreground">
            هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDel(null)}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                onDelete(confirmDel);
                setConfirmDel(null);
                toast.success("تم الحذف");
              }}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90"
            >
              حذف
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function Modal({
  children,
  onClose,
  title,
  size = "md",
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  size?: "md" | "lg";
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[90vh] w-full ${size === "lg" ? "max-w-3xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-glow`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CrudForm({
  fields,
  initial,
  onSubmit,
  onCancel,
}: {
  fields: CrudField[];
  initial: Record<string, string>;
  onSubmit: (v: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    fields.forEach((f) => (v[f.key] = String(initial[f.key] ?? "")));
    return v;
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      {fields.map((f) => (
        <div key={f.key} className={f.type === "select" || fields.length === 1 ? "sm:col-span-2" : ""}>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            {f.label} {f.required && <span className="text-destructive">*</span>}
          </label>
          {f.type === "select" ? (
            <select
              required={f.required}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            >
              <option value="">— اختر —</option>
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {f.optionLabels?.[o] ?? o}
                </option>
              ))}
            </select>
          ) : (
            <input
              required={f.required}
              type={f.type ?? "text"}
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
          )}
        </div>
      ))}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="rounded-lg gradient-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-soft hover:shadow-glow"
        >
          حفظ
        </button>
      </div>
    </form>
  );
}
