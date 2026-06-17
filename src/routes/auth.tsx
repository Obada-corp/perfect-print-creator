import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Users,
  BookOpen,
  CalendarDays,
  Tag,
  Archive,
  ClipboardList,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import universityLogo from "@/assets/university_logo.png.asset.json";
import collegeLogo from "@/assets/college_logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | لجنة الامتحانات العامة" },
      { name: "description", content: "تسجيل الدخول إلى منصة لجنة الامتحانات العامة." },
    ],
  }),
  component: AuthPage,
});

const features = [
  { icon: Users, t: "إدارة الأعضاء", d: "قاعدة بيانات أعضاء الكلية، الرقم الجامعي مرجع ثابت." },
  { icon: BookOpen, t: "المقررات والأقسام", d: "ربط تلقائي بين المقررات والمدرسين والأقسام." },
  { icon: CalendarDays, t: "جدولة الامتحانات", d: "إدخال يومي ذكي مع منع التعارضات في القاعات." },
  { icon: Tag, t: "ملصقات المظاريف", d: "توليد ملصقات الكنترول بضغطة واحدة." },
  { icon: Archive, t: "ملصقات الأرشفة", d: "ملصق حاوية أوراق الإجابة بعد الاختبار." },
  { icon: ClipboardList, t: "جداول المراقبة", d: "جدول مراقبات كل عضو، جاهز للطباعة." },
  { icon: ClipboardCheck, t: "تتبع الاستلام والتسليم", d: "ثلاث مراحل: من المدرس، إلى المدرس، الأرشيف." },
  { icon: BarChart3, t: "تقارير وإحصاءات", d: "نظرة شاملة على الكنترول واللجنة." },
];

function AuthPage() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const currentUserId = useStore((s) => s.currentUserId);
  const hydrated = useStore((s) => s.hasHydrated);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && currentUserId) navigate({ to: "/dashboard", replace: true });
  }, [hydrated, currentUserId, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const u = login(username, password);
    setLoading(false);
    if (u) {
      toast.success(`أهلاً ${u.name}`);
      navigate({ to: "/dashboard", replace: true });
    } else {
      setError("اسم المستخدم أو كلمة المرور غير صحيحة. حاول مرة أخرى.");
      toast.error("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  return (
    <div className="min-h-screen app-backdrop">
      <div aria-hidden className="fixed inset-x-0 top-0 z-20 h-[3px] gradient-brand" />

      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-0 px-4 py-8 md:grid-cols-2 md:gap-10 md:px-8 md:py-12">
        {/* Brand panel */}
        <section className="relative order-2 hidden overflow-hidden rounded-[28px] brand-mesh text-white shadow-elev md:order-1 md:flex">
          {/* Subtle single triangle watermark — bottom-left only */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 size-80 opacity-[0.10]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 280'><polygon points='0,280 140,280 70,160' fill='%23ffffff'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
            }}
          />

          <div className="relative flex w-full flex-col justify-between p-10">
            <div>
              <div className="mb-8 inline-flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
                <img src={universityLogo.url} alt="جامعة القصيم" className="h-14 w-auto object-contain" />
              </div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">
                <span className="size-1.5 rounded-full bg-[var(--brand-lime)]" />
                Qassim University · CBE
              </div>
              <h2 className="text-[2.2rem] font-extrabold leading-tight tracking-tight">
                لجنة <br />
                <span className="text-[var(--brand-lime)]">الامتحانات العامة</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
                منصة موحدة لإدارة الاختبارات النهائية، الأعضاء، المقررات،
                وملصقات الكنترول والأرشفة — لكلية الأعمال والاقتصاد بجامعة القصيم.
              </p>

              <div className="mt-7 grid grid-cols-2 gap-2.5">
                {features.map((f) => (
                  <div key={f.t} className="flex items-start gap-2.5 rounded-xl border border-white/12 bg-white/5 p-2.5 backdrop-blur-sm">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-lime)] text-[var(--brand-navy)]">
                      <f.icon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold leading-tight">{f.t}</div>
                      <div className="text-[10.5px] leading-snug text-white/65">{f.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/15 pt-5">
              <div className="flex items-center gap-2.5">
                <img src={collegeLogo.url} alt="CBE — AACSB" className="h-8 w-auto rounded bg-white p-1" />
                <div className="text-[11px] leading-tight text-white/70">
                  AACSB Accredited
                  <br />
                  College of Business & Economics
                </div>
              </div>
              <div className="text-[11px] text-white/60">© {new Date().getFullYear()}</div>
            </div>
          </div>
        </section>

        {/* Login form */}
        <section className="order-1 flex items-center md:order-2">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 md:hidden">
              <div className="mx-auto mb-5 inline-flex items-center justify-center rounded-2xl bg-card p-3 shadow-soft ring-1 ring-border">
                <img src={universityLogo.url} alt="جامعة القصيم" className="h-14 w-auto object-contain" />
              </div>
              <h1 className="text-center text-2xl font-extrabold tracking-tight">
                لجنة الامتحانات العامة
              </h1>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-elev">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 gradient-brand" />
              <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                <ShieldCheck className="size-3.5" />
                Sign in
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-card-foreground">
                تسجيل الدخول
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ادخل بياناتك للوصول إلى لوحة التحكم.
              </p>

              <form onSubmit={submit} className="mt-7">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  اسم المستخدم
                </label>
                <div className="relative mb-4">
                  <User className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(null); }}
                    className="w-full rounded-xl border border-input bg-background py-3 pr-10 pl-3 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30"
                    placeholder="الاسم الكامل"
                  />
                </div>

                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  كلمة المرور
                </label>
                <div className="relative mb-3">
                  <Lock className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className="w-full rounded-xl border border-input bg-background py-3 pr-10 pl-10 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring/30"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>

                {error && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-extrabold text-white shadow-glow transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? "جاري الدخول..." : "دخول إلى المنصة"}
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} كلية الأعمال والاقتصاد · جامعة القصيم
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
