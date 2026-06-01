import { Link, useNavigate } from "@tanstack/react-router";
import { Leaf, LogOut, Menu, X } from "lucide-react";
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
import codingCampLogo from "@/assets/dbs-camp-logo.svg";

const PUBLIC_LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/tentang", label: "Tentang" },
  { to: "/fitur", label: "Fitur" },
  { to: "/tim", label: "Tim" },
];

export function SiteHeader() {
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
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-gradient text-primary-foreground shadow-soft">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">AURA</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-primary bg-secondary" }}
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
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium leading-none">{profile?.full_name ?? "Pengguna"}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABEL[role]}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
            <>
              <Button variant="ghost" asChild>
                <Link to="/warga">Lapor Sekarang</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/auth/login">Masuk</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {user && role ? (
                <>
                  <Button
                    variant="outline"
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
                <>
                  <Button variant="outline" asChild onClick={() => setOpen(false)}>
                    <Link to="/warga">Lapor Sekarang</Link>
                  </Button>
                  <Button variant="ghost" asChild onClick={() => setOpen(false)}>
                    <Link to="/auth/login">Masuk</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-gradient text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">AURA</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Ekosistem tata kota cerdas untuk deteksi dan penanganan kerusakan infrastruktur publik
            secara cepat, transparan, dan berbasis data spasial.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Organized & Supported By</span>
            <img src={codingCampLogo} alt="Coding Camp powered by DBS Foundation" className="h-10 w-fit object-contain opacity-80 hover:opacity-100 transition-opacity dark:invert" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Produk</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/fitur" className="hover:text-foreground">Fitur</Link></li>
            <li><Link to="/tentang" className="hover:text-foreground">Tentang</Link></li>
            <li><Link to="/tim" className="hover:text-foreground">Tim</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Aksi</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/warga" className="hover:text-foreground">Lapor Kerusakan</Link></li>
            <li><Link to="/auth/login" className="hover:text-foreground">Masuk (Admin/Petugas)</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AURA · Coding Camp 2026 powered by DBS Foundation
      </div>
    </footer>
  );
}
