import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
const AdminMap = lazy(() => import("@/components/admin-map"));
import {
  ListChecks, Clock, Wrench, CheckCircle2, Activity, Loader2, MapPin, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { URGENCY_COLORS, TANGSEL_CENTER } from "@/lib/leaflet-setup";
import { KECAMATAN_LIST, findKecamatanByCoords } from "@/lib/tangsel-data";
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
  const [filterKecamatan, setFilterKecamatan] = useState<string>("all");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const loadData = async () => {
    const [{ data: rep }, { data: roleRows }, { data: aliData }] = await Promise.all([
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "petugas"),
      supabase.from("metadata_ali").select("total_index_ali").eq("id", 1).maybeSingle(),
    ]);
    setReports((rep ?? []) as Report[]);

    // Batch load signed URLs for private photos
    const paths = (rep ?? []).map((r) => r.photo_url).filter(Boolean) as string[];
    if (paths.length > 0) {
      const { data: signedData, error: signedErr } = await supabase.storage
        .from("reports")
        .createSignedUrls(paths, 3600);
      if (!signedErr && signedData) {
        const urlsMap: Record<string, string> = {};
        signedData.forEach((item) => {
          if (item.error === null && item.signedUrl) {
            urlsMap[item.path] = item.signedUrl;
          }
        });
        setSignedUrls(urlsMap);
      }
    }

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
    return reports.filter((r) => {
      const matchStatus = filterStatus === "all" || r.status_pelaporan === filterStatus;
      const matchCategory = filterCategory === "all" || r.category === filterCategory;
      const matchKecamatan =
        filterKecamatan === "all" ||
        findKecamatanByCoords(r.latitude, r.longitude).id === filterKecamatan;
      return matchStatus && matchCategory && matchKecamatan;
    });
  }, [reports, filterStatus, filterCategory, filterKecamatan]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status_pelaporan === "pending").length,
    inProgress: reports.filter((r) => r.status_pelaporan === "in_progress" || r.status_pelaporan === "progress").length,
    resolved: reports.filter((r) => r.status_pelaporan === "resolved").length,
  }), [reports]);

  const monthlyData = useMemo(() => buildMonthlyData(reports), [reports]);

  const ratio = reports.length > 0 ? ((stats.resolved / reports.length) * 100).toFixed(1) : "0";

  const center: [number, number] = TANGSEL_CENTER;

  return (
    <div className="space-y-6">
      {/* ── Selamat datang ── */}
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-forest md:text-4xl dark:text-foreground">
              Selamat datang, {adminName || "Admin Aura"}!
            </h1>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pantau sebaran kerusakan kota dan kelola laporan warga secara langsung.
          </p>
        </div>

        {/* AURA Location Index */}
        <div className="flex shrink-0 items-center gap-4 rounded-full bg-forest py-2 pl-2 pr-6 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">AURA Location Index (ALI)</p>
            <p className="text-2xl font-extrabold leading-none text-primary">
              {aliScore !== null ? aliScore.toFixed(2) : "0.00"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Kartu statistik ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={ListChecks}
          label="Total Laporan"
          value={stats.total}
          description="Total keluhan warga masuk"
          variant="dark"
        />
        <StatCard
          icon={Clock}
          label="Menunggu"
          value={stats.pending}
          description="Membutuhkan verifikasi"
          variant="light"
        />
        <StatCard
          icon={Wrench}
          label="Dikerjakan"
          value={stats.inProgress}
          description="Penanganan oleh petugas"
          variant="sage"
        />
        <StatCard
          icon={CheckCircle2}
          label="Selesai"
          value={stats.resolved}
          description="Laporan tuntas diperbaiki"
          variant="lime"
        />
      </div>

      {/* ── Grafik ── */}
      <div className="rounded-[32px] bg-card p-5 shadow-soft md:p-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-forest dark:text-foreground">
                Statistik dan Performa Penyelesaian
              </h2>
              <p className="text-xs text-muted-foreground">
                Tren bulanan laporan masuk vs laporan yang berhasil diselesaikan
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-full bg-sage-soft px-5 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selesai bulan ini</p>
              <p className="text-lg font-extrabold leading-tight text-forest dark:text-foreground">
                {monthlyData[monthlyData.length - 1]?.selesai ?? 0}
                <span className="ml-1 text-[10px] font-medium text-muted-foreground">laporan</span>
              </p>
            </div>
            <div className="rounded-full bg-sage-soft px-5 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rasio penyelesaian</p>
              <p className="text-lg font-extrabold leading-tight text-forest dark:text-foreground">{ratio}%</p>
            </div>
          </div>
        </div>

        {loadingData ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-forest" />
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-forest-soft)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-forest-soft)" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.7} />
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
                        <div className="min-w-[160px] space-y-1.5 rounded-2xl bg-forest p-4 text-xs text-white shadow-elev">
                          <p className="mb-1 border-b border-white/15 pb-1.5 font-extrabold">{data.bulan}</p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-white/70">
                              <span className="h-2 w-2 rounded-full bg-sage" />
                              Laporan Masuk
                            </span>
                            <span className="font-bold">{data.total}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-white/70">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              Terselesaikan
                            </span>
                            <span className="font-bold text-primary">{data.selesai}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-4 border-t border-white/15 pt-1.5">
                            <span className="text-white/70">Rasio Selesai</span>
                            <span className="font-bold">{completionRate}%</span>
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
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Laporan Masuk"
                  stroke="var(--color-forest-soft)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="selesai"
                  name="Laporan Terselesaikan"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSelesai)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Wilayah Administrasi Tangsel (7 Kecamatan & 54 Kelurahan) ── */}
      <div className="rounded-[32px] bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/50">
          <div>
            <h2 className="text-base font-extrabold text-forest dark:text-foreground">
              Wilayah Administrasi Kota Tangerang Selatan
            </h2>
            <p className="text-xs text-muted-foreground">
              7 Kecamatan &bull; 54 Kelurahan &bull; Klik salah satu kecamatan untuk memfilter laporan dan memfokuskan peta
            </p>
          </div>
          {filterKecamatan !== "all" && (
            <button
              onClick={() => setFilterKecamatan("all")}
              className="text-xs font-bold text-primary hover:underline bg-forest px-3.5 py-1.5 rounded-full"
            >
              Reset ke Semua Kecamatan &times;
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3">
          {KECAMATAN_LIST.map((kec) => {
            const isSelected = filterKecamatan === kec.id;
            const count = reports.filter(
              (r) => findKecamatanByCoords(r.latitude, r.longitude).id === kec.id
            ).length;
            return (
              <button
                key={kec.id}
                onClick={() => setFilterKecamatan(isSelected ? "all" : kec.id)}
                className={`flex flex-col text-left p-3 rounded-2xl border transition-all ${
                  isSelected
                    ? "ring-2 ring-forest shadow-md"
                    : "hover:border-forest/30 hover:bg-sage-soft/50"
                }`}
                style={{
                  borderColor: isSelected ? kec.color : undefined,
                  backgroundColor: isSelected ? kec.bgLight : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className="text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: kec.color, color: "#ffffff" }}
                  >
                    {kec.code}
                  </span>
                  <span
                    className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: count > 0 ? kec.color : "rgba(0,0,0,0.06)",
                      color: count > 0 ? "#ffffff" : "#64748b",
                    }}
                  >
                    {count}
                  </span>
                </div>
                <span className="text-xs font-extrabold text-forest truncate" title={kec.name}>
                  {kec.shortName}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {kec.kelurahan.length} Kelurahan
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Peta + daftar ── */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-[32px] bg-card shadow-soft">
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 bg-card p-5">
            <div>
              <h2 className="text-lg font-extrabold text-forest dark:text-foreground">Peta Sebaran Kerusakan</h2>
              <p className="text-xs text-muted-foreground">Fokus pemantauan wilayah Kota Tangerang Selatan</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filterKecamatan} onValueChange={setFilterKecamatan}>
                <SelectTrigger className="h-10 w-44 select-none"><SelectValue placeholder="Semua Kecamatan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kecamatan (7)</SelectItem>
                  {KECAMATAN_LIST.map((kec) => (
                    <SelectItem key={kec.id} value={kec.id}>
                      <span className="font-bold text-xs" style={{ color: kec.color }}>[{kec.code}]</span> {kec.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 w-36 select-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-10 w-40 select-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => {
                    const Icon = CATEGORY_ICON[k as keyof typeof CATEGORY_ICON];
                    return (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-foreground" />
                          <span>{v}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative z-0 mx-3 h-[350px] overflow-hidden rounded-[24px] md:h-[560px]">
            {loadingData ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-forest" />
              </div>
            ) : (
              <Suspense fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-forest" />
                </div>
              }>
                <AdminMap
                  reports={filtered}
                  center={center}
                  selectedKecamatanId={filterKecamatan}
                  onSelectKecamatan={setFilterKecamatan}
                />
              </Suspense>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 p-5 text-[11px] font-medium text-muted-foreground">
            <span className="font-extrabold text-forest dark:text-foreground">Legenda Urgensi:</span>
            {Object.entries(URGENCY_LABEL).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: URGENCY_COLORS[k] }} /> {v}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-[32px] bg-card shadow-soft">
          <div className="p-5 pb-3">
            <h2 className="text-lg font-extrabold text-forest dark:text-foreground">Daftar Laporan Terbaru</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} laporan dalam pantauan</p>
          </div>
          <div className="max-h-[500px] flex-1 space-y-3 overflow-y-auto px-4 pb-4 md:max-h-[640px]">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl border-[1.5px] border-dashed border-forest-soft/40 py-10 text-center">
                <p className="text-xs italic text-muted-foreground">Tidak ada laporan dengan filter ini.</p>
              </div>
            )}
            {filtered.map((r) => {
              const Icon = CATEGORY_ICON[r.category as keyof typeof CATEGORY_ICON] || MapPin;
              const photoUrl = r.photo_url
                ? (signedUrls[r.photo_url] || supabase.storage.from("reports").getPublicUrl(r.photo_url).data.publicUrl)
                : null;
              return (
                <div
                  key={r.id}
                  className="group flex cursor-pointer items-start gap-3 rounded-3xl bg-sage-soft p-3 transition-colors hover:bg-sage"
                  onClick={() => navigate({ to: "/admin/reports/$id", params: { id: r.id } })}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-sage">
                    {photoUrl ? (
                      <img src={photoUrl} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-forest">
                        <Icon className="h-5 w-5 opacity-60" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-extrabold leading-tight text-forest dark:text-foreground">
                        {r.name} · {r.no_hp}
                      </p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.status_pelaporan === "progress" ? STATUS_TONE.in_progress : (STATUS_TONE[r.status_pelaporan as keyof typeof STATUS_TONE] || "bg-secondary text-secondary-foreground")}`}>
                        {r.status_pelaporan === "progress" ? "Dikerjakan" : (STATUS_LABEL[r.status_pelaporan as keyof typeof STATUS_LABEL] || r.status_pelaporan)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{r.detail_laporan}</p>
                    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-medium text-muted-foreground">
                      <span className="flex max-w-[140px] items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {r.address || "GPS Location"}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${r.kategori_pelaporan === "ringan" ? URGENCY_TONE.low : (URGENCY_TONE[r.kategori_pelaporan as keyof typeof URGENCY_TONE] || "bg-secondary text-secondary-foreground")}`}>
                        {r.kategori_pelaporan === "ringan" ? "Ringan" : (URGENCY_LABEL[r.kategori_pelaporan as keyof typeof URGENCY_LABEL] || r.kategori_pelaporan)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const STAT_VARIANT = {
  dark: { card: "bg-forest text-white", num: "text-primary", icon: "bg-white/10 text-primary", desc: "text-white/60" },
  light: { card: "bg-card text-forest shadow-soft dark:text-foreground", num: "", icon: "bg-primary text-primary-foreground", desc: "text-muted-foreground" },
  sage: { card: "bg-sage text-forest", num: "", icon: "bg-forest text-primary", desc: "text-forest/70" },
  lime: { card: "bg-primary text-primary-foreground", num: "", icon: "bg-forest text-primary", desc: "text-forest/70" },
} as const;

function StatCard({
  icon: Icon, label, value, description, variant,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  description: string;
  variant: keyof typeof STAT_VARIANT;
}) {
  const v = STAT_VARIANT[variant];
  return (
    <div className={`rounded-[28px] p-5 transition-transform duration-300 hover:-translate-y-1 ${v.card}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${v.icon}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-5 text-5xl font-extrabold tracking-tight ${v.num}`}>{value}</p>
      <p className={`mt-2 text-[11px] font-medium ${v.desc}`}>{description}</p>
    </div>
  );
}