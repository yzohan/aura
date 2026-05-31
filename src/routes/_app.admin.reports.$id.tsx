import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  ArrowLeft, Camera, MapPin, Calendar, Loader2, ExternalLink, Clock, AlertTriangle, Tag,
  Sparkles, Wrench, Building2, ShieldAlert, CheckCircle2, ClipboardList, Activity,
  User, Phone, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";
import { URGENCY_COLORS } from "@/lib/leaflet-setup";

export const Route = createFileRoute("/_app/admin/reports/$id")({
  head: () => ({ meta: [{ title: "Detail Laporan" }] }),
  component: ReportDetailPage,
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
  photo_url: string | null;
  created_at: string;
}

interface Petugas {
  id: string;
  full_name: string;
}

interface ReporterProfile {
  full_name: string | null;
  avatar_url: string | null;
}

interface AiAnalysisData {
  laporan: {
    id: number;
    image_file: string;
    total_lubang_terdeteksi: number | null;
    latitude: number;
    longitude: number;
    detail_lokasi: string | null;
  } | null;
  fasilitas: {
    id: number;
    laporan_id: number;
    nama_fasilitas: string;
  }[];
  detail: {
    id: number;
    laporan_id: number;
    severity_visual: string;
    persentase_kerusakan: number;
    persentase_kedalaman: number;
    kategori_pelaporan_osm: string;
    nilai_score: number;
    status_score: string;
    petugas_penanganan: string | null;
    estimasi_waktu_penanganan: string | null;
  }[];
}

const getUrgencyKey = (val: string): "low" | "medium" | "high" | "critical" => {
  const norm = (val || "").toLowerCase();
  if (norm === "low" || norm === "medium" || norm === "high" || norm === "critical") {
    return norm;
  }
  if (norm.includes("ringan") || norm.includes("kecil") || norm.includes("low")) return "low";
  if (norm.includes("sedang") || norm.includes("medium")) return "medium";
  if (norm.includes("tinggi") || norm.includes("berat") || norm.includes("high") || norm.includes("parah")) return "high";
  if (norm.includes("kritis") || norm.includes("critical") || norm.includes("sangat parah")) return "critical";
  return "medium";
};

function ReportDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [report, setReport] = useState<Report | null>(null);
  const [petugas, setPetugas] = useState<Petugas[]>([]);
  const [reporter, setReporter] = useState<ReporterProfile | null>(null);
  const [aiData, setAiData] = useState<AiAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        toast.error("Laporan tidak ditemukan");
        navigate({ to: "/admin" });
        return;
      }

      const reportData = data as Report;
      setReport(reportData);
      if (reportData.photo_url) {
        const { data: signedData, error: signedErr } = await supabase.storage
          .from("reports")
          .createSignedUrl(reportData.photo_url, 3600);
        if (!signedErr && signedData?.signedUrl) {
          setPhotoUrl(signedData.signedUrl);
        } else {
          const { data: pubData } = supabase.storage
            .from("reports")
            .getPublicUrl(reportData.photo_url);
          setPhotoUrl(pubData.publicUrl);
        }
      }

      // Load reporter profile
      if (data.reporter_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", data.reporter_id)
          .single();
        if (profile) setReporter(profile as ReporterProfile);
      }

      // Load petugas
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "petugas");
      const ids = (roleRows ?? []).map((r) => r.user_id);
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        setPetugas((profs ?? []) as Petugas[]);
      }

      // Load AI analysis data if photo_url exists
      if (reportData.photo_url) {
        const { data: jalanData } = await supabase
          .from("laporan_jalan")
          .select("*")
          .eq("image_file", reportData.photo_url)
          .maybeSingle();

        if (jalanData) {
          const [{ data: fasData }, { data: detData }] = await Promise.all([
            supabase.from("fasilitas_radius").select("*").eq("laporan_id", jalanData.id),
            supabase.from("detail_lubang").select("*").eq("laporan_id", jalanData.id),
          ]);

          setAiData({
            laporan: jalanData,
            fasilitas: (fasData || []) as any[],
            detail: (detData || []) as any[],
          });
        }
      }

      setLoading(false);
    };

    load();
  }, [id, navigate]);

  const updateStatus = async (status: Report["status_pelaporan"]) => {
    if (!report) return;
    setReport((prev) => prev ? { ...prev, status_pelaporan: status } : prev);
    const { error } = await supabase.from("reports").update({ status_pelaporan: status }).eq("id", report.id);
    if (error) {
      toast.error(error.message);
      // Refetch to revert
      const { data } = await supabase.from("reports").select("*").eq("id", id).single();
      if (data) setReport(data as Report);
    } else {
      toast.success("Status diperbarui");
    }
  };

  const updateUrgency = async (urgency: Report["kategori_pelaporan"]) => {
    if (!report) return;
    setReport((prev) => prev ? { ...prev, kategori_pelaporan: urgency } : prev);
    const { error } = await supabase.from("reports").update({ kategori_pelaporan: urgency }).eq("id", report.id);
    if (error) {
      toast.error(error.message);
      const { data } = await supabase.from("reports").select("*").eq("id", id).single();
      if (data) setReport(data as Report);
    } else {
      toast.success("Urgensi diperbarui");
    }
  };

  const assignPetugas = async (assignedTo: string) => {
    if (!report || !user) return;
    setReport((prev) => prev ? { ...prev, status_pelaporan: "in_progress" } : prev);

    const { error: woErr } = await supabase.from("work_orders").insert({
      report_id: report.id, assigned_to: assignedTo, assigned_by: user.id,
    });

    if (woErr) {
      toast.error(woErr.message);
      const { data } = await supabase.from("reports").select("*").eq("id", id).single();
      if (data) setReport(data as Report);
      return;
    }

    await supabase.from("reports").update({ status_pelaporan: "in_progress" }).eq("id", report.id);
    toast.success("Petugas berhasil ditugaskan");
  };

  if (loading || !report) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // photoUrl is already resolved via state

  const CategoryIcon = CATEGORY_ICON[report.category as keyof typeof CATEGORY_ICON];
  const urgencyKey = getUrgencyKey(report.kategori_pelaporan);
  const urgencyColor = URGENCY_COLORS[urgencyKey] ?? "#5a7a55";
  const createdDate = new Date(report.created_at);

  return (
    <div className="w-full space-y-4 pt-0 pb-6 animate-in fade-in duration-500">
      {/* Back button */}
      <div className="-mb-1">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/admin" })}
          className="gap-1.5 text-muted-foreground hover:text-primary -ml-2 transition-colors font-semibold h-8 text-xs px-2.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Dashboard
        </Button>
      </div>

      {/* Dense Dashboard Grid */}
      <div className="grid gap-4 lg:grid-cols-12 w-full items-stretch">
        {/* Left Column: Info & Analytics (col-span-8) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Card 1: Detail Laporan & Informasi Tiket */}
          <Card className="border border-border/80 shadow-soft bg-card p-4 rounded-xl shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/50 pb-3 mb-3 shrink-0">
              <div>
                <span className="text-xs font-bold text-primary tracking-wider uppercase">TIKET LAPORAN</span>
                <h1 className="text-xl font-extrabold text-foreground tracking-tight leading-none mt-0.5">
                  #AURA-{report.id.slice(0, 8).toUpperCase()}
                </h1>
              </div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-transparent gap-1 py-1 px-2.5 rounded text-xs font-semibold">
                  <CategoryIcon className="h-3.5 w-3.5" />
                  {CATEGORY_LABEL[report.category as keyof typeof CATEGORY_LABEL]}
                </Badge>
                <Badge
                  className="text-white border-transparent gap-1 py-1 px-2.5 rounded text-xs font-semibold"
                  style={{ backgroundColor: urgencyColor }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {URGENCY_LABEL[urgencyKey]}
                </Badge>
                <Badge className={`border-transparent py-1 px-2.5 rounded text-xs font-semibold ${
                  report.status_pelaporan === 'progress' 
                    ? STATUS_TONE.in_progress 
                    : (STATUS_TONE[report.status_pelaporan as keyof typeof STATUS_TONE] || 'bg-secondary text-secondary-foreground')
                }`}>
                  {report.status_pelaporan === 'progress' 
                    ? 'Dikerjakan' 
                    : (STATUS_LABEL[report.status_pelaporan as keyof typeof STATUS_LABEL] || report.status_pelaporan)}
                </Badge>
              </div>
            </div>

            {/* Address bar */}
            <div className="bg-secondary/10 px-3 py-2.5 rounded-lg border border-border/40 mb-3 flex items-start gap-1.5 shrink-0">
              <MapPin className="h-4.5 w-4.5 shrink-0 text-primary mt-0.5" />
              <div className="text-sm text-foreground font-semibold leading-snug">
                {report.address || "Alamat tidak terdeteksi"}
              </div>
            </div>

            {/* Quick Details Table/Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm border-b border-border/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold w-28 shrink-0">Nama Pelapor:</span>
                <span className="font-bold text-foreground truncate">{report.name || "Anonim"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold w-28 shrink-0">Kontak WA:</span>
                <span className="font-bold text-foreground">{report.no_hp}</span>
              </div>
              <div className="flex items-center gap-2 justify-between sm:col-span-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-semibold w-28 shrink-0">Koordinat GPS:</span>
                  <span className="font-mono text-foreground font-bold">
                    {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between sm:col-span-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-semibold w-28 shrink-0">Peta Wilayah:</span>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 font-bold shrink-0 mr-auto sm:mr-0"
                >
                  Buka OpenStreetMap <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-4 text-sm shrink-0">
              <div className="flex items-center gap-2 bg-secondary/5 px-2.5 py-1.5 rounded border border-border/30">
                <span className="font-bold text-muted-foreground uppercase text-xs">TANGGAL:</span>
                <span className="text-foreground font-bold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  {createdDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/5 px-2.5 py-1.5 rounded border border-border/30">
                <span className="font-bold text-muted-foreground uppercase text-xs">WAKTU:</span>
                <span className="text-foreground font-bold flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                  {formatDistanceToNow(createdDate, { addSuffix: true, locale: idLocale })}
                </span>
              </div>
            </div>
          </Card>

          {/* Card 2: Detail Laporan Warga */}
          <Card className="p-4 border border-border/80 shadow-soft bg-card rounded-xl shrink-0">
            <h3 className="text-sm font-bold uppercase text-primary/80 tracking-wider mb-3 flex items-center gap-2 border-b border-border/50 pb-2 shrink-0">
              <User className="h-4 w-4 text-primary" />
              Detail Laporan Warga
            </h3>
            <div className="grid gap-4 md:grid-cols-12">
              {/* Left side: Reporter Profile */}
              <div className="md:col-span-5 md:border-r md:border-border/40 md:pr-4 flex flex-col justify-center space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-leaf-gradient flex items-center justify-center text-primary-foreground font-extrabold text-sm shadow-soft shrink-0">
                    {(report.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground leading-tight">{report.name || "Anonim"}</p>
                    <Badge variant="secondary" className="text-xs font-semibold py-0.5 px-2 bg-secondary/60 text-secondary-foreground border border-border/30 mt-0.5">
                      Pelapor Warga
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm pt-1">
                  <div className="flex items-center justify-between bg-secondary/10 px-2.5 py-1.5 rounded-md border border-border/30 gap-2">
                    <span className="text-xs text-muted-foreground font-semibold shrink-0">No. HP</span>
                    <span className="font-bold text-foreground flex items-center gap-1.5 text-sm break-all text-right justify-end">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                      {report.no_hp}
                    </span>
                  </div>
                  {report.email && (
                    <div className="flex items-center justify-between bg-secondary/10 px-2.5 py-1.5 rounded-md border border-border/30 gap-2">
                      <span className="text-xs text-muted-foreground font-semibold shrink-0">Email</span>
                      <span className="font-medium text-foreground flex items-center gap-1.5 text-sm break-all text-right justify-end">
                        <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                        {report.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: Description */}
              <div className="md:col-span-7 md:pl-2 flex flex-col justify-center">
                <div className="bg-primary/[0.02] border-l-4 border-primary p-3.5 rounded-r-lg rounded-l-sm bg-gradient-to-r from-primary/[0.03] to-transparent">
                  <p className="text-xs md:text-sm text-foreground/90 leading-relaxed italic font-medium font-serif">
                    "{report.detail_laporan}"
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Analisis Teknis Laporan */}
          {aiData && (
            <Card className="p-4 border border-border/80 shadow-soft bg-card rounded-xl flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/20 text-foreground border border-border/40 shadow-sm">
                    <ClipboardList className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Analisis Teknis Laporan</h3>
                    <p className="text-xs text-muted-foreground font-medium">Hasil pengukuran kerusakan dan klasifikasi koordinat wilayah</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-secondary/30 text-muted-foreground border-border/50 text-xs font-bold tracking-wider uppercase px-2.5 py-0.5">
                  SISTEM
                </Badge>
              </div>

              {/* Internal layout divided to resolve empty space */}
              <div className="grid gap-4 md:grid-cols-12 items-stretch flex-1">
                {/* Left inside grid: metrics & severity - Span 7 */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3.5 h-full">
                  <div className="grid gap-2 grid-cols-3 shrink-0">
                    <div className="bg-secondary/5 hover:bg-secondary/10 px-2 py-2 rounded-lg border border-border/30 text-center flex flex-col justify-between min-h-[72px] transition-all duration-300">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Lubang</span>
                      <p className="text-2xl font-extrabold text-foreground tracking-tight my-0.5">
                        {aiData.laporan?.total_lubang_terdeteksi ?? 0}
                      </p>
                      <span className="text-xs text-muted-foreground/80 font-semibold">Lubang</span>
                    </div>

                    <div className="bg-secondary/5 hover:bg-secondary/10 px-2 py-2 rounded-lg border border-border/30 text-center flex flex-col justify-between min-h-[72px] transition-all duration-300">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Fasilitas Radius</span>
                      <p className="text-2xl font-extrabold text-foreground tracking-tight my-0.5">
                        {aiData.fasilitas.length}
                      </p>
                      <span className="text-xs text-muted-foreground/80 font-semibold">Terdeteksi</span>
                    </div>

                    <div className="bg-secondary/5 hover:bg-secondary/10 px-2 py-2 rounded-lg border border-border/30 text-center flex flex-col justify-between min-h-[72px] transition-all duration-300">
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Kelas Jalan</span>
                      <p className="text-sm font-extrabold text-foreground truncate my-1.5 capitalize">
                        {aiData.detail[0]?.kategori_pelaporan_osm || "Tidak Terpetakan"}
                      </p>
                      <span className="text-xs text-muted-foreground/80 font-semibold">OSM</span>
                    </div>
                  </div>

                  {/* Severity Indicator Progress Bars */}
                  {aiData.detail[0] && (
                    <div className="space-y-2.5 bg-secondary/5 border border-border/30 p-3 rounded-lg flex-1 flex flex-col justify-center mt-auto">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Metrik Tingkat Keparahan</h4>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">Persentase Kerusakan Area</span>
                            <span className="text-destructive font-bold text-sm">{aiData.detail[0].persentase_kerusakan}%</span>
                          </div>
                          <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden border border-border/20">
                            <div 
                              className="h-full bg-destructive transition-all duration-500 rounded-full" 
                              style={{ width: `${aiData.detail[0].persentase_kerusakan}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-muted-foreground">Estimasi Kedalaman Lubang</span>
                            <span className="text-amber-500 font-bold text-sm">{aiData.detail[0].persentase_kedalaman}%</span>
                          </div>
                          <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden border border-border/20">
                            <div 
                              className="h-full bg-amber-500 transition-all duration-500 rounded-full" 
                              style={{ width: `${aiData.detail[0].persentase_kedalaman}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right inside grid: facilities and SLA - Span 5 */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-3 h-full">
                  {/* Facilities */}
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      Fasilitas Sekitar (300m)
                    </h4>
                    {aiData.fasilitas.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-[84px] overflow-y-auto pr-1">
                        {aiData.fasilitas.map((f) => (
                          <Badge key={f.id} variant="secondary" className="text-xs px-2 py-0.5 rounded bg-secondary/25 border border-border/30 text-foreground font-semibold flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                            {f.nama_fasilitas}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic p-2 rounded border border-dashed border-border/60 text-center bg-secondary/5">
                        Tidak ada fasilitas terdeteksi.
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-1.5 pt-2 border-t border-border/40 shrink-0 mt-auto">
                    <div className="flex gap-2 items-center text-xs bg-secondary/15 px-2.5 py-1.5 rounded-lg border border-border/30">
                      <div className="p-1 bg-secondary/35 rounded text-foreground border border-border/50 shrink-0">
                        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instansi Penanganan</p>
                        <p className="font-semibold text-foreground truncate text-sm mt-0.5">{aiData.detail[0]?.petugas_penanganan || "Dinas PUPR"}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center text-xs bg-secondary/15 px-2.5 py-1.5 rounded-lg border border-border/30">
                      <div className="p-1 bg-secondary/35 rounded text-foreground border border-border/50 shrink-0">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Respon SLA</p>
                        <p className="font-semibold text-foreground truncate text-sm mt-0.5">{aiData.detail[0]?.estimasi_waktu_penanganan || "24 Jam"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Media & Actions (col-span-4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Bukti Foto */}
          <Card className="overflow-hidden border border-border/80 shadow-soft bg-card p-4 rounded-xl shrink-0">
            <h3 className="text-sm font-bold uppercase text-primary/80 tracking-wider mb-3 flex items-center gap-2 border-b border-border/50 pb-2">
              <Camera className="h-4 w-4 text-primary" />
              Bukti Foto Laporan
            </h3>
            <div className="w-full h-[220px] relative group overflow-hidden rounded-lg bg-secondary/20 border border-border/40 flex items-center justify-center">
              {photoUrl && !photoError ? (
                <img
                  src={photoUrl}
                  alt={report.name}
                  onLoad={() => setPhotoLoaded(true)}
                  onError={() => setPhotoError(true)}
                  className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.03] ${
                    photoLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground p-6">
                  <div className="p-3 bg-background rounded-full border border-border/50 shadow-sm">
                    <Camera className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs font-semibold italic opacity-60">Tidak ada foto bukti dilampirkan</p>
                </div>
              )}
            </div>
          </Card>

          {/* Card 2: Panel Tindakan */}
          <Card className="border border-border/80 shadow-soft bg-card rounded-xl overflow-hidden flex-1 flex flex-col justify-between">
            <div className="p-4 space-y-4 h-full flex flex-col justify-between flex-1">
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Panel Tindakan
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Penanganan dan penugasan laporan</p>
                </div>

                {/* Status Control */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground/90 tracking-wider">Update Status Laporan</label>
                  <Select
                    value={report.status_pelaporan}
                    onValueChange={(v) => updateStatus(v)}
                  >
                    <SelectTrigger className={`h-9 text-xs font-bold rounded-lg border border-border/80 transition-all ${
                      report.status_pelaporan === 'progress' 
                        ? STATUS_TONE.in_progress 
                        : (STATUS_TONE[report.status_pelaporan as keyof typeof STATUS_TONE] || 'bg-secondary text-secondary-foreground')
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs font-semibold">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Urgency Control */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground/90 tracking-wider">Tingkat Urgensi</label>
                  <Select
                    value={report.kategori_pelaporan}
                    onValueChange={(v) => updateUrgency(v)}
                  >
                    <SelectTrigger className={`h-9 text-xs font-bold rounded-lg border border-border/80 transition-all ${
                      report.kategori_pelaporan === 'ringan' 
                        ? URGENCY_TONE.low 
                        : (URGENCY_TONE[report.kategori_pelaporan as keyof typeof URGENCY_TONE] || 'bg-secondary text-secondary-foreground')
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(URGENCY_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs font-semibold">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assign Petugas */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted-foreground/90 tracking-wider">Tugaskan Petugas Lapangan</label>
                  <Select onValueChange={(v) => assignPetugas(v)}>
                    <SelectTrigger className="h-9 text-xs bg-background border border-border/80 rounded-lg font-medium">
                      <SelectValue placeholder="Pilih Petugas Lapangan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {petugas.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs font-medium">{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="border-t border-border/60 pt-4 space-y-2 text-xs shrink-0 mt-auto">
                <h4 className="text-xs font-bold uppercase text-muted-foreground/90 tracking-wider mb-1">Informasi Sistem</h4>
                
                <div className="flex justify-between items-center bg-secondary/5 px-2.5 py-1.5 rounded-lg border border-border/30">
                  <span className="text-muted-foreground text-xs">ID Laporan</span>
                  <span className="font-mono text-xs font-semibold bg-background border border-border px-1.5 py-0.5 rounded text-foreground">{report.id.slice(0, 13)}...</span>
                </div>
                
                <div className="flex justify-between items-center bg-secondary/5 px-2.5 py-1.5 rounded-lg border border-border/30">
                  <span className="text-muted-foreground text-xs">Status Laporan</span>
                  <Badge variant="outline" className="bg-secondary/40 text-muted-foreground border-border/50 text-xs font-bold uppercase py-0.5 px-2">VALID</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
