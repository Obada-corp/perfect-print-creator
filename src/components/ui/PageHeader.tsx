import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  eyebrow,
  showBack = true,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
  eyebrow?: string;
  showBack?: boolean;
}) {
  const router = useRouter();
  return (
    <section className="no-print relative mb-8 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
      {/* Right edge gradient ribbon (RTL leading edge) */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1 gradient-brand" />

      <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="flex items-start gap-5">
          {Icon && (
            <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl gradient-brand text-white shadow-glow">
              <Icon className="size-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-3">
              {showBack && (
                <button
                  onClick={() => router.history.back()}
                  className="inline-flex items-center gap-1 rounded-full border border-input bg-background px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="رجوع"
                >
                  <ArrowRight className="size-3.5" />
                  رجوع
                </button>
              )}
              <span className="inline-block h-1.5 w-6 rounded-full bg-accent" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                {eyebrow ?? "لجنة الامتحانات العامة"}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-[2rem] md:leading-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}
