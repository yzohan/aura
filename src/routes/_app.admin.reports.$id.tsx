import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Camera, Calendar, Loader2, ExternalLink, Clock, AlertTriangle,
  Wrench, Building2, ClipboardList, Activity, User, Phone, Mail, Trash2, Trash, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABEL, CATEGORY_ICON, STATUS_LABEL, STATUS_TONE, URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";
import { URGENCY_COLORS } from "@/lib/leaflet-setup";
import {
  findKecamatanByCoords,
  findNearestKelurahan,
  TANGSEL_KECAMATAN,
  type KecamatanData,
} from "@/lib/tangsel-data";

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

const card = "rounded-[32px] bg-card p-5 shadow-soft md:p-6";
const eyebrow = "text-[10px] font-bold uppercase tracking-widest text-muted-foreground";

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
  const [assignedPetugasId, setAssignedPetugasId] = useState<string | null>(null);
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

      // Load active work order to see who is assigned
      const { data: woData } = await supabase
        .from("work_orders")
        .select("assigned_to")
        .eq("report_id", id)
        .maybeSingle();

      if (woData) {
        setAssignedPetugasId(woData.assigned_to);
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
    setAssignedPetugasId(assignedTo);
    toast.success("Petugas berhasil ditugaskan");
  };

  const deleteReport = async () => {
    if (!report) return;
    setLoading(true);
    const { error } = await supabase.from("reports").delete().eq("id", report.id);
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Laporan berhasil dihapus");
      navigate({ to: "/admin" });
    }
  };

  if (loading || !report) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICON[report.category as keyof typeof CATEGORY_ICON];
  const urgencyKey = getUrgencyKey(report.kategori_pelaporan);
  const urgencyColor = URGENCY_COLORS[urgencyKey] ?? "#6b6b63";
  const createdDate = new Date(report.created_at);

  const nearestKelurahan = findNearestKelurahan(report.latitude, report.longitude);
  const adminKecamatan = nearestKelurahan
    ? (TANGSEL_KECAMATAN[nearestKelurahan.kecamatanId] || findKecamatanByCoords(report.latitude, report.longitude))
    : findKecamatanByCoords(report.latitude, report.longitude);

  return (
    <div className="w-full space-y-5 pb-6">
      <button
        onClick={() => navigate({ to: "/admin" })}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 text-sm font-bold text-forest shadow-soft transition-colors hover:bg-sage dark:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
      </button>

      <div className="grid w-full items-start gap-5 lg:grid-cols-12">
        {/* ───────── Kolom kiri ───────── */}
        <div className="flex flex-col gap-5 lg:col-span-8">
          {/* Tiket */}
          <div className={card}>
            <div className="mb-5 flex flex-col gap-3 border-b border-border/50 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className={eyebrow}>Tiket Laporan</span>
                <h1 className="mt-1 text-3xl font-extrabold leading-none tracking-tight text-forest dark:text-foreground">
                  #AURA-{report.id.slice(0, 8).toUpperCase()}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-xs font-bold text-forest">
                  <CategoryIcon className="h-3.5 w-3.5" />
                  {CATEGORY_LABEL[report.category as keyof typeof CATEGORY_LABEL]}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
                  style={{ backgroundColor: urgencyColor }}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {URGENCY_LABEL[urgencyKey]}
                </span>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  report.status_pelaporan === "progress"
                    ? STATUS_TONE.in_progress
                    : (STATUS_TONE[report.status_pelaporan as keyof typeof STATUS_TONE] || "bg-secondary text-secondary-foreground")
                }`}>
                  {report.status_pelaporan === "progress"
                    ? "Dikerjakan"
                    : (STATUS_LABEL[report.status_pelaporan as keyof typeof STATUS_LABEL] || report.status_pelaporan)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="Nama Pelapor" value={report.name || "Anonim"} />
              <Field label="Kontak WA" value={report.no_hp} />
              <Field
                label="Tanggal Laporan"
                icon={Calendar}
                value={createdDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              />
              <Field
                label="Waktu Laporan"
                icon={Clock}
                value={formatDistanceToNow(createdDate, { addSuffix: true, locale: idLocale })}
              />
              {adminKecamatan && (
                <div>
                  <span className={eyebrow}>Kecamatan (Tangsel)</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-black text-white shadow-xs"
                      style={{ backgroundColor: adminKecamatan.color }}
                    >
                      {adminKecamatan.code}
                    </span>
                    <span className="text-sm font-extrabold text-forest dark:text-foreground">
                      {adminKecamatan.name}
                    </span>
                  </div>
                </div>
              )}
              {nearestKelurahan && (
                <div>
                  <span className={eyebrow}>Kelurahan</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="inline-flex items-center rounded-md bg-sage px-2 py-0.5 text-xs font-bold text-forest">
                      {nearestKelurahan.code}
                    </span>
                    <span className="text-sm font-bold text-forest dark:text-foreground">
                      Kel. {nearestKelurahan.name}
                    </span>
                  </div>
                </div>
              )}
              <Field
                label="Kota Administrasi"
                value="Kota Tangerang Selatan"
              />
              <Field
                label="Koordinat GPS"
                mono
                value={`${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`}
              />
            </div>

            <div className="mt-5 rounded-3xl bg-sage-soft p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={eyebrow}>Peta & Wilayah Administratif</span>
                {adminKecamatan && nearestKelurahan && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: adminKecamatan.color }}
                  >
                    <span>{adminKecamatan.code} {adminKecamatan.shortName}</span>
                    <span>•</span>
                    <span>Kel. {nearestKelurahan.name}</span>
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <div className="flex items-start gap-1.5 text-sm font-bold text-forest dark:text-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="break-words">
                      {report.address || `Kel. ${nearestKelurahan?.name ?? ""}, ${adminKecamatan?.name ?? ""}`}
                    </span>
                  </div>
                  {adminKecamatan && nearestKelurahan && (
                    <p className="pl-5 text-xs text-muted-foreground">
                      Wilayah Resmi: Kelurahan {nearestKelurahan.name} ({nearestKelurahan.code}), {adminKecamatan.name}, Kota Tangerang Selatan
                    </p>
                  )}
                </div>

                <a
                  href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Buka OpenStreetMap <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Detail laporan warga */}
          <div className={card}>
            <h3 className="mb-4 flex items-center gap-3 text-lg font-extrabold text-forest dark:text-foreground">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage">
                <User className="h-4 w-4" />
              </span>
              Detail Laporan Warga
            </h3>
            <div className="grid gap-5 md:grid-cols-12">
              <div className="space-y-3 md:col-span-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-extrabold text-primary-foreground">
                    {(report.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold leading-tight">{reporter?.full_name || report.name || "Anonim"}</p>
                    <span className="mt-1 inline-block rounded-full bg-sage px-2.5 py-0.5 text-[11px] font-bold text-forest">
                      Pelapor Warga
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-full bg-sage-soft px-4 py-2">
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">No. HP</span>
                    <span className="flex items-center gap-1.5 break-all text-right text-sm font-bold">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {report.no_hp}
                    </span>
                  </div>
                  {report.email && (
                    <div className="flex items-center justify-between gap-2 rounded-full bg-sage-soft px-4 py-2">
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">Email</span>
                      <span className="flex items-center gap-1.5 break-all text-right text-sm font-medium">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {report.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-7">
                <div className="h-full rounded-3xl border-[1.5px] border-dashed border-forest-soft/40 bg-field p-5">
                  <p className="text-sm font-medium italic leading-relaxed text-forest/90">
                    “{report.detail_laporan}”
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analisis teknis */}
          {aiData && (
            <div className={card}>
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-primary">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold text-forest dark:text-foreground">Analisis Teknis Laporan</h3>
                    <p className="text-xs text-muted-foreground">Hasil pengukuran kerusakan dan klasifikasi koordinat wilayah</p>
                  </div>
                </div>
                <span className="rounded-full bg-sage px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-forest">Sistem</span>
              </div>

              <div className="grid items-stretch gap-5 md:grid-cols-12">
                <div className="space-y-4 md:col-span-7">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-3xl bg-forest p-4 text-center text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Total Lubang</span>
                      <p className="my-1 text-3xl font-extrabold text-primary">{aiData.laporan?.total_lubang_terdeteksi ?? 0}</p>
                      <span className="text-[11px] text-white/60">Lubang</span>
                    </div>
                    <div className="rounded-3xl bg-sage p-4 text-center text-forest">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-forest/70">Fasilitas Radius</span>
                      <p className="my-1 text-3xl font-extrabold">{aiData.fasilitas.length}</p>
                      <span className="text-[11px] text-forest/60">Terdeteksi</span>
                    </div>
                    <div className="rounded-3xl bg-sage-soft p-4 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kelas Jalan</span>
                      <p className="my-2.5 truncate text-sm font-extrabold capitalize text-forest dark:text-foreground">
                        {aiData.detail[0]?.kategori_pelaporan_osm || "Tidak Terpetakan"}
                      </p>
                      <span className="text-[11px] text-muted-foreground">OSM</span>
                    </div>
                  </div>

                  {aiData.detail[0] && (
                    <div className="space-y-4 rounded-3xl bg-sage-soft p-5">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-forest dark:text-foreground">
                        Metrik Tingkat Keparahan
                      </h4>
                      <Meter
                        label="Persentase Kerusakan Area"
                        value={aiData.detail[0].persentase_kerusakan}
                        barClass="bg-destructive"
                        textClass="text-destructive"
                      />
                      <Meter
                        label="Estimasi Kedalaman Lubang"
                        value={aiData.detail[0].persentase_kedalaman}
                        barClass="bg-orange"
                        textClass="text-orange"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 md:col-span-5">
                  <div className="flex-1">
                    <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-forest dark:text-foreground">
                      <Building2 className="h-3.5 w-3.5" /> Fasilitas Sekitar (300m)
                    </h4>
                    {aiData.fasilitas.length > 0 ? (
                      <div className="flex max-h-[110px] flex-wrap gap-1.5 overflow-y-auto pr-1">
                        {aiData.fasilitas.map((f) => (
                          <span key={f.id} className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
                            <span className="h-1.5 w-1.5 rounded-full bg-forest-soft" />
                            {f.nama_fasilitas}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border-[1.5px] border-dashed border-forest-soft/40 p-3 text-center text-xs italic text-muted-foreground">
                        Tidak ada fasilitas terdeteksi.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <InfoPill
                      icon={Wrench}
                      label="Instansi Penanganan"
                      value={
                        aiData.detail[0]?.petugas_penanganan && !aiData.detail[0].petugas_penanganan.includes("Cirebon")
                          ? aiData.detail[0].petugas_penanganan
                          : "Dinas SDABMBK Kota Tangerang Selatan"
                      }
                    />
                    <InfoPill icon={Clock} label="Target Respon SLA" value={aiData.detail[0]?.estimasi_waktu_penanganan || "24 Jam"} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ───────── Kolom kanan ───────── */}
        <div className="flex flex-col gap-5 lg:col-span-4">
          {/* Foto */}
          <div className={card}>
            <h3 className="mb-4 flex items-center gap-3 text-lg font-extrabold text-forest dark:text-foreground">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage">
                <Camera className="h-4 w-4" />
              </span>
              Bukti Foto Laporan
            </h3>
            <div className="relative flex h-[240px] w-full items-center justify-center overflow-hidden rounded-3xl bg-sage-soft">
              {photoUrl && !photoError ? (
                <img
                  src={photoUrl}
                  alt={report.name}
                  onLoad={() => setPhotoLoaded(true)}
                  onError={() => setPhotoError(true)}
                  className={`h-full w-full object-cover transition-opacity duration-500 ${photoLoaded ? "opacity-100" : "opacity-0"}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card">
                    <Camera className="h-6 w-6 opacity-40" />
                  </span>
                  <p className="text-xs font-semibold italic opacity-70">Tidak ada foto bukti dilampirkan</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel tindakan */}
          <div className={card}>
            <h3 className="flex items-center gap-3 text-lg font-extrabold text-forest dark:text-foreground">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Activity className="h-4 w-4" />
              </span>
              <span>
                Panel Tindakan
                <span className="block text-xs font-normal text-muted-foreground">Penanganan dan penugasan laporan</span>
              </span>
            </h3>

            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className={eyebrow}>Update Status Laporan</label>
                <Select value={report.status_pelaporan} onValueChange={(v) => updateStatus(v)}>
                  <SelectTrigger className={`text-xs font-bold ${
                    report.status_pelaporan === "progress"
                      ? STATUS_TONE.in_progress
                      : (STATUS_TONE[report.status_pelaporan as keyof typeof STATUS_TONE] || "")
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

              <div className="space-y-1.5">
                <label className={eyebrow}>Tingkat Urgensi</label>
                <Select value={report.kategori_pelaporan} onValueChange={(v) => updateUrgency(v)}>
                  <SelectTrigger className={`text-xs font-bold ${
                    report.kategori_pelaporan === "ringan"
                      ? URGENCY_TONE.low
                      : (URGENCY_TONE[report.kategori_pelaporan as keyof typeof URGENCY_TONE] || "")
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

              <div className="space-y-1.5">
                <label className={eyebrow}>Tugaskan Petugas Lapangan</label>
                <Select value={assignedPetugasId || undefined} onValueChange={(v) => assignPetugas(v)}>
                  <SelectTrigger className="text-xs font-medium">
                    <SelectValue placeholder="Pilih Petugas Lapangan…" />
                  </SelectTrigger>
                  <SelectContent>
                    {petugas.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-medium">{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-border/60 pt-5">
              <h4 className={eyebrow}>Informasi Sistem</h4>
              <div className="flex items-center justify-between rounded-full bg-sage-soft px-4 py-2">
                <span className="text-xs text-muted-foreground">ID Laporan</span>
                <span className="font-mono text-xs font-bold">{report.id.slice(0, 13)}…</span>
              </div>
              <div className="flex items-center justify-between rounded-full bg-sage-soft px-4 py-2">
                <span className="text-xs text-muted-foreground">Status Laporan</span>
                <span className="rounded-full bg-forest px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-primary">Valid</span>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-destructive/10 text-sm font-bold text-destructive transition-colors hover:bg-destructive hover:text-white">
                    <Trash2 className="h-4 w-4" /> Hapus Laporan
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm rounded-[32px] p-8 text-center">
                  <AlertDialogHeader className="items-center space-y-3 text-center sm:text-center">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-white">
                        <Trash className="h-6 w-6" />
                      </span>
                    </span>
                    <AlertDialogTitle className="text-2xl font-extrabold text-destructive">Hapus Laporan?</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                      Laporan akan dihapus permanen dari sistem dan database. Data detail kerusakan dan analisis terkait juga ikut terhapus.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-2 grid grid-cols-2 gap-3 sm:space-x-0">
                    <AlertDialogCancel className="mt-0 h-12 rounded-full border-[1.5px] border-forest font-bold text-forest">
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteReport}
                      className="h-12 rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
                    >
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, icon: Icon, mono,
}: { label: string; value: string; icon?: React.ComponentType<{ className?: string }>; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <span className={eyebrow}>{label}</span>
      <p className={`mt-1 flex items-center gap-1.5 text-sm font-extrabold text-forest sm:text-base dark:text-foreground ${mono ? "font-mono text-xs sm:text-sm" : ""}`}>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function Meter({
  label, value, barClass, textClass,
}: { label: string; value: number; barClass: string; textClass: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-muted-foreground">{label}</span>
        <span className={`text-sm font-extrabold ${textClass}`}>{value}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-card">
        <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function InfoPill({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-full bg-sage-soft py-2 pl-2 pr-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-extrabold text-forest dark:text-foreground">{value}</p>
      </div>
    </div>
  );
}