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
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, role: currentRole, loading } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

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
            Bergabung sebagai warga kota cerdas.
          </h2>
          <p className="mt-3 max-w-sm text-primary-foreground/85">
            Daftarkan diri Anda untuk mulai melaporkan kerusakan infrastruktur dan memantau perkembangannya secara transparan.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© {new Date().getFullYear()} AURA</p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">
            Buat akun{" "}
            <span className="bg-leaf-gradient bg-clip-text text-transparent inline-flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> warga
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/auth/login" className="font-medium text-primary hover:underline">
              Masuk
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nama lengkap</Label>
              <Input id="full_name" placeholder="Nathan" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="nama@gmail.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" placeholder="Password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-leaf-gradient text-primary-foreground hover:opacity-90">
              {submitting ? "Memproses…" : "Daftar sebagai Warga"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
