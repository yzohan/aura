import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Map as MapIcon, ListChecks, Users, Activity, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { urgencyDivIcon, URGENCY_COLORS } from "@/lib/leaflet-setup";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Dashboard Admin — AURA" }] }),
  component: AdminPage,
});

const NAV = [{ to: "/admin", label: "Peta GIS", icon: MapIcon }];

interface Report {
  id: string;
  reporter_id: string;
  category: keyof typeof CATEGORY_LABEL;
  title: string;
  description: string;
  status: keyof typeof STATUS_LABEL;
  urgency: keyof typeof URGENCY_LABEL;
  latitude: number;
  longitude: number;
  address: string | null;
  created_at: string;
}

interface Petugas {
  id: string;
  full_name: string;
}

function AdminPage() {
  const { role, loading, user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [petugas, setPetugas] = useState<Petugas[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    if (!loading && role && role !== "admin") navigate({ to: "/" });
  }, [role, loading, navigate]);

  useEffect(() => {
    const load = async () => {
      const [{ data: rep }, { data: roleRows }] = await Promise.all([
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id").eq("role", "petugas"),
      ]);
      setReports((rep ?? []) as Report[]);
      const ids = (roleRows ?? []).map((r) => r.user_id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        setPetugas((profs ?? []) as Petugas[]);
      }
      setLoadingData(false);
    };
    load();
    const channel = supabase
      .channel("admin-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    return reports.filter((r) =>
      (filterStatus === "all" || r.status === filterStatus) &&
      (filterCategory === "all" || r.category === filterCategory)
    );
  }, [reports, filterStatus, filterCategory]);

  const stats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    inProgress: reports.filter((r) => r.status === "in_progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  }), [reports]);

  // Default center: Jakarta
  const center: [number, number] = filtered[0]
    ? [filtered[0].latitude, filtered[0].longitude]
    : [-6.2, 106.816];

  const updateUrgency = async (id: string, urgency: Report["urgency"]) => {
    const { error } = await supabase.from("reports").update({ urgency }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Urgensi diperbarui");
  };

  const updateStatus = async (id: string, status: Report["status"]) => {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Status diperbarui");
  };

  const assignPetugas = async (report: Report, assignedTo: string) => {
    if (!user) return;
    const { error: woErr } = await supabase.from("work_orders").insert({
      report_id: report.id, assigned_to: assignedTo, assigned_by: user.id,
    });
    if (woErr) { toast.error(woErr.message); return; }
    await supabase.from("reports").update({ status: "in_progress" }).eq("id", report.id);
    toast.success("Petugas berhasil ditugaskan");
  };

  return (
    <DashboardShell title="Dashboard Admin Dinas" nav={NAV}>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={ListChecks} label="Total Laporan" value={stats.total} tone="text-primary" />
        <StatCard icon={Activity} label="Menunggu" value={stats.pending} tone="text-warning" />
        <StatCard icon={Users} label="Dikerjakan" value={stats.inProgress} tone="text-accent" />
        <StatCard icon={ShieldCheck} label="Selesai" value={stats.resolved} tone="text-success" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden p-0 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <h2 className="font-semibold">Peta sebaran kerusakan</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="h-[560px] w-full">
            {loadingData ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filtered.map((r) => (
                  <Marker key={r.id} position={[r.latitude, r.longitude]} icon={urgencyDivIcon(r.urgency)}>
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold">{CATEGORY_ICON[r.category]} {r.title}</p>
                        <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[r.category]}</p>
                        <p className="text-xs">Status: {STATUS_LABEL[r.status]}</p>
                        <p className="text-xs">Urgensi: <span style={{ color: URGENCY_COLORS[r.urgency] }}>{URGENCY_LABEL[r.urgency]}</span></p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-3 border-t border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium">Legenda urgensi:</span>
            {Object.entries(URGENCY_LABEL).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: URGENCY_COLORS[k] }} /> {v}
              </span>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col p-0 shadow-soft">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Daftar laporan</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} laporan ditampilkan</p>
          </div>
          <div className="max-h-[600px] flex-1 space-y-3 overflow-y-auto p-4">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground">Tidak ada laporan dengan filter ini.</p>}
            {filtered.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{CATEGORY_ICON[r.category]} {r.title}</p>
                  <Badge variant="outline" className={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Select value={r.urgency} onValueChange={(v) => updateUrgency(r.id, v as Report["urgency"])}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(URGENCY_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as Report["status"])}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {petugas.length > 0 && (
                  <div className="mt-2">
                    <Select onValueChange={(v) => assignPetugas(r, v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Tugaskan petugas…" />
                      </SelectTrigger>
                      <SelectContent>
                        {petugas.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: string }) {
  return (
    <Card className="p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </Card>
  );
}
