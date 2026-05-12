import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Leaf, Users, Wrench, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_HOME, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [
      { title: "Daftar" },
      { name: "description", content: "Buat akun AURA sebagai Warga, Petugas Lapangan, atau Admin Dinas." },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(6, "Minimal 6 karakter").max(128),
  role: z.enum(["warga", "petugas", "admin"]),
});

const ROLES: { value: AppRole; label: string; icon: typeof Users; desc: string }[] = [
  { value: "warga", label: "Warga", icon: Users, desc: "Lapor kerusakan di sekitarmu." },
  { value: "petugas", label: "Petugas Lapangan", icon: Wrench, desc: "Terima dan tangani work order." },
  { value: "admin", label: "Admin Dinas", icon: ShieldCheck, desc: "Pantau peta GIS & kelola kota." },
];

function SignupPage() {
  const navigate = useNavigate();
  const { user, role: currentRole, loading } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [role, setRole] = useState<AppRole>("warga");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && currentRole) navigate({ to: ROLE_HOME[currentRole] });
  }, [user, currentRole, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, role });
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
          role: parsed.data.role,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Akun berhasil dibuat!");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="hidden bg-hero-gradient p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">AURA</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-balance">
            Bergabung dengan ekosistem tata kota cerdas.
          </h2>
          <p className="mt-3 max-w-sm text-primary-foreground/85">
            Pilih peranmu — bersama kita ciptakan kota yang lebih responsif terhadap warganya.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} AURA</p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">Buat akun AURA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/auth/login" className="font-medium text-primary hover:underline">
              Masuk
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Daftar sebagai</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setRole(value)}
                    className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                      role === value
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${role === value ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="text-[10px] leading-tight text-muted-foreground">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nama lengkap</Label>
              <Input id="full_name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Nomor HP <span className="text-muted-foreground">(opsional)</span></Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-leaf-gradient text-primary-foreground hover:opacity-90">
              {submitting ? "Memproses…" : "Daftar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
