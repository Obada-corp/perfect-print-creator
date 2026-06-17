import { createFileRoute } from "@tanstack/react-router";
import { useStore, type BaseItem } from "@/lib/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { CrudTable } from "@/components/CrudTable";
import { Building } from "lucide-react";

export const Route = createFileRoute("/_app/data/bases")({
  head: () => ({ meta: [{ title: "المقرات | لجنة الامتحانات العامة" }] }),
  component: BasesPage,
});

function BasesPage() {
  const rows = useStore((s) => s.bases);
  const add = useStore((s) => s.addBase);
  const update = useStore((s) => s.updateBase);
  const remove = useStore((s) => s.deleteBase);

  return (
    <div>
      <PageHeader
        title="المقرات"
        description="إدارة مقرات الاختبارات. يستخدم رمز المقر على الملصقات (مثل M / F / RM / RF)."
        icon={Building}
      />
      <CrudTable<BaseItem>
        rows={rows}
        searchKeys={["name", "code"]}
        columns={[
          { key: "code", label: "الرمز" },
          { key: "name", label: "اسم المقر" },
        ]}
        fields={[
          { key: "code", label: "الرمز", required: true, placeholder: "مثل: M / F / RM / RF" },
          { key: "name", label: "اسم المقر", required: true },
        ]}
        onAdd={(v) => add({ code: v.code.trim(), name: v.name.trim() })}
        onUpdate={(id, v) => update(id, { code: v.code.trim(), name: v.name.trim() })}
        onDelete={remove}
        newButtonLabel="إضافة مقر"
        emptyHint="لا توجد مقرات بعد."
      />
    </div>
  );
}
