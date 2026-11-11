import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, Leaf, Lock, Mail, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authImg from "@/assets/pamulang_road.jpg";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Masuk" },
      { name: "description", content: "Masuk ke AURA sebagai Admin Dinas atau Petugas Lapangan untuk mengelola laporan dan work order." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(6, "Minimal 6 karakter").max(128),
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (!loading && user && role) navigate({ to: ROLE_HOME[role] });
  }, [user, role, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Berhasil masuk");
  };

  return (
    <div className="grid min-h-screen bg-sage-soft p-3 md:p-5 lg:grid-cols-2 lg:gap-5 dark:bg-background">
      {/* Panel kiri */}
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
            Selamat datang kembali di kota lebih baik.
          </h2>
          <p className="mt-3 max-w-sm text-white/80">
            Masuk untuk mengirim laporan, mengelola atau memantau dashboard GIS.
          </p>
          <div className="mt-8 flex w-fit items-center gap-4 rounded-3xl border border-white/20 bg-white/10 p-4 pr-6 backdrop-blur-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-extrabold leading-none">94%</p>
              <p className="mt-1 text-xs text-white/80">Penyelesaian laporan bulan ini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel kanan */}
      <div className="flex items-center justify-center rounded-[40px] bg-card p-6 md:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold">AURA</span>
          </Link>

          <h1 className="text-3xl font-extrabold tracking-tight text-forest dark:text-foreground">Masuk ke AURA</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Warga?{" "}
            <Link to="/warga" className="font-bold text-forest underline-offset-4 hover:underline dark:text-primary">
              Mulai Lapor Disini
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-bold">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" placeholder="nama@instansi.go.id" className="pl-11"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-bold">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
                  className="pl-11 pr-12" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-sage hover:text-forest"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-14 w-full items-center justify-between rounded-full bg-primary pl-7 pr-2 text-base font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Memproses…" : "Masuk"}
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-primary">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/auth/signup" className="font-bold text-forest underline-offset-4 hover:underline dark:text-primary">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}