import { createFileRoute } from "@tanstack/react-router";
import { StickerWorkspace } from "@/components/StickerWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";
import { Archive } from "lucide-react";

export const Route = createFileRoute("/_app/functions/archive")({
  head: () => ({ meta: [{ title: "ملصق حاوية للأرشفة | لجنة الامتحانات العامة" }] }),
  component: () => (
    <div>
      <PageHeader
        title="ملصق حاوية للأرشفة"
        description="الملصق الموضوع على الحاوية بعد الاختبار لأرشفة أوراق الإجابة."
        icon={Archive}
      />
      <StickerWorkspace kind="archive" />
    </div>
  ),
});
