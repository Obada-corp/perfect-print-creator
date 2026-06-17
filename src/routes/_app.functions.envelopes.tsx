import { createFileRoute } from "@tanstack/react-router";
import { StickerWorkspace } from "@/components/StickerWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tag } from "lucide-react";

export const Route = createFileRoute("/_app/functions/envelopes")({
  head: () => ({ meta: [{ title: "ملصقات للمغلفات | لجنة الامتحانات العامة" }] }),
  component: () => (
    <div>
      <PageHeader
        title="ملصقات للمغلفات"
        description="الملصق الموضوع على المغلف قبل الاختبار. يتم إنشاؤه تلقائياً من بيانات الاختبارات اليومية."
        icon={Tag}
      />
      <StickerWorkspace kind="envelope" />
    </div>
  ),
});
