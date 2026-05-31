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
    <div className="max-w-6xl mx-auto space-y-6 px-4 md:px-0 py-4 animate-in fade-in duration-500 w-full">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: "/admin" })}
        className="gap-2 text-muted-foreground hover:text-primary -ml-2 transition-colors font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Button>

      {/* Split Header Panel (Photo & Core Info) */}
      <Card className="overflow-hidden border border-border/80 shadow-soft bg-card p-6 rounded-2xl">
        <div className="grid gap-6 md:grid-cols-12">
          {/* Left side: Photo */}
          <div className="md:col-span-5 relative group overflow-hidden rounded-xl bg-secondary/20 border border-border/40 aspect-[4/3] flex items-center justify-center">
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
                <div className="p-4 bg-background rounded-full border border-border/50 shadow-sm">
                  <Camera className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-xs font-semibold italic opacity-60">Tidak ada foto bukti dilampirkan</p>
              </div>
            )}
          </div>

          {/* Right side: Core Info */}
          <div className="md:col-span-7 flex flex-col justify-between py-1 space-y-4">
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-transparent gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold">
                  <CategoryIcon className="h-3.5 w-3.5" />
                  {CATEGORY_LABEL[report.category as keyof typeof CATEGORY_LABEL]}
                </Badge>
                <Badge
                  className="text-white border-transparent gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: urgencyColor }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {URGENCY_LABEL[urgencyKey]}
                </Badge>
                <Badge className={`border-transparent py-1 px-2.5 rounded-lg text-xs font-semibold ${
                  report.status_pelaporan === 'progress' 
                    ? STATUS_TONE.in_progress 
                    : (STATUS_TONE[report.status_pelaporan as keyof typeof STATUS_TONE] || 'bg-secondary text-secondary-foreground')
                }`}>
                  {report.status_pelaporan === 'progress' 
                    ? 'Dikerjakan' 
                    : (STATUS_LABEL[report.status_pelaporan as keyof typeof STATUS_LABEL] || report.status_pelaporan)}
                </Badge>
              </div>

              {/* Title & Ticket ID */}
              <div>
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase">TIKET LAPORAN</span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight mt-0.5">
                  #AURA-{report.id.slice(0, 8).toUpperCase()}
                </h1>
                <p className="text-muted-foreground text-sm flex items-start gap-1.5 mt-2.5 leading-snug">
                  <MapPin className="h-4.5 w-4.5 shrink-0 text-primary mt-0.5" />
                  <span>{report.address || "Alamat tidak terdeteksi"}</span>
                </p>
              </div>
            </div>

            {/* Bottom row: Time and ID */}
            <div className="border-t border-border/60 pt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-muted-foreground/80">TANGGAL LAPORAN</span>
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary/70" />
                  {createdDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-muted-foreground/80">WAKTU PEMBUATAN</span>
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                  {formatDistanceToNow(createdDate, { addSuffix: true, locale: idLocale })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Details */}
        <div className="space-y-6">
          {/* Reporter (Identitas Pelapor) */}
          <Card className="p-6 border border-border/80 shadow-soft bg-card rounded-2xl">
            <h3 className="text-xs font-bold uppercase text-primary/80 tracking-wider mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
              <User className="h-4 w-4 text-primary" />
              Identitas Pelapor
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-leaf-gradient flex items-center justify-center text-primary-foreground font-extrabold text-base shadow-soft shrink-0">
                  {(report.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-base text-foreground">{report.name || "Anonim"}</p>
                  <Badge variant="secondary" className="text-[10px] font-medium py-0.5 px-2 bg-secondary/60 text-secondary-foreground border border-border/30 mt-0.5">
                    Pelapor Mandiri (Warga)
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2.5 text-sm shrink-0">
                <div className="flex items-center gap-2 bg-secondary/10 hover:bg-secondary/15 px-3 py-2 rounded-xl border border-border/40 transition-colors">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-bold text-foreground">{report.no_hp}</span>
                </div>
                {report.email && (
                  <div className="flex items-center gap-2 bg-secondary/10 hover:bg-secondary/15 px-3 py-2 rounded-xl border border-border/40 transition-colors">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground truncate max-w-[180px]">{report.email}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6 border border-border/80 shadow-soft bg-card rounded-2xl">
            <h3 className="text-xs font-bold uppercase text-primary/80 tracking-wider mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
              <Tag className="h-4 w-4 text-primary" />
              Deskripsi Laporan
            </h3>
            <div className="bg-primary/[0.02] border-l-4 border-primary p-5 rounded-r-xl rounded-l-sm bg-gradient-to-r from-primary/[0.03] to-transparent">
              <p className="text-base text-foreground/90 leading-relaxed italic font-medium font-serif">
                "{report.detail_laporan}"
              </p>
            </div>
          </Card>

          {/* AI Analysis Result */}
          {aiData && (
            <Card className="p-6 border border-border/80 shadow-soft bg-card rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">AURA AI Engine™ Analysis</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">Pengukuran Otomatis Kerusakan & Klasifikasi Citra</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold tracking-wider uppercase px-2.5 py-1">
                  AI TERVERIFIKASI
                </Badge>
              </div>

              {/* 3 Core metrics */}
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="bg-secondary/5 hover:bg-secondary/10 px-4 py-4 rounded-xl border border-border/30 text-center flex flex-col justify-between min-h-[110px] transition-all duration-300">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Lubang</span>
                  <p className="text-3xl font-extrabold text-foreground tracking-tight my-1">
                    {aiData.laporan?.total_lubang_terdeteksi ?? 0}
                  </p>
                  <span className="text-[10px] text-muted-foreground/80 font-semibold">Terdeteksi pada foto</span>
                </div>

                <div className="bg-secondary/5 hover:bg-secondary/10 px-4 py-4 rounded-xl border border-border/30 text-center flex flex-col justify-between min-h-[110px] transition-all duration-300">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fasilitas Sekitar (300m)</span>
                  <p className="text-3xl font-extrabold text-foreground tracking-tight my-1">
                    {aiData.fasilitas.length}
                  </p>
                  <span className="text-[10px] text-muted-foreground/80 font-semibold">Dalam radius pemetaan</span>
                </div>

                <div className="bg-secondary/5 hover:bg-secondary/10 px-4 py-4 rounded-xl border border-border/30 text-center flex flex-col justify-between min-h-[110px] transition-all duration-300">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Klasifikasi Jalan (OSM)</span>
                  <p className="text-base font-extrabold text-foreground truncate my-1.5 capitalize">
                    {aiData.detail[0]?.kategori_pelaporan_osm || "Tidak Terpetakan"}
                  </p>
                  <span className="text-[10px] text-muted-foreground/80 font-semibold">Tipe perkerasan jalan</span>
                </div>
              </div>

              {/* Severity Indicators */}
              {aiData.detail[0] && (
                <div className="space-y-4 mb-6 bg-secondary/5 border border-border/30 p-5 rounded-xl">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Metrik Tingkat Keparahan</h4>
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Persentase Kerusakan Area</span>
                        <span className="text-destructive font-bold">{aiData.detail[0].persentase_kerusakan}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-secondary/20 rounded-full overflow-hidden border border-border/20">
                        <div 
                          className="h-full bg-destructive transition-all duration-500 rounded-full" 
                          style={{ width: `${aiData.detail[0].persentase_kerusakan}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">Estimasi Kedalaman Lubang</span>
                        <span className="text-amber-500 font-bold">{aiData.detail[0].persentase_kedalaman}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-secondary/20 rounded-full overflow-hidden border border-border/20">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-500 rounded-full" 
                          style={{ width: `${aiData.detail[0].persentase_kedalaman}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Radius facilities list - clean flow */}
              <div className="mb-6 space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Fasilitas Umum Terdekat dalam 300 Meter
                </h4>
                {aiData.fasilitas.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {aiData.fasilitas.map((f) => (
                      <Badge key={f.id} variant="secondary" className="text-xs px-2.5 py-1 rounded-lg bg-secondary/20 border border-border/40 text-foreground font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {f.nama_fasilitas}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic pl-1 bg-secondary/5 py-3 rounded-lg border border-dashed border-border/60 text-center">
                    Tidak ada fasilitas penting terdeteksi di database terdekat.
                  </p>
                )}
              </div>

              {/* SLA & Handler Recommendation */}
              <div className="border-t border-border/50 pt-5 grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3 items-center text-sm bg-secondary/5 px-4 py-3 rounded-xl border border-border/30">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20 shrink-0">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rekomendasi Dinas</p>
                    <p className="font-extrabold text-foreground mt-0.5">{aiData.detail[0]?.petugas_penanganan || "Dinas Pekerjaan Umum (PUPR)"}</p>
                  </div>
                </div>

                <div className="flex gap-3 items-center text-sm bg-secondary/5 px-4 py-3 rounded-xl border border-border/30">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Waktu Respon SLA</p>
                    <p className="font-extrabold text-foreground mt-0.5">{aiData.detail[0]?.estimasi_waktu_penanganan || "24 Jam Kerja"}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Location */}
          <Card className="p-6 border border-border/80 shadow-soft bg-card rounded-2xl">
            <h3 className="text-xs font-bold uppercase text-primary/80 tracking-wider mb-4 flex items-center gap-2 border-b border-border/50 pb-2">
              <MapPin className="h-4 w-4 text-primary" />
              Lokasi & Geospasial
            </h3>
            
            <div className="flex flex-col md:flex-row gap-5 items-stretch">
              {/* Map placeholder with clean styling */}
              <div className="flex-1 bg-secondary/15 rounded-xl border border-border/50 p-4 flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20 shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground">{report.address || "Detail koordinat lokasi"}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">
                      Latitude: {report.latitude.toFixed(6)} | Longitude: {report.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-background border border-border hover:bg-secondary/40 text-sm text-foreground hover:text-primary font-bold rounded-xl shadow-sm transition-all active:scale-[0.985]"
                >
                  <ExternalLink className="h-4 w-4" />
                  Buka Peta OpenStreetMap
                </a>
              </div>

              {/* Right coordinates info block */}
              <div className="w-full md:w-[220px] shrink-0 bg-primary/[0.02] border border-primary/20 rounded-xl p-4 flex flex-col justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-2">Presisi Geospasial</span>
                  <p className="text-muted-foreground leading-relaxed">
                    Koordinat didapatkan secara realtime dari sensor GPS perangkat pelapor saat mengisi formulir pengaduan.
                  </p>
                </div>
                <div className="pt-3 border-t border-border/40 mt-3 font-semibold text-foreground/80 flex items-center justify-between">
                  <span>Status Pemetaan</span>
                  <Badge className="bg-primary/20 text-primary border-none text-[9px] py-0.5 px-2">AKTIF</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Unified Actions Panel */}
        <div className="space-y-6">
          <Card className="border border-border/80 shadow-soft bg-card rounded-2xl relative overflow-hidden">
            {/* Top decorative line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary" />
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-extrabold text-base text-foreground">Panel Tindakan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Penanganan dan penugasan laporan</p>
              </div>

              {/* Status Control */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/90 tracking-wider">Update Status Laporan</label>
                <Select
                  value={report.status_pelaporan}
                  onValueChange={(v) => updateStatus(v)}
                >
                  <SelectTrigger className={`h-11 text-xs font-bold rounded-xl border border-border/80 transition-all ${
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
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/90 tracking-wider">Tingkat Urgensi</label>
                <Select
                  value={report.kategori_pelaporan}
                  onValueChange={(v) => updateUrgency(v)}
                >
                  <SelectTrigger className={`h-11 text-xs font-bold rounded-xl border border-border/80 transition-all ${
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
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground/90 tracking-wider">Tugaskan Petugas Lapangan</label>
                <Select onValueChange={(v) => assignPetugas(v)}>
                  <SelectTrigger className="h-11 text-xs bg-background border border-border/80 rounded-xl font-medium">
                    <SelectValue placeholder="Pilih Petugas Lapangan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {petugas.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-medium">{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Metadata Footer */}
              <div className="border-t border-border/60 pt-5 space-y-3.5 text-xs">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground/90 tracking-wider mb-1">Informasi Sistem</h4>
                
                <div className="flex justify-between items-center bg-secondary/5 px-3 py-2 rounded-lg border border-border/30">
                  <span className="text-muted-foreground">ID Laporan</span>
                  <span className="font-mono text-[10px] font-semibold bg-background border border-border px-1.5 py-0.5 rounded text-foreground">{report.id.slice(0, 13)}...</span>
                </div>
                
                <div className="flex justify-between items-center bg-secondary/5 px-3 py-2 rounded-lg border border-border/30">
                  <span className="text-muted-foreground">Status Autentikasi</span>
                  <Badge className="bg-primary/10 text-primary border-none text-[9px] py-0.5 px-2 font-bold uppercase">TERVERIFIKASI</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
