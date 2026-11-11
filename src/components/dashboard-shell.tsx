import { Link, useLocation } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Leaf, Radio } from "lucide-react";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
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
  const avatarSrc = profile?.resolved_avatar_url || profile?.avatar_url || "";

  const isActive = (to: string) => {
    const isRootLink = ["/admin", "/petugas", "/warga", "/"].includes(to);
    return isRootLink
      ? loc.pathname === to
      : loc.pathname === to || loc.pathname.startsWith(to + "/");
  };

  const pageTitle = nav.find((n) => isActive(n.to))?.label ?? title;
  const backUrl = loc.pathname.startsWith("/admin") && loc.pathname !== "/admin" ? "/admin" : "/";

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="flex min-h-screen gap-4 bg-sage-soft p-0 md:p-4 dark:bg-background">
      {/* Sidebar */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-[32px] bg-forest p-4 text-white shadow-elev md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-3 pt-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">AURA</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto" aria-label="Menu dashboard">
          {nav.map((n) => {
            const active = isActive(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-full py-2 pl-2 pr-4 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    active ? "bg-white text-forest" : "bg-sage/80 text-forest"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                </span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="mt-4 rounded-3xl bg-white/10 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {avatarSrc && <AvatarImage src={avatarSrc} className="object-cover" />}
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{profile?.full_name ?? "Pengguna"}</p>
                <p className="truncate text-xs text-white/65">{role && ROLE_LABEL[role]}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="mt-3 flex w-full items-center justify-between rounded-full bg-forest/70 py-1.5 pl-4 pr-1.5 text-sm font-semibold text-white transition-colors hover:bg-forest"
            >
              Keluar
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-primary">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Konten */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border/60 bg-card/95 px-4 backdrop-blur md:top-4 md:rounded-full md:border md:px-4 md:shadow-soft">
          <div className="flex items-center gap-3">
            <Link
              to={backUrl}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage text-forest transition-colors hover:bg-primary"
              title="Kembali"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-lg font-extrabold tracking-tight text-forest md:text-xl dark:text-foreground">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden rounded-full bg-sage-soft px-5 py-2.5 text-sm font-semibold text-forest md:inline-block">
              {today}
            </span>
            <span className="hidden h-11 w-11 items-center justify-center rounded-full bg-sage text-forest md:flex">
              <Radio className="h-4 w-4" />
            </span>
            {user && (
              <Avatar className="h-11 w-11">
                {avatarSrc && <AvatarImage src={avatarSrc} className="object-cover" />}
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </header>

        {/* Nav mobile */}
        <nav className="flex gap-2 overflow-x-auto bg-card px-4 py-2 md:hidden" aria-label="Menu dashboard">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                isActive(n.to) ? "bg-forest text-white" : "bg-secondary text-muted-foreground"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
          {user && (
            <button onClick={() => signOut()} className="shrink-0 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-muted-foreground">
              Keluar
            </button>
          )}
        </nav>

        <main className="flex-1 px-4 py-4 md:px-2 md:py-6">{children}</main>
      </div>
    </div>
  );
}