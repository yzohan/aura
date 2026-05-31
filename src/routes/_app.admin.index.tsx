import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
const AdminMap = lazy(() => import("@/components/admin-map"));
import {
  Map as MapIcon, ListChecks, Users, Activity, ShieldCheck, Loader2, MapPin,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { URGENCY_COLORS } from "@/lib/leaflet-setup";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin" }] }),
  component: AdminPage,
});

interface Report {
  id: string;
  reporter_id: string | null;
  category: keyof typeof CATEGORY_LABEL;
  name: string;
  email: string | null;
  no_hp: string;
  detail_laporan: string;
  status_pelaporan: string;
  kategori_pelaporan: string;
  latitude: number;
  longitude: number;
  address: string | null;
  created_at: string;
  photo_url?: string | null;
}

interface Petugas {
  id: string;
  full_name: string;
}


function buildMonthlyData(reports: Report[]) {
  const now = new Date();
  const months: { label: string; key: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    months.push({ label, key });
  }

  return months.map(({ label, key }) => {
    const monthReports = reports.filter((r) => r.created_at.startsWith(key));
    return {
      bulan: label,
      total: monthReports.length,
      selesai: monthReports.filter((r) => r.status_pelaporan === "resolved").length,
      belumSelesai: monthReports.filter((r) => r.status_pelaporan !== "resolved").length,
    };
  });
}

function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [petugas, setPetugas] = useState<Petugas[]>([]);
  const [adminName, setAdminName] = useState<string>("");
  const [aliScore, setAliScore] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const loadData = async () => {
    const [{ data: rep }, { data: roleRows }, { data: aliData }] = await Promise.all([
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "petugas"),
      supabase.from("metadata_ali").select("total_index_ali").eq("id", 1).maybeSingle(),
    ]);
    setReports((rep ?? []) as Report[]);
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setPetugas((profs ?? []) as Petugas[]);
    }
    if (aliData?.total_index_ali !== undefined) {
      setAliScore(aliData.total_index_ali);
    }

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile?.full_name) {
        setAdminName(profile.full_name);
      }
    }
    setLoadingData(false);
  };

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("admin-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadData)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filtered = useMemo(() => {
    return reports.filter((r) =>
      (filterStatus === "all" || r.status_pelaporan === filterStatus) &&
      (filterCategory === "all" || r.category === filterCategory)
    );
  }, [reports, filterStatus, filterCategory]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status_pelaporan === "pending").length,
    inProgress: reports.filter((r) => r.status_pelaporan === "in_progress" || r.status_pelaporan === "progress").length,
    resolved: reports.filter((r) => r.status_pelaporan === "resolved").length,
  }), [reports]);

  const monthlyData = useMemo(() => buildMonthlyData(reports), [reports]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const center: [number, number] = filtered[0]
    ? [filtered[0].latitude, filtered[0].longitude]
    : [-6.2, 106.816];

  return (
    <div className="space-y-6">
      {/* ── Welcome Section ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground md:text-2xl">
              Selamat Datang Kembali, {adminName || "Admin Aura"}!
            </h1>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formattedDate} Pantau sebaran kerusakan kota dan kelola laporan warga secara langsung.
          </p>
        </div>

        {/* AURA Location Index Widget */}
        <Card className="flex items-center gap-3.5 px-4 py-2.5 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 shadow-soft shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">AURA Location Index (ALI)</p>
            <p className="text-lg font-extrabold text-primary mt-0.5">
              {aliScore !== null ? aliScore.toFixed(2) : "0.00"}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard 
          icon={ListChecks} 
          label="Total Laporan" 
          value={stats.total} 
          tone="text-primary" 
          borderTone="border-l-primary"
          iconBg="bg-primary/10"
          description="Total keluhan warga masuk"
        />
        <StatCard 
          icon={Activity} 
          label="Menunggu" 
          value={stats.pending} 
          tone="text-warning" 
          borderTone="border-l-warning"
          iconBg="bg-warning/10"
          description="Membutuhkan verifikasi"
        />
        <StatCard 
          icon={Users} 
          label="Dikerjakan" 
          value={stats.inProgress} 
          tone="text-accent" 
          borderTone="border-l-accent"
          iconBg="bg-accent/10"
          description="Penanganan oleh petugas"
        />
        <StatCard 
          icon={ShieldCheck} 
          label="Selesai" 
          value={stats.resolved} 
          tone="text-success" 
          borderTone="border-l-success"
          iconBg="bg-success/10"
          description="Laporan tuntas diperbaiki"
        />
      </div>

      {/* ── Analytics & Statistics ── */}
      <Card className="p-5 shadow-soft border border-border/80 rounded-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-foreground md:text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Statistik & Performa Penyelesaian Laporan
            </h2>
            <p className="text-xs text-muted-foreground">
              Tren bulanan laporan masuk vs laporan yang berhasil diselesaikan
            </p>
          </div>
          {/* Key Metrics inside Chart Header */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border/40 pt-3 sm:border-0 sm:pt-0">
            {/* Metric 1 */}
            <div className="pr-4 border-r border-border/40 last:border-0 last:pr-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Penyelesaian (Bulan Ini)
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-success">
                  {monthlyData[monthlyData.length - 1]?.selesai ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  laporan
                </span>
              </div>
            </div>
            {/* Metric 2 */}
            <div className="pr-4 border-r border-border/40 last:border-0 last:pr-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Rasio Penyelesaian
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-primary">
                  {(() => {
                    const total = reports.length;
                    const resolved = stats.resolved;
                    return total > 0 ? ((resolved / total) * 100).toFixed(1) : "0";
                  })()}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {loadingData ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
                <XAxis 
                  dataKey="bulan" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} 
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} 
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const completionRate = data.total > 0 ? ((data.selesai / data.total) * 100).toFixed(0) : 0;
                      return (
                        <div className="rounded-xl border border-border bg-card p-3 shadow-elev text-xs space-y-1.5 min-w-[150px]">
                          <p className="font-bold text-foreground border-b border-border/50 pb-1 mb-1">{data.bulan}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              Laporan Masuk:
                            </span>
                            <span className="font-bold text-foreground">{data.total}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="h-2 w-2 rounded-full bg-success" />
                              Terselesaikan:
                            </span>
                            <span className="font-bold text-success">{data.selesai}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-1.5 mt-1">
                            <span className="text-muted-foreground font-medium">Rasio Selesai:</span>
                            <span className="font-bold text-primary">{completionRate}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, fill: "var(--color-foreground)" }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Laporan Masuk"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="selesai"
                  name="Laporan Terselesaikan"
                  stroke="var(--color-success)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSelesai)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ── Map + list ── */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative p-0 shadow-soft border border-border/80 overflow-hidden rounded-2xl">
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-card rounded-t-xl">
            <h2 className="font-semibold text-sm">Peta Sebaran Kerusakan</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-36 select-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 w-40 select-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => {
                    const Icon = CATEGORY_ICON[k as keyof typeof CATEGORY_ICON];
                    return (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span>{v}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Map height is h-[350px] on mobile and md:h-[560px] on desktop */}
          <div className="relative z-0 h-[350px] w-full md:h-[560px]">
            {loadingData ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Suspense fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }>
                <AdminMap reports={filtered} center={center} />
              </Suspense>
            )}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-border bg-secondary/30 p-3 text-[10px] text-muted-foreground/90 font-medium">
            <span className="font-semibold">Legenda Urgensi:</span>
            {Object.entries(URGENCY_LABEL).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: URGENCY_COLORS[k] }} /> {v}
              </span>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col p-0 shadow-soft border border-border/80 rounded-2xl overflow-hidden bg-card">
          <div className="border-b border-border p-4 bg-secondary/10">
            <h2 className="font-bold text-sm text-foreground">Daftar Laporan Terbaru</h2>
            <p className="text-[11px] text-muted-foreground">{filtered.length} laporan dalam pantauan</p>
          </div>
          <div className="max-h-[500px] md:max-h-[600px] flex-1 space-y-3 overflow-y-auto p-4">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs text-muted-foreground italic">Tidak ada laporan dengan filter ini.</p>
              </div>
            )}
            {filtered.map((r) => {
              const Icon = CATEGORY_ICON[r.category as keyof typeof CATEGORY_ICON] || MapPin;
              const photoUrl = r.photo_url 
                ? supabase.storage.from("reports").getPublicUrl(r.photo_url).data.publicUrl
                : null;
              return (
                <div
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl border border-border/85 p-3 cursor-pointer hover:bg-secondary/15 transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-sm hover:shadow-soft"
                  onClick={() => navigate({ to: "/admin/reports/$id", params: { id: r.id } })}
                >
                  {/* Thumbnail */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary/40 border border-border/50">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={r.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/30 to-secondary/10 text-muted-foreground">
                        <Icon className="h-5 w-5 opacity-60" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate leading-tight">
                        {r.name} - {r.no_hp}
                      </p>
                      <Badge variant="outline" className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border-none font-semibold ${r.status_pelaporan === 'progress' ? STATUS_TONE.in_progress : (STATUS_TONE[r.status_pelaporan as keyof typeof STATUS_TONE] || 'bg-secondary text-secondary-foreground')}`}>
                        {r.status_pelaporan === 'progress' ? 'Dikerjakan' : (STATUS_LABEL[r.status_pelaporan as keyof typeof STATUS_LABEL] || r.status_pelaporan)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{r.detail_laporan}</p>
                    <div className="mt-2.5 flex items-center justify-between text-[9px] text-muted-foreground/80 font-medium">
                      <span className="flex items-center gap-1 truncate max-w-[120px]">
                        <MapPin className="h-3 w-3 text-primary/60 shrink-0" />
                        {r.address || "GPS Location"}
                      </span>
                      <span className="bg-secondary/40 px-1.5 py-0.5 rounded text-[8px] font-semibold text-primary uppercase shrink-0">
                        {r.kategori_pelaporan === 'ringan' ? 'Ringan' : (URGENCY_LABEL[r.kategori_pelaporan as keyof typeof URGENCY_LABEL] || r.kategori_pelaporan)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, tone, borderTone, iconBg, description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
  borderTone: string;
  iconBg: string;
  description: string;
}) {
  return (
    <Card className={`p-4 shadow-soft hover:shadow-elev border-l-4 ${borderTone} hover:-translate-y-1 transition-all duration-300 rounded-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg} ${tone} shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-2 text-[9px] text-muted-foreground/80 font-medium italic">{description}</p>
    </Card>
  );
}
