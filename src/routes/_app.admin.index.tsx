import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
const AdminMap = lazy(() => import("@/components/admin-map"));
import { Map as MapIcon, ListChecks, Users, Activity, ShieldCheck, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
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
import { urgencyDivIcon, URGENCY_COLORS } from "@/lib/leaflet-setup";

export const Route = createFileRoute("/_app/admin/")({
  head: () => ({ meta: [{ title: "Dashboard Admin" }] }),
  component: AdminPage,
});

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [petugas, setPetugas] = useState<Petugas[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("admin-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, loadData)
      .subscribe();
    return () => { 
      supabase.removeChannel(channel); 
    };
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



  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={ListChecks} label="Total Laporan" value={stats.total} tone="text-primary" />
        <StatCard icon={Activity} label="Menunggu" value={stats.pending} tone="text-warning" />
        <StatCard icon={Users} label="Dikerjakan" value={stats.inProgress} tone="text-accent" />
        <StatCard icon={ShieldCheck} label="Selesai" value={stats.resolved} tone="text-success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative p-0 shadow-soft">
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-card rounded-t-xl">
            <h2 className="font-semibold">Peta sebaran kerusakan</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 w-40 select-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-9 w-44 select-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {Object.entries(CATEGORY_LABEL).map(([k, v]) => {
                    const Icon = CATEGORY_ICON[k as keyof typeof CATEGORY_ICON];
                    return (
                      <SelectItem key={k} value={k}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{v}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative z-0 h-[560px] w-full">
            {loadingData ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
                <AdminMap 
                  reports={filtered}
                  center={center}
                />
              </Suspense>
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
              <div 
                key={r.id} 
                className="rounded-xl border border-border p-3 cursor-pointer hover:bg-secondary/20 transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-sm hover:shadow-md"
                onClick={() => navigate({ to: '/admin/reports/$id', params: { id: r.id } })}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                    {(() => {
                      const Icon = CATEGORY_ICON[r.category as keyof typeof CATEGORY_ICON];
                      return <Icon className="h-4 w-4" />;
                    })()}
                    <span>{r.title}</span>
                  </p>
                  <Badge variant="outline" className={STATUS_TONE[r.status as keyof typeof STATUS_LABEL]}>{STATUS_LABEL[r.status as keyof typeof STATUS_LABEL]}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                
                {/* Mini info footer di list */}
                <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.address || "GPS Location"}</span>
                  <span className="bg-secondary/50 px-2 py-0.5 rounded-full">{URGENCY_LABEL[r.urgency as keyof typeof URGENCY_LABEL]}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
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
