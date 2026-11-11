import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LogOut, Leaf, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth, ROLE_HOME, ROLE_LABEL } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const PUBLIC_LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/daerah", label: "Rating Daerah" },
  { to: "/tentang", label: "Tentang" },
  { to: "/fitur", label: "Fitur" },
];

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Leaf className="h-5 w-5" />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${dark ? "text-white" : "text-forest dark:text-foreground"}`}>
        AURA
      </span>
    </span>
  );
}

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const initials = (profile?.full_name ?? user?.email ?? "AU")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className={`${overlay ? "absolute inset-x-0 top-0 pt-8 md:pt-11" : "sticky top-0 pt-3 md:pt-4"} z-40 px-3 md:px-6`}>
      <div className="mx-auto max-w-[1200px] rounded-full border border-border/60 bg-card/90 shadow-soft backdrop-blur-md">
        <div className="flex h-14 items-center justify-between pl-3 pr-2 md:pl-4">
          <Link to="/" aria-label="AURA — Beranda">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "rounded-full px-4 py-2 text-sm font-bold text-forest bg-sage" }}
                activeOptions={{ exact: true }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user && role ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-11 gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-semibold leading-none">{profile?.full_name ?? "Pengguna"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: ROLE_HOME[role] })}>
                    Dashboard saya
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="dark" className="h-11 gap-3 pl-5 pr-1.5">
                <Link to="/warga">
                  Lapor Sekarang
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            )}
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mx-auto mt-2 max-w-[1200px] rounded-3xl border border-border/60 bg-card p-3 shadow-elev md:hidden">
          <div className="flex flex-col gap-1">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {user && role ? (
                <>
                  <Button
                    variant="dark"
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: ROLE_HOME[role] });
                    }}
                  >
                    Dashboard saya
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await signOut();
                      setOpen(false);
                      navigate({ to: "/" });
                    }}
                  >
                    Keluar
                  </Button>
                </>
              ) : (
                <Button variant="dark" asChild onClick={() => setOpen(false)}>
                  <Link to="/warga">Lapor Sekarang</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const nav = [
    { to: "/", t: "Beranda" },
    { to: "/daerah", t: "Rating Daerah & Warga" },
    { to: "/tentang", t: "Tentang" },
    { to: "/fitur", t: "Fitur" },
  ];
  const layanan = [
    { to: "/warga", t: "Lapor Jalan Berlubang" },
    { to: "/auth/login", t: "Masuk Admin / Petugas" },
  ];
  return (
    <footer className="mt-16 rounded-t-[48px] bg-forest text-sage-soft md:rounded-t-[64px]">
      <div className="mx-auto max-w-[1200px] px-5 pb-8 pt-14 md:pt-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sage-soft/80">
              Ekosistem Tata Kota Cerdas untuk pelaporan jalan berlubang di Tangerang Selatan.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white">Navigasi</h4>
            <ul className="mt-4 space-y-3 text-sm text-sage-soft/80">
              {nav.map((l) => (
                <li key={l.t}><Link to={l.to} className="hover:text-primary">{l.t}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white">Layanan</h4>
            <ul className="mt-4 space-y-3 text-sm text-sage-soft/80">
              {layanan.map((l) => (
                <li key={l.t}><Link to={l.to} className="hover:text-primary">{l.t}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-xs text-sage-soft/60 md:flex-row">
          <span>© {new Date().getFullYear()} AURA. Seluruh hak cipta dilindungi.</span>
        </div>
      </div>
    </footer>
  );
}