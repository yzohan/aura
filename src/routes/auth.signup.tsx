import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Leaf, Lock, Mail, User, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authImg from "@/assets/rawa_buntu_road.jpg";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [
      { title: "Daftar" },
      { name: "description", content: "Buat akun pengelola AURA." },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(6, "Minimal 6 karakter").max(128),
});

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}
const STRENGTH_LABEL = ["Minimal 6 karakter", "Lemah", "Cukup", "Bagus", "Kuat"];

function SignupPage() {
  const navigate = useNavigate();
  const { user, role: currentRole, loading } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const score = form.password ? strength(form.password) : 0;

  useEffect(() => {
    if (!loading && user && currentRole) navigate({ to: ROLE_HOME[currentRole] });
  }, [user, currentRole, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone || null,
          role: (parsed.data.email === "atmint@gmail.com" || parsed.data.email === "admin@aura.com" || parsed.data.email === "super@aura.com") ? "admin" : "warga",
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Akun berhasil dibuat! Silakan masuk.");
    navigate({ to: "/auth/login" });
  };

  return (
    <div className="grid min-h-screen bg-sage-soft p-3 md:p-5 lg:grid-cols-2 lg:gap-5 dark:bg-background">
      <div className="relative hidden overflow-hidden rounded-[40px] bg-forest p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <img src={authImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-forest/20" />
        <Link to="/" className="relative flex items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">AURA</span>
        </Link>

        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight text-balance">
            Bergabung sebagai warga kota cerdas.
          </h2>
          <p className="mt-3 max-w-sm text-white/80">
            Buat akun untuk mulai memantau laporan infrastruktur dan penanganannya secara transparan.
          </p>
          <div className="mt-8 flex w-fit items-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-4 pr-6 backdrop-blur-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-extrabold leading-none">2.4k+</p>
              <p className="mt-1 text-xs text-white/80">Laporan Selesai</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center rounded-[40px] bg-card p-6 md:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold">AURA</span>
          </Link>

          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UserPlus className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-forest dark:text-foreground">Buat akun</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/auth/login" className="font-bold text-forest underline-offset-4 hover:underline dark:text-primary">
              Masuk
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="font-bold">Nama lengkap</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="full_name" placeholder="Nathan" className="pl-11"
                  value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-bold">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" placeholder="nama@gmail.com" className="pl-11"
                  value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-bold">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="Minimal 6 karakter"
                  className="pl-11 pr-12" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-sage hover:text-forest"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-1.5 pt-1.5" aria-hidden>
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? "bg-primary" : "bg-sage"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.password ? `Kekuatan: ${STRENGTH_LABEL[score]}` : STRENGTH_LABEL[0]}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-14 w-full items-center justify-between rounded-full bg-primary pl-7 pr-2 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Memproses…" : "Daftar"}
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-primary">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}