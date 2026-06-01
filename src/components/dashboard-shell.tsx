import { Link, useLocation } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ArrowLeft, Leaf, LogOut } from "lucide-react";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardShell({
  children,
  nav,
  title,
}: {
  children: ReactNode;
  title: string;
  nav: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  const { profile, role, signOut, user } = useAuth();
  const loc = useLocation();
  const initials = (profile?.full_name ?? user?.email ?? "AU")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar p-4 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-gradient text-primary-foreground shadow-soft">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">AURA</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((n) => {
            const isRootLink = ["/admin", "/petugas", "/warga", "/"].includes(n.to);
            const active = isRootLink 
              ? loc.pathname === n.to 
              : loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-primary text-primary-foreground shadow-soft" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        {user && (
          <div className="mt-4 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {(profile?.resolved_avatar_url || profile?.avatar_url) && (
                  <AvatarImage src={profile.resolved_avatar_url || profile.avatar_url || ""} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile?.full_name ?? "Pengguna"}</p>
                <p className="truncate text-xs text-muted-foreground">{role && ROLE_LABEL[role]}</p>
              </div>
            </div>
            <Button onClick={() => signOut()} variant="ghost" size="sm" className="mt-2 w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" /> Keluar
            </Button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 md:px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            {(() => {
              const backUrl = loc.pathname.startsWith("/admin") && loc.pathname !== "/admin" ? "/admin" : "/";
              return (
                <Link
                  to={backUrl}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Kembali"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              );
            })()}
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            {user && (
              <>
                <Avatar className="h-8 w-8">
                  {(profile?.resolved_avatar_url || profile?.avatar_url) && (
                    <AvatarImage src={profile.resolved_avatar_url || profile.avatar_url || ""} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
                <Button onClick={() => signOut()} variant="ghost" size="icon">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-4 py-2 md:hidden">
          {nav.map((n) => {
            const isRootLink = ["/admin", "/petugas", "/warga", "/"].includes(n.to);
            const active = isRootLink 
              ? loc.pathname === n.to 
              : loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
