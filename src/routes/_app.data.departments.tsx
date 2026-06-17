import { createFileRoute } from "@tanstack/react-router";
import { useStore, type Department } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { CrudTable } from "@/components/CrudTable";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/_app/data/departments")({
  head: () => ({ meta: [{ title: "الأقسام | لجنة الامتحانات العامة" }] }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const rows = useStore((s) => s.departments);
  const add = useStore((s) => s.addDepartment);
  const update = useStore((s) => s.updateDepartment);
  const remove = useStore((s) => s.deleteDepartment);

  return (
    <div>
      <PageHeader
        title="الأقسام الأكاديمية"
        description="قاعدة بيانات الأقسام. تُستخدم تلقائياً في المقررات والاختبارات والملصقات."
        icon={Building2}
      />
      <CrudTable<Department>
        rows={rows}
        searchKeys={["code", "name"]}
        columns={[
          { key: "code", label: "رمز القسم" },
          { key: "name", label: "اسم القسم" },
        ]}
        fields={[
          { key: "code", label: "رمز القسم", required: true, placeholder: "MIS" },
          { key: "name", label: "اسم القسم", required: true, placeholder: "نظم المعلومات الإدارية" },
        ]}
        onAdd={(v) => add({ code: v.code.trim(), name: v.name.trim() })}
        onUpdate={(id, v) => update(id, { code: v.code.trim(), name: v.name.trim() })}
        onDelete={remove}
        newButtonLabel="إضافة قسم"
        emptyHint="ابدأ بإضافة أول قسم أكاديمي."
      />
    </div>
  );
}
