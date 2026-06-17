import { createFileRoute } from "@tanstack/react-router";
import { useStore, RANKS, type Member } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { CrudTable } from "@/components/CrudTable";
import { Users, Filter } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_app/data/members")({
  head: () => ({ meta: [{ title: "أعضاء هيئة التدريس | لجنة الامتحانات العامة" }] }),
  component: MembersPage,
});

function MembersPage() {
  const rows = useStore((s) => s.members);
  const departments = useStore((s) => s.departments);
  const bases = useStore((s) => s.bases);
  const add = useStore((s) => s.addMember);
  const update = useStore((s) => s.updateMember);
  const remove = useStore((s) => s.deleteMember);

  const [filterDept, setFilterDept] = useState("");
  const [filterBase, setFilterBase] = useState("");
  const [filterRank, setFilterRank] = useState("");

  const deptOptions = departments.map((d) => d.code);
  const deptLabels: Record<string, string> = Object.fromEntries(
    departments.map((d) => [d.code, `${d.code} — ${d.name}`]),
  );
  const baseOptions = bases.map((b) => b.name);
  const baseLabels: Record<string, string> = Object.fromEntries(
    bases.map((b) => [b.name, `${b.name} (${b.code})`]),
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!filterDept || r.department === filterDept) &&
          (!filterBase || r.base === filterBase) &&
          (!filterRank || r.rank === filterRank),
      ),
    [rows, filterDept, filterBase, filterRank],
  );

  const baseCodeOf = (name: string) => bases.find((b) => b.name === name)?.code ?? "";

  return (
    <div>
      <PageHeader
        title="أعضاء هيئة التدريس"
        description="قاعدة بيانات أعضاء الكلية. الرقم الجامعي هو المرجع الأساسي ولا يتأثر بتغيير الاسم أو البيانات الأخرى."
        icon={Users}
      />

      <div className="no-print mb-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Filter className="size-4 text-primary" /> تصفية الأعضاء
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل الأقسام</option>
            {departments.map((d) => <option key={d.id} value={d.code}>{d.code} — {d.name}</option>)}
          </select>
          <select value={filterBase} onChange={(e) => setFilterBase(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل المقرات</option>
            {bases.map((b) => <option key={b.id} value={b.name}>{b.name} ({b.code})</option>)}
          </select>
          <select value={filterRank} onChange={(e) => setFilterRank(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">كل الرتب</option>
            {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={() => { setFilterDept(""); setFilterBase(""); setFilterRank(""); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            تفريغ الفلاتر
          </button>
        </div>
      </div>

      <CrudTable<Member>
        rows={filtered}
        searchKeys={["name", "universityId", "email", "mobile", "extension"]}
        columns={[
          { key: "universityId", label: "الرقم الجامعي", render: (r) => r.universityId || "—" },
          { key: "name", label: "الاسم" },
          {
            key: "base",
            label: "المقر",
            render: (r) => (r.base ? `${r.base}${baseCodeOf(r.base) ? ` (${baseCodeOf(r.base)})` : ""}` : "—"),
          },
          {
            key: "department",
            label: "القسم",
            render: (r) => {
              const d = departments.find((x) => x.code === r.department);
              return d ? d.name : r.department || "—";
            },
          },
          { key: "rank", label: "الرتبة" },
          { key: "mobile", label: "الجوال" },
          { key: "extension", label: "التحويلة" },
        ]}
        fields={[
          { key: "universityId", label: "الرقم الجامعي", required: true, placeholder: "المرجع الثابت للعضو" },
          { key: "name", label: "الاسم", required: true },
          {
            key: "base",
            label: "المقر",
            type: "select",
            options: baseOptions,
            optionLabels: baseLabels,
            required: true,
          },
          {
            key: "department",
            label: "القسم",
            type: "select",
            options: deptOptions,
            optionLabels: deptLabels,
          },
          { key: "rank", label: "الرتبة الوظيفية", type: "select", options: RANKS, required: true },
          { key: "mobile", label: "رقم الجوال", type: "tel" },
          { key: "extension", label: "رقم التحويلة" },
          { key: "email", label: "البريد الإلكتروني الرسمي", type: "email" },
        ]}
        onAdd={(v) => {
          if (v.universityId && rows.some((m) => m.universityId === v.universityId.trim())) {
            // toast handled inside CrudTable success — soft duplicate warning here
            console.warn("duplicate universityId");
          }
          add({
            universityId: (v.universityId || "").trim(),
            name: v.name,
            base: v.base,
            rank: v.rank as Member["rank"],
            mobile: v.mobile,
            extension: v.extension,
            email: v.email,
            department: v.department,
          });
        }}
        onUpdate={(id, v) =>
          update(id, {
            universityId: (v.universityId || "").trim(),
            name: v.name,
            base: v.base,
            rank: v.rank as Member["rank"],
            mobile: v.mobile,
            extension: v.extension,
            email: v.email,
            department: v.department,
          })
        }
        onDelete={remove}
        newButtonLabel="إضافة عضو"
        emptyHint="ابدأ بإضافة أول عضو في هيئة التدريس."
      />
    </div>
  );
}
