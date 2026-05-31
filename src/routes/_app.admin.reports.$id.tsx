import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import {
  ArrowLeft, Camera, MapPin, Calendar, Loader2, ExternalLink, Clock, AlertTriangle, Tag,
  Sparkles, Wrench, Building2, ShieldAlert, CheckCircle2, ClipboardList, Activity,
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/admin" })}
        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Button>

      {/* Hero Section with Photo */}
      <div className="relative overflow-hidden rounded-2xl shadow-elev">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-secondary/30">
          {photoUrl && !photoError ? (
            <>
              {/* Blurred background fill */}
              <img
                src={photoUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-60"
                onError={() => setPhotoError(true)}
              />
              {/* Main photo */}
              <img
                src={photoUrl}
                alt={report.name}
                onLoad={() => setPhotoLoaded(true)}
                onError={() => setPhotoError(true)}
                className={`relative z-10 h-full w-full object-contain transition-all duration-700 ${photoLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
              />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground bg-gradient-to-br from-secondary/40 to-secondary/10">
              <div className="rounded-2xl bg-secondary/60 p-6">
                <Camera className="h-16 w-16 opacity-30" />
              </div>
              <p className="text-sm font-medium italic opacity-60">Tidak ada foto bukti dilampirkan</p>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-30 p-8">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-white/20 gap-1.5">
                <CategoryIcon className="h-3.5 w-3.5" />
                {CATEGORY_LABEL[report.category as keyof typeof CATEGORY_LABEL]}
              </Badge>
              <Badge
                className="backdrop-blur-sm border-white/20 text-white"
                style={{ backgroundColor: urgencyColor + "CC" }}
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {URGENCY_LABEL[urgencyKey]}
              </Badge>
              <Badge className={`backdrop-blur-sm ${report.status_pelaporan === 'progress' ? STATUS_TONE.in_progress : (STATUS_TONE[report.status_pelaporan as keyof typeof STATUS_TONE] || 'bg-secondary text-secondary-foreground')}`}>
                {report.status_pelaporan === 'progress' ? 'Dikerjakan' : (STATUS_LABEL[report.status_pelaporan as keyof typeof STATUS_LABEL] || report.status_pelaporan)}
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-lg">
              {report.name} - {report.no_hp}
            </h1>
            <div className="flex items-center gap-4 mt-3 text-white/70 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {createdDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDistanceToNow(createdDate, { addSuffix: true, locale: idLocale })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Detail Info */}
        <div className="space-y-6">
          {/* Description */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4 flex items-center gap-2">
              <Tag className="h-3.5 w-3.5" />
              Detail Laporan
            </h3>
            <div className="bg-secondary/10 p-5 rounded-xl border border-border/50">
              <p className="text-base text-foreground/90 leading-relaxed italic">
                "{report.detail_laporan}"
              </p>
            </div>
          </Card>

          {/* AI Analysis Result */}
          {aiData && (
            <Card className="p-6 shadow-soft border-t-4 border-t-primary bg-gradient-to-b from-primary/5 via-card to-card">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Analisis Teknis Kerusakan Jalan</h3>
                    <p className="text-[10px] text-muted-foreground">Sistem Pemindaian Citra & Pengukuran Geospasial</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5">
                  Terverifikasi Sistem
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                {/* Total Potholes */}
                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 text-center flex flex-col justify-between min-h-[110px]">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Lubang</p>
                  <p className="text-2xl font-extrabold text-foreground mt-2">
                    {aiData.laporan?.total_lubang_terdeteksi ?? 0}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1 font-semibold">Terdeteksi visual</p>
                </div>

                {/* Fasilitas Radius 300m */}
                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 text-center flex flex-col justify-between min-h-[110px]">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fasilitas Sekitar (300m)</p>
                  {aiData.fasilitas.length > 0 ? (
                    <div className="my-1.5 max-h-[50px] overflow-y-auto pr-1 flex flex-wrap gap-1 justify-center scrollbar-thin">
                      {aiData.fasilitas.map((f) => (
                        <Badge key={f.id} variant="secondary" className="text-[9px] px-1.5 py-0 rounded bg-background/50 border border-border/20 max-w-full truncate font-medium">
                          {f.nama_fasilitas}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-2">Tidak Terdeteksi</p>
                  )}
                  <p className="text-[9px] text-muted-foreground font-semibold">
                    {aiData.fasilitas.length} Fasilitas Sekitar
                  </p>
                </div>

                {/* OSM Category */}
                <div className="bg-secondary/15 p-4 rounded-xl border border-border/40 text-center flex flex-col justify-between min-h-[110px]">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Klasifikasi Jalan (OSM)</p>
                  <p className="text-lg font-bold text-foreground mt-2 capitalize truncate">
                    {aiData.detail[0]?.kategori_pelaporan_osm || "Tidak Terpetakan"}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1 font-semibold">Saran Penanganan</p>
                </div>
              </div>

              {/* Progress Bars for Damage and Depth */}
              {aiData.detail[0] && (
                <div className="space-y-4 mb-6 border-b border-border/40 pb-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Persentase Kerusakan Visual</span>
                      <span className="font-bold text-foreground">{aiData.detail[0].persentase_kerusakan}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary/35 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-destructive transition-all duration-500" 
                        style={{ width: `${aiData.detail[0].persentase_kerusakan}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Persentase Estimasi Kedalaman</span>
                      <span className="font-bold text-foreground">{aiData.detail[0].persentase_kedalaman}%</span>
                    </div>
                    <div className="h-2 w-full bg-secondary/35 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-500" 
                        style={{ width: `${aiData.detail[0].persentase_kedalaman}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Handler & Est Time */}
              <div className="grid gap-4 sm:grid-cols-2 mb-2">
                <div className="flex gap-2.5 items-start text-xs">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Wrench className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">Rekomendasi Instansi Penanggung Jawab</p>
                    <p className="font-medium text-foreground mt-0.5">{aiData.detail[0]?.petugas_penanganan || "Dinas PUPR"}</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start text-xs">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">Estimasi Waktu Respon Penanganan</p>
                    <p className="font-medium text-foreground mt-0.5">{aiData.detail[0]?.estimasi_waktu_penanganan || "24 Jam"}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Location */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Lokasi Kejadian
            </h3>
            <div className="flex items-start gap-4 bg-secondary/10 p-5 rounded-xl border border-border/50">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium">{report.address || "Lokasi GPS"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                </p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka di OpenStreetMap
                </a>
              </div>
            </div>
          </Card>

          {/* Reporter (Identitas Pelapor) */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Identitas Pelapor
            </h3>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-leaf-gradient flex items-center justify-center text-primary-foreground font-bold text-sm animate-pulse-slow">
                  {(report.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-base">{report.name || "Anonim"}</p>
                  <p className="text-[10px] text-muted-foreground">Pelapor Mandiri</p>
                </div>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-muted-foreground">No. HP / WhatsApp</span>
                  <span className="font-semibold text-sm text-foreground">{report.no_hp}</span>
                </div>
                {report.email && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-muted-foreground">Email</span>
                    <span className="font-medium text-xs text-foreground">{report.email}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Admin Actions */}
        <div className="space-y-6">
          {/* Status Control */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Update Status
            </h3>
            <Select
              value={report.status_pelaporan}
              onValueChange={(v) => updateStatus(v)}
            >
              <SelectTrigger className={`h-12 text-sm font-semibold rounded-xl ${report.status_pelaporan === 'progress' ? STATUS_TONE.in_progress : (STATUS_TONE[report.status_pelaporan as keyof typeof STATUS_TONE] || 'bg-secondary text-secondary-foreground')}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Urgency Control */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Tingkat Urgensi
            </h3>
            <Select
              value={report.kategori_pelaporan}
              onValueChange={(v) => updateUrgency(v)}
            >
              <SelectTrigger className={`h-12 text-sm font-semibold rounded-xl ${report.kategori_pelaporan === 'ringan' ? URGENCY_TONE.low : (URGENCY_TONE[report.kategori_pelaporan as keyof typeof URGENCY_TONE] || 'bg-secondary text-secondary-foreground')}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(URGENCY_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Assign Petugas */}
          <Card className="p-6 shadow-soft">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Tugaskan Petugas
            </h3>
            <Select onValueChange={(v) => assignPetugas(v)}>
              <SelectTrigger className="h-12 text-sm bg-secondary/50 border-dashed rounded-xl">
                <SelectValue placeholder="Pilih Petugas…" />
              </SelectTrigger>
              <SelectContent>
                {petugas.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* Metadata */}
          <Card className="p-6 shadow-soft bg-secondary/20">
            <h3 className="text-xs font-bold uppercase text-primary/60 tracking-wider mb-4">
              Metadata
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Laporan</span>
                <span className="font-mono text-xs">{report.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span>{createdDate.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Koordinat</span>
                <span className="font-mono text-xs">{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
