import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Camera, MapPin, Loader2, Crosshair, ShieldAlert, Clock,
  Wifi, ArrowRight, ArrowLeft, Check, Lightbulb, Radio, Send,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABEL, CATEGORY_ICON,
  STATUS_LABEL, STATUS_TONE,
  URGENCY_LABEL, URGENCY_TONE,
} from "@/lib/reports";
import { isWithinTangsel, TANGSEL_PRESETS, TANGSEL_CENTER } from "@/lib/leaflet-setup";
import { TANGSEL_KECAMATAN, KECAMATAN_LIST, findNearestKelurahan } from "@/lib/tangsel-data";

export const Route = createFileRoute("/_app/warga")({
  head: () => ({ meta: [{ title: "Lapor Kerusakan" }] }),
  component: WargaPage,
});

const reportSchema = z.object({
  category: z.enum(["jalan_berlubang", "pju_mati"]),
  detail_laporan: z.string().trim().min(10, "Detail laporan minimal 10 karakter").max(1000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().min(5, "Alamat wajib diisi minimal 5 karakter").max(200),
  name: z.string().trim().min(2, "Nama wajib diisi minimal 2 karakter").max(100),
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  phone: z.string().trim().min(8, "Nomor HP wajib diisi minimal 8 karakter").max(20),
});

async function fetchPublicIp(): Promise<string | null> {
  // Bypass untuk local development: agar tidak error karena AdBlock/CORS di localhost
  if (import.meta.env.DEV) {
    return "127.0.0.1";
  }

  // 1. Coba api.ipify.org (Paling standar untuk production)
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (res.ok) {
      const data = (await res.json()) as { ip?: string };
      if (data.ip) return data.ip;
    }
  } catch {}

  // 2. Fallback ke jsonip.com (Alternatif stabil dengan CORS support)
  try {
    const res = await fetch("https://jsonip.com");
    if (res.ok) {
      const data = (await res.json()) as { ip?: string };
      if (data.ip) return data.ip;
    }
  } catch {}

  return null;
}

async function fetchOSMPlaces(lat: number, lng: number): Promise<string[]> {
  // Query Overpass API untuk mencari amenity (fasilitas umum), bangunan penting, dan landuse pemukiman dalam radius 300m
  const query = `[out:json][timeout:15];(node(around:300,${lat},${lng})["amenity"];way(around:300,${lat},${lng})["amenity"];node(around:300,${lat},${lng})["building"~"school|hospital|residential|apartments|house"];way(around:300,${lat},${lng})["building"~"school|hospital|residential|apartments|house"];way(around:300,${lat},${lng})["landuse"~"residential"];relation(around:300,${lat},${lng})["landuse"~"residential"];);out tags center;`;

  try {
    const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("OSM Overpass query failed");

    const data = await response.json();
    const places: string[] = [];

    if (data.elements && Array.isArray(data.elements)) {
      for (const element of data.elements) {
        const tags = element.tags;
        if (!tags) continue;

        const name = tags.name;
        const amenity = tags.amenity;
        const building = tags.building;
        const landuse = tags.landuse;

        // Gunakan nama tempat jika ada, fallback ke tipe tempat
        if (name) {
          places.push(name);
        } else if (amenity) {
          places.push(amenity.replace(/_/g, " "));
        } else if (building) {
          places.push(building.replace(/_/g, " "));
        } else if (landuse) {
          places.push(landuse.replace(/_/g, " "));
        }
      }
    }

    return Array.from(new Set(places)).filter(Boolean);
  } catch (err) {
    console.error("Gagal mengambil data dari OSM Overpass:", err);
    return [];
  }
}

interface MyReport {
  id: string;
  category: keyof typeof CATEGORY_LABEL;
  name: string;
  email: string | null;
  no_hp: string;
  detail_laporan: string;
  status_pelaporan: string;
  kategori_pelaporan: string;
  created_at: string;
  address: string | null;
  photo_url: string | null;
  ip_address: string | null;
  latitude: number;
  longitude: number;
}

const QUOTA = 5;

type QuotaInfo = {
  ipStatus: "loading" | "ok" | "blocked" | "error";
  remaining: number;
};

function WargaPage() {
  const [quota, setQuota] = useState<QuotaInfo>({ ipStatus: "loading", remaining: QUOTA });

  return (
    <div className="flex min-h-screen flex-col bg-sage-soft dark:bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-[1200px] px-4 pb-4 pt-10 md:pt-14">
          <h1 className="text-3xl font-extrabold text-forest md:text-5xl dark:text-foreground">
            Lapor Kerusakan Infrastruktur
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Isi tiga langkah singkat berikut agar laporan Anda dapat segera diverifikasi dan ditindaklanjuti petugas.
          </p>
        </section>

        <section className="mx-auto grid max-w-[1200px] items-start gap-6 px-4 pb-14 pt-4 lg:grid-cols-[1.25fr_1fr]">
          <ReportForm onQuotaChange={setQuota} />
          <div className="flex flex-col gap-5 lg:sticky lg:top-28">
            <QuotaCard quota={quota} />
            <TipsCard />
            <RecentReportsList />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

// ── Kartu kuota (kolom kanan) ───────────────────────────────
function QuotaCard({ quota }: { quota: QuotaInfo }) {
  const C = 2 * Math.PI * 34;
  const ratio = Math.min(1, Math.max(0, quota.remaining / QUOTA));
  return (
    <div className="flex items-center gap-5 rounded-[32px] bg-forest p-6 text-white">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="34" fill="none" stroke="#c5e04b" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - ratio)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold leading-none">
            {quota.ipStatus === "loading" ? "…" : quota.remaining}
          </span>
          <span className="text-[10px] text-white/70">/ {QUOTA}</span>
        </div>
      </div>
      <div>
        <p className="text-lg font-extrabold">Kuota hari ini</p>
        <p className="mt-1 text-sm text-white/70">Reset otomatis setiap 24 jam</p>
      </div>
    </div>
  );
}

// ── Tips foto (kolom kanan) ─────────────────────────────────
function TipsCard() {
  const tips = ["Foto dari jarak 1–2 meter", "Pastikan cahaya cukup", "Sertakan patokan ukuran (sandal/koin)"];
  return (
    <div className="card-dashed p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Lightbulb className="h-5 w-5" />
        </span>
        <h3 className="text-base font-extrabold">Tips foto yang baik</h3>
      </div>
      <ul className="mt-4 space-y-2.5">
        {tips.map((t) => (
          <li key={t} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-primary">
              <Check className="h-3 w-3" />
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = ["Data pelapor", "Lokasi dan foto", "Detail"];

function ReportForm({ onQuotaChange }: { onQuotaChange: (q: QuotaInfo) => void }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<keyof typeof CATEGORY_LABEL>("jalan_berlubang");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [ipStatus, setIpStatus] = useState<"loading" | "ok" | "blocked" | "error">("loading");
  const [userIp, setUserIp] = useState<string | null>(null);
  const [remainingReports, setRemainingReports] = useState(QUOTA);
  const ipFetched = useRef(false);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("pamulang");
  const [selectedKelurahan, setSelectedKelurahan] = useState<string>("Pamulang Barat");
  const [streetDetail, setStreetDetail] = useState("");
  const [activeCategories, setActiveCategories] = useState<{
    jalan_berlubang: boolean;
  }>({
    jalan_berlubang: true,
  });

  // Kabari parent (kartu kuota) tiap status berubah
  useEffect(() => {
    onQuotaChange({ ipStatus, remaining: remainingReports });
  }, [ipStatus, remainingReports, onQuotaChange]);

  // Set default koordinat Tangsel jika belum ada
  useEffect(() => {
    if (!coords) {
      setCoords({ lat: -6.3465, lng: 106.7325 });
      setAddress("Kelurahan Pamulang Barat, Kecamatan Pamulang, Kota Tangerang Selatan");
    }
  }, []);

  // Ambil pengaturan kategori aktif dari Admin settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aura_system_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = {
          jalan_berlubang: parsed.catJalan !== false,
        };
        setActiveCategories(updated);

        // Jika default category tidak aktif, pindahkan ke kategori pertama yang aktif
        if (!updated.jalan_berlubang) {
          const firstActive = Object.keys(updated).find(
            (k) => updated[k as keyof typeof updated]
          ) as keyof typeof CATEGORY_LABEL | undefined;
          if (firstActive) {
            setCategory(firstActive);
          }
        }
      }
    } catch (e) {
      console.error("Gagal memuat pengaturan kategori aktif", e);
    }
  }, []);

  // Ambil IP & cek kuota saat halaman pertama dibuka
  useEffect(() => {
    if (ipFetched.current) return;
    ipFetched.current = true;

    (async () => {
      // DEV MODE: bypass IP fetch & RPC check agar bisa ditest tanpa migration SQL
      if (import.meta.env.DEV) {
        setUserIp("dev-mode");
        setRemainingReports(QUOTA);
        setIpStatus("ok");
        return;
      }

      // 1. Fetch IP publik
      const ip = await fetchPublicIp();
      if (!ip) { setIpStatus("error"); return; }
      setUserIp(ip);

      // 2. Panggil Supabase RPC: hitung laporan dari IP ini dalam 24 jam terakhir
      const { data, error } = await supabase.rpc("count_reports_by_ip", { _ip: ip });
      if (error) {
        console.error("Supabase RPC Error:", error);
        setIpStatus("error");
        return;
      }

      const count = (data as number) ?? 0;
      const remaining = Math.max(0, QUOTA - count);
      setRemainingReports(remaining);
      setIpStatus(count >= QUOTA ? "blocked" : "ok");
    })();
  }, []);

  const handleSelectKecamatan = (kecId: string) => {
    setSelectedKecamatan(kecId);
    const kec = TANGSEL_KECAMATAN[kecId];
    if (kec && kec.kelurahan.length > 0) {
      const firstKel = kec.kelurahan[0];
      setSelectedKelurahan(firstKel.name);
      setCoords({ lat: firstKel.center[0], lng: firstKel.center[1] });
      const addr = `Kelurahan ${firstKel.name}, ${kec.name}, Kota Tangerang Selatan${streetDetail ? ` - ${streetDetail}` : ""}`;
      setAddress(addr);
      toast.info(`Wilayah: ${kec.shortName} (${firstKel.name})`);
    }
  };

  const handleSelectKelurahan = (kelName: string) => {
    setSelectedKelurahan(kelName);
    const kec = TANGSEL_KECAMATAN[selectedKecamatan];
    if (kec) {
      const kel = kec.kelurahan.find((k) => k.name === kelName);
      if (kel) {
        setCoords({ lat: kel.center[0], lng: kel.center[1] });
        const addr = `Kelurahan ${kel.name}, ${kec.name}, Kota Tangerang Selatan${streetDetail ? ` - ${streetDetail}` : ""}`;
        setAddress(addr);
        toast.success(`Lokasi: Kelurahan ${kel.name}, ${kec.shortName}`);
      }
    }
  };

  const handleStreetDetailChange = (text: string) => {
    setStreetDetail(text);
    const kec = TANGSEL_KECAMATAN[selectedKecamatan];
    const kelName = selectedKelurahan || (kec?.kelurahan[0]?.name ?? "");
    const kecName = kec?.name || "Kota Tangerang Selatan";
    setAddress(`Kelurahan ${kelName}, ${kecName}, Kota Tangerang Selatan${text ? ` - ${text}` : ""}`);
  };

  const getLocation = () => {
    if (!navigator.geolocation) { toast.error("Browser tidak mendukung geolocation"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isWithinTangsel(lat, lng)) {
          toast.warning("Lokasi GPS di luar Tangerang Selatan. Memilih titik pusat Tangerang Selatan.");
          setCoords({ lat: TANGSEL_CENTER[0], lng: TANGSEL_CENTER[1] });
          if (!address) setAddress("Kecamatan Pamulang, Kota Tangerang Selatan");
        } else {
          setCoords({ lat, lng });
          const nearest = findNearestKelurahan(lat, lng);
          setSelectedKecamatan(nearest.kecamatanId);
          setSelectedKelurahan(nearest.name);
          const addr = `Kelurahan ${nearest.name}, ${nearest.kecamatanName}, Kota Tangerang Selatan${streetDetail ? ` - ${streetDetail}` : ""}`;
          setAddress(addr);
          toast.success(`Lokasi GPS terdeteksi: Kel. ${nearest.name}, ${nearest.kecamatanShort}`);
        }
        setLocating(false);
      },
      (err) => { setLocating(false); toast.error("Gagal ambil lokasi: " + err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Validasi per langkah sebelum lanjut
  const validateStep = (s: number): boolean => {
    if (s === 1) {
      const r = reportSchema.pick({ name: true, email: true, phone: true }).safeParse({ name, email, phone });
      if (!r.success) { toast.error(r.error.issues[0].message); return false; }
    }
    if (s === 2) {
      if (!coords) { toast.error("Ambil lokasi GPS terlebih dahulu"); return false; }
      const r = reportSchema.pick({ address: true }).safeParse({ address });
      if (!r.success) { toast.error(r.error.issues[0].message); return false; }
      if (!photo) { toast.error("Foto bukti kerusakan wajib dilampirkan"); return false; }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enter di langkah 1/2 = lanjut, bukan kirim
    if (step < 3) { goNext(); return; }

    if (ipStatus === "blocked") { toast.error("Batas harian tercapai. Coba lagi besok."); return; }
    if (!userIp) { toast.error("IP tidak terdeteksi. Refresh halaman dan coba lagi."); return; }
    if (!coords) { toast.error("Ambil lokasi GPS terlebih dahulu"); return; }

    const parsed = reportSchema.safeParse({
      category, detail_laporan: description, name, email, phone,
      latitude: coords.lat, longitude: coords.lng,
      address,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    if (!photo) {
      toast.error("Foto bukti kerusakan wajib dilampirkan");
      return;
    }

    setSubmitting(true);

    // Double-check cooldown di detik terakhir (security layer ke-2)
    const { data: freshCount } = await supabase.rpc("count_reports_by_ip", { _ip: userIp });
    if (((freshCount as number) ?? 0) >= QUOTA) {
      setSubmitting(false);
      setIpStatus("blocked");
      setRemainingReports(0);
      toast.error("Batas harian tercapai. Silakan coba lagi besok (reset setiap 24 jam).");
      return;
    }

    // Upload foto (wajib) – simpan di folder 'anon'
    const ext = photo.name.split(".").pop() ?? "jpg";
    const photoPath = `anon/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("reports").upload(photoPath, photo, {
      cacheControl: "3600", upsert: false,
    });
    if (upErr) {
      setSubmitting(false);
      toast.error("Gagal upload foto: " + upErr.message);
      return;
    }

    // 1. Kirim berkas gambar & GPS ke API Kecerdasan Buatan (Hugging Face)
    let aiResponse: any = null;
    try {
      const apiFormData = new FormData();
      apiFormData.append("file", photo);
      apiFormData.append("lat", String(parsed.data.latitude));
      apiFormData.append("lon", String(parsed.data.longitude));

      const apiRes = await fetch("https://dennis1645-aura-ai.hf.space/api/v1/analyze", {
        method: "POST",
        body: apiFormData,
      });

      if (!apiRes.ok) {
        throw new Error(`API AI merespon dengan status ${apiRes.status}`);
      }

      aiResponse = await apiRes.json();
    } catch (apiErr: any) {
      setSubmitting(false);
      toast.error("Gagal melakukan analisis AI: " + apiErr.message);
      return;
    }

    // 2. Ambil data tempat sekitar dari OSM Overpass API secara realtime di sisi klien
    let osmPlaces: string[] = [];
    try {
      osmPlaces = await fetchOSMPlaces(parsed.data.latitude, parsed.data.longitude);
    } catch (err) {
      console.error("Gagal mengambil data OSM Overpass di onSubmit:", err);
    }

    // Gabungkan fasilitas dari AI response dan OSM Overpass
    const combinedFasilitas = Array.from(new Set([
      ...(aiResponse.Konteks_Geospasial?.Fasilitas_Radius_300m || []),
      ...osmPlaces
    ])).filter(Boolean);

    // 3. Simpan Laporan Utama ke tabel public.laporan_jalan
    const { data: jalanData, error: jalanErr } = await supabase
      .from("laporan_jalan")
      .insert({
        image_file: photoPath,
        total_lubang_terdeteksi: aiResponse.Total_Lubang_Terdeteksi ?? 0,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        detail_lokasi: aiResponse.Konteks_Geospasial?.Detail_Lokasi || parsed.data.address,
      })
      .select("id")
      .single();

    if (jalanErr || !jalanData) {
      setSubmitting(false);
      toast.error("Gagal menyimpan data laporan jalan: " + (jalanErr?.message || "Unknown error"));
      return;
    }

    const laporanId = jalanData.id;

    // 4. Simpan Fasilitas Radius 300 meter ke tabel public.fasilitas_radius
    if (combinedFasilitas.length > 0) {
      const insertFasilitas = combinedFasilitas.map((nama: string) => ({
        laporan_id: laporanId,
        nama_fasilitas: nama,
      }));
      const { error: fasErr } = await supabase.from("fasilitas_radius").insert(insertFasilitas);
      if (fasErr) {
        console.error("Gagal menyimpan fasilitas sekitar ke database:", fasErr.message);
      }
    }

    // Tentukan tingkat urgensi berdasarkan fasilitas sekitar (OSM)
    const hasCritical = combinedFasilitas.some((place: string) => {
      const norm = place.toLowerCase();
      return norm.includes("sekolah") || norm.includes("school") ||
             norm.includes("sd") || norm.includes("smp") ||
             norm.includes("sma") || norm.includes("smk") ||
             norm.includes("madrasah") || norm.includes("tk") ||
             norm.includes("rumah sakit") || norm.includes("hospital") ||
             norm.includes("klinik") || norm.includes("clinic") ||
             norm.includes("puskesmas") || norm.includes("apotek");
    });

    const hasMedium = combinedFasilitas.some((place: string) => {
      const norm = place.toLowerCase();
      return norm.includes("pemukiman") || norm.includes("residential") ||
             norm.includes("perumahan") || norm.includes("apartmen") ||
             norm.includes("kampung") || norm.includes("residence") ||
             norm.includes("house") || norm.includes("griya") ||
             norm.includes("kost") || norm.includes("warga");
    });

    let determinedUrgencyKey: "low" | "medium" | "high" | "critical" = "low";
    if (hasCritical) {
      determinedUrgencyKey = "critical";
    } else if (hasMedium) {
      determinedUrgencyKey = "medium";
    } else {
      determinedUrgencyKey = "low";
    }

    const urgencyLabelMap = {
      low: "Ringan",
      medium: "Sedang",
      high: "Tinggi",
      critical: "Kritis",
    };

    const determinedUrgencyOSMLabel = urgencyLabelMap[determinedUrgencyKey];

    // 5. Simpan Detail Analisis Lubang ke tabel public.detail_lubang
    const daftarAnalisis = aiResponse.Analisis_Kerusakan || [];
    const parsePctValue = (val: string | number) => {
      if (typeof val === "number") return val;
      if (!val) return 0;
      return parseFloat(val.replace("%", "")) || 0;
    };

    if (daftarAnalisis.length > 0) {
      const insertDetail = daftarAnalisis.map((item: any) => ({
        laporan_id: laporanId,
        severity_visual: item.Severity_Visual || item.Severity || "Kecil",
        persentase_kerusakan: parsePctValue(item.Persentase_Kerusakan || item["Persentase Kerusakan"]),
        persentase_kedalaman: parsePctValue(item.Persentase_Kedalaman || item["Persentase Kedalaman"]),
        kategori_pelaporan_osm: determinedUrgencyOSMLabel,
        nilai_score: item.Severity_Scoring?.Nilai_Score ?? 0,
        status_score: item.Severity_Scoring?.Status_Score ?? "Baik",
        petugas_penanganan: item.Severity_Scoring?.Petugas_Penanganan || "Dinas PUPR Kota Cirebon",
        estimasi_waktu_penanganan: item.Severity_Scoring?.Estimasi_Waktu_Penanganan || "24 Jam",
      }));
      const { error: detErr } = await supabase.from("detail_lubang").insert(insertDetail);
      if (detErr) {
        console.error("Gagal menyimpan analisis detail lubang:", detErr.message);
      }
    } else {
      // Fallback jika AI tidak menemukan lubang visual di jalan tersebut
      const { error: detErr } = await supabase.from("detail_lubang").insert({
        laporan_id: laporanId,
        severity_visual: "Kecil",
        persentase_kerusakan: 0,
        persentase_kedalaman: 0,
        kategori_pelaporan_osm: determinedUrgencyOSMLabel,
        nilai_score: 0,
        status_score: "Baik",
        petugas_penanganan: "Dinas PUPR Kota Cirebon",
        estimasi_waktu_penanganan: "24 Jam",
      });
      if (detErr) {
        console.error("Gagal menyimpan detail default lubang:", detErr.message);
      }
    }

    // 6. Update Akumulasi Indeks ALI Global ke tabel public.metadata_ali
    const indexAliTerbaru = aiResponse.AURA_Location_Index_Kumulatif ?? 0;
    if (indexAliTerbaru > 0) {
      const { error: aliErr } = await supabase
        .from("metadata_ali")
        .update({ total_index_ali: indexAliTerbaru })
        .eq("id", 1);
      if (aliErr) {
        console.error("Gagal memperbarui total index ALI:", aliErr.message);
      }
    }

    // 7. Simpan Laporan Utama ke data backup tabel reports untuk kelayakan admin panel
    const { data: newReportData, error: reportsBackupErr } = await supabase.from("reports").insert({
      reporter_id: null,
      ip_address: userIp,
      category: parsed.data.category,
      name: parsed.data.name,
      email: parsed.data.email,
      no_hp: parsed.data.phone,
      detail_laporan: parsed.data.detail_laporan,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      address: parsed.data.address,
      photo_url: photoPath,
      kategori_pelaporan: determinedUrgencyKey,
      status_pelaporan: "pending",
    }).select("id").single();

    setSubmitting(false);
    if (reportsBackupErr) {
      console.error("Gagal menyimpan data backup laporan:", reportsBackupErr.message);
    } else if (newReportData) {
      // Jalankan Auto-Assign jika diaktifkan di pengaturan sistem
      try {
        const savedSettings = localStorage.getItem("aura_system_settings");
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.enableAutoAssign) {
            const { error: rpcErr } = await supabase.rpc("assign_petugas_auto", {
              report_id: newReportData.id
            });
            if (rpcErr) {
              console.error("Gagal memproses Auto-Assign via RPC:", rpcErr.message);
            } else {
              console.log("Auto-Assign berhasil via RPC untuk laporan ID:", newReportData.id);
            }
          }
        }
      } catch (e) {
        console.error("Gagal memproses Auto-Assign:", e);
      }
    }

    toast.success("Laporan berhasil dikirim dan dianalisis oleh AI!");
    setDescription(""); setAddress(""); setPhoto(null); setCoords(null);
    setName(""); setEmail(""); setPhone("");
    setStep(1);

    const newRemaining = Math.max(0, remainingReports - 1);
    setRemainingReports(newRemaining);
    if (newRemaining === 0) setIpStatus("blocked");
  };

  const formDisabled = ipStatus === "blocked" || ipStatus === "loading";

  const ipBanner = (() => {
    if (ipStatus === "loading") return (
      <div className="flex items-center gap-2 rounded-full bg-sage px-5 py-3 text-sm text-forest">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span>Mendeteksi perangkat Anda…</span>
      </div>
    );
    if (ipStatus === "error") return (
      <div className="flex items-center gap-2 rounded-3xl border border-warning/40 bg-warning/15 px-5 py-3 text-sm text-warning-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>Tidak dapat mendeteksi jaringan. Pastikan internet aktif lalu refresh halaman.</span>
      </div>
    );
    if (ipStatus === "blocked") return (
      <div className="flex items-center gap-2 rounded-3xl border border-destructive/30 bg-destructive/10 px-5 py-3 text-sm text-destructive">
        <Clock className="h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Batas harian tercapai</p>
          <p className="mt-0.5 text-xs opacity-80">
            Anda sudah mengirim {QUOTA} laporan hari ini. Kuota reset otomatis setelah 24 jam.
          </p>
        </div>
      </div>
    );
    return (
      <div className="flex items-center justify-between gap-3 rounded-full bg-sage px-5 py-3 text-sm text-forest">
        <span className="flex min-w-0 items-center gap-2 text-xs">
          <Wifi className="h-4 w-4 shrink-0" />
          <span className="truncate">IP terdeteksi: <code className="font-mono">{userIp}</code></span>
        </span>
        <span className="shrink-0 text-xs font-extrabold">Sisa kuota: {remainingReports}/{QUOTA}</span>
      </div>
    );
  })();

  const stepTitle = [
    "Siapa yang melapor?",
    "Tentukan lokasi dan unggah foto",
    "Ceritakan detail kerusakan",
  ][step - 1];

  return (
    <div className="rounded-[36px] bg-card p-6 shadow-soft md:p-8">
      {ipBanner}

      {/* Stepper */}
      <ol className="mt-6 flex items-center" aria-label="Langkah pengisian">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                    done || active ? "bg-primary text-primary-foreground" : "bg-sage text-forest/60"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </span>
                <span className={`hidden text-sm font-bold sm:inline ${active ? "text-forest dark:text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {n < STEPS.length && (
                <span className={`mx-3 h-0.5 flex-1 rounded-full ${done ? "bg-primary" : "bg-sage"}`} />
              )}
            </li>
          );
        })}
      </ol>

      <h2 className="mt-7 text-xl font-extrabold text-forest dark:text-foreground">{stepTitle}</h2>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="font-bold">Nama Lengkap</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda" disabled={formDisabled} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-bold">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com" disabled={formDisabled} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="font-bold">No. HP / WhatsApp</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789" disabled={formDisabled} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-3 rounded-2xl border border-forest/15 bg-sage-soft/40 p-4">
              <div>
                <Label className="font-extrabold text-forest dark:text-foreground">
                  Wilayah Administratif (Kota Tangerang Selatan)
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pilih Kecamatan dan Kelurahan sesuai lokasi kerusakan yang ingin dilaporkan.
                </p>
              </div>

              {/* 1. Pilih Kecamatan (7 Kecamatan Resmi) */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-forest">1. Pilih Kecamatan:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {KECAMATAN_LIST.map((kec) => {
                    const isSelected = selectedKecamatan === kec.id;
                    return (
                      <button
                        key={kec.id}
                        type="button"
                        onClick={() => handleSelectKecamatan(kec.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left ${
                          isSelected
                            ? "shadow-sm border-forest text-white"
                            : "bg-white/80 hover:bg-white text-forest border-border/60"
                        }`}
                        style={{
                          backgroundColor: isSelected ? kec.color : undefined,
                        }}
                      >
                        <span
                          className={`text-[9px] font-extrabold px-1 rounded ${
                            isSelected ? "bg-white/30 text-white" : ""
                          }`}
                          style={{
                            backgroundColor: isSelected ? undefined : kec.bgLight,
                            color: isSelected ? undefined : kec.textColor,
                          }}
                        >
                          {kec.code}
                        </span>
                        <span className="truncate">{kec.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Pilih Kelurahan (54 Kelurahan) */}
              {selectedKecamatan && TANGSEL_KECAMATAN[selectedKecamatan] && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-forest">
                    2. Pilih Kelurahan ({TANGSEL_KECAMATAN[selectedKecamatan].name}):
                  </span>
                  <Select
                    value={selectedKelurahan}
                    onValueChange={(val) => handleSelectKelurahan(val)}
                  >
                    <SelectTrigger className="h-11 bg-white font-bold select-none border-forest/20">
                      <SelectValue placeholder="Pilih Kelurahan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TANGSEL_KECAMATAN[selectedKecamatan].kelurahan.map((kel) => (
                        <SelectItem key={kel.code} value={kel.name}>
                          <span className="font-extrabold text-xs text-primary mr-2">[{kel.code}]</span>
                          Kelurahan {kel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* GPS Button Fallback / Quick Detect */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-forest/10">
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locating || formDisabled}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-forest px-4 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5 text-primary" />}
                  {coords ? "Deteksi Ulang via GPS" : "Deteksi Otomatis via GPS"}
                </button>
                {coords && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-forest border border-forest/10">
                    <MapPin className="h-3 w-3 text-primary" /> {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="streetDetail" className="font-bold">
                Detail Nama Jalan / Patokan (Opsional)
              </Label>
              <Input
                id="streetDetail"
                value={streetDetail}
                onChange={(e) => handleStreetDetailChange(e.target.value)}
                placeholder="Contoh: Jl. Pahlawan Seribu No. 12, depan ruko..."
                disabled={formDisabled}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="font-bold">Alamat Terverifikasi Lengkap</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Kelurahan ..., Kecamatan ..., Kota Tangerang Selatan"
                disabled={formDisabled}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photo" className="font-bold">Foto Kerusakan</Label>
              <label
                htmlFor="photo"
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[28px] border-[1.5px] border-dashed border-forest-soft/40 bg-field px-5 py-8 text-center transition-colors hover:border-forest-soft"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Camera className="h-5 w-5" />
                </span>
                <span className="mt-1 text-sm font-bold text-forest dark:text-foreground">
                  {photo ? photo.name : "Pilih foto (Wajib)"}
                </span>
                <span className="text-xs text-muted-foreground">JPG/PNG maks 5MB</span>
              </label>
              <input id="photo" type="file" accept="image/*" capture="environment" className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 5 * 1024 * 1024) { toast.error("Ukuran foto maksimal 5MB"); return; }
                  setPhoto(f);
                }}
                disabled={formDisabled} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-1.5">
              <Label className="font-bold">Kategori kerusakan</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as keyof typeof CATEGORY_LABEL)} disabled={formDisabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABEL)
                    .filter(([k]) => activeCategories[k as keyof typeof activeCategories])
                    .map(([k, v]) => {
                      const Icon = CATEGORY_ICON[k as keyof typeof CATEGORY_ICON];
                      return (
                        <SelectItem key={k} value={k}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-foreground" /><span>{v}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="font-bold">Detail Laporan</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan detail kondisi, ukuran, dan dampak kerusakan…" rows={5} disabled={formDisabled} />
            </div>
          </>
        )}

        {/* Navigasi langkah */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-forest px-6 text-sm font-bold text-forest transition-colors hover:bg-sage dark:border-foreground dark:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </button>
          ) : <span />}

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={formDisabled}
              className="inline-flex h-12 items-center gap-3 rounded-full bg-primary pl-7 pr-1.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Lanjut
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-primary">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || formDisabled || ipStatus === "error"}
              className="inline-flex h-12 items-center gap-3 rounded-full bg-primary pl-7 pr-1.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim…</> : "Kirim laporan"}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-primary">
                <Send className="h-4 w-4" />
              </span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Daftar laporan terbaru (semua, bukan per user) ─────────
const maskPhone = (p: string) => (p && p.length > 7 ? `${p.slice(0, 4)}****${p.slice(-3)}` : p);
const shortName = (n: string) => {
  const parts = (n || "").trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0] || "Warga";
};
const pillDot: Record<string, string> = {
  pending: "bg-warning", progress: "bg-info", in_progress: "bg-info", resolved: "bg-success", selesai: "bg-success",
  low: "bg-success", ringan: "bg-success", medium: "bg-warning", high: "bg-orange", critical: "bg-destructive",
};

function RecentReportsList() {
  const [reports, setReports] = useState<MyReport[] | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      setReports((data ?? []) as MyReport[]);
    };
    load();
    const channel = supabase
      .channel("recent-reports")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="rounded-[32px] bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-forest dark:text-foreground">Laporan terbaru</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
          <Radio className="h-3 w-3" /> Realtime
        </span>
      </div>

      <div className="mt-4 min-h-[12rem] space-y-3 overflow-y-auto overscroll-contain pr-1 lg:max-h-[calc(100vh-44rem)]">
        {reports === null && <p className="text-sm text-muted-foreground">Memuat…</p>}
        {reports?.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada laporan. Jadilah yang pertama!
          </div>
        )}
        {reports?.map((r) => {
          const Icon = CATEGORY_ICON[r.category];
          const statusKey = r.status_pelaporan;
          const urgKey = r.kategori_pelaporan;
          return (
            <div key={r.id} className="rounded-3xl border border-border/70 bg-background p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-forest">
                  {Icon && <Icon className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{shortName(r.name)} · {maskPhone(r.no_hp)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: idLocale })}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${statusKey === "progress" ? STATUS_TONE.in_progress : (STATUS_TONE[statusKey as keyof typeof STATUS_TONE] || "bg-secondary text-secondary-foreground")}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${pillDot[statusKey] ?? "bg-muted-foreground"}`} />
                  {statusKey === "progress" ? "Dikerjakan" : (STATUS_LABEL[statusKey as keyof typeof STATUS_LABEL] || statusKey)}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${urgKey === "ringan" ? URGENCY_TONE.low : (URGENCY_TONE[urgKey as keyof typeof URGENCY_TONE] || "bg-secondary text-secondary-foreground")}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${pillDot[urgKey] ?? "bg-muted-foreground"}`} />
                  {urgKey === "ringan" ? "Ringan" : (URGENCY_LABEL[urgKey as keyof typeof URGENCY_LABEL] || urgKey)}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.detail_laporan}</p>
              {r.address && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{r.address}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}