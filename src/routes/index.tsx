import { useEffect, useRef, useState, ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  X,
  MapPin,
  Camera,
  Wrench,
  ShieldCheck,
  Activity,
  Lightbulb,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Users,
  FileText,
  Star,
  ScanSearch,
  MessageSquarePlus,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CtaBanner } from "@/components/cta-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TangselDiorama } from "@/components/tangsel-diorama";
import potholeImg from "@/assets/pothole_road.jpg";
import rawaBuntuRoadImg from "@/assets/rawa_buntu_road.jpg";
import pamulangRoadImg from "@/assets/pamulang_road.jpg";
import pondokArenRoadImg from "@/assets/pondok_aren_road.jpg";
import ciputatRoadImg from "@/assets/ciputat_road.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AURA" },
      {
        name: "description",
        content:
          "AURA membantu warga melaporkan kerusakan jalan, trotoar, dan PJU. Admin dinas memantau lewat peta GIS real-time dan menugaskan petugas lapangan secara otomatis.",
      },
      { property: "og:title", content: "AURA — Ekosistem Tata Kota Cerdas" },
      {
        property: "og:description",
        content:
          "Lapor kerusakan infrastruktur kota dalam hitungan detik. Pantau penanganan secara real-time melalui dashboard GIS.",
      },
    ],
  }),
  component: HomePage,
});

const QUICK_CARDS = [
  { icon: Camera, t: "Foto dan GPS", d: "Satu foto, lokasi terekam otomatis." },
  { icon: ScanSearch, t: "Verifikasi AI", d: "Tingkat kerusakan dinilai otomatis." },
  { icon: Wrench, t: "Penugasan Petugas", d: "Work order langsung ke petugas." },
];

const INITIAL_KELURAHAN = [
  { id: "rawa-buntu", name: "Kelurahan Rawa Buntu", sub: "Kec. Serpong, Tangsel", stat: "98% Selesai", reports: 420, rating: 4.9, speed: "24 Jam", img: rawaBuntuRoadImg },
  { id: "pamulang-barat", name: "Kelurahan Pamulang Barat", sub: "Kec. Pamulang, Tangsel", stat: "95% Selesai", reports: 310, rating: 4.8, speed: "36 Jam", img: pamulangRoadImg },
  { id: "pondok-aren", name: "Kelurahan Pondok Aren", sub: "Kec. Pondok Aren, Tangsel", stat: "99% Selesai", reports: 510, rating: 5.0, speed: "18 Jam", img: pondokArenRoadImg },
  { id: "ciputat", name: "Kelurahan Ciputat", sub: "Kec. Ciputat, Tangsel", stat: "92% Selesai", reports: 280, rating: 4.7, speed: "48 Jam", img: ciputatRoadImg },
];

const STEPS = [
  { n: "01", icon: Camera, t: "Warga Melapor", d: "Mengunggah foto kerusakan jalan, mendeteksi lokasi GPS otomatis dalam waktu 30 detik." },
  { n: "02", icon: Sparkles, t: "Verifikasi Sistem", d: "Sistem AI mengolah citra laporan untuk mengklasifikasikan tingkat urgensi secara otomatis." },
  { n: "03", icon: Wrench, t: "Petugas Lapangan", d: "Menerima work order terdekat, melakukan perbaikan, dan mengirimkan konfirmasi hasil kerja." },
  { n: "04", icon: ShieldCheck, t: "Selesai & Terbuka", d: "Admin memverifikasi perbaikan dan status diperbarui di peta GIS publik warga." },
];

const TESTIMONIALS = [
  { n: "Siti Rahmawati", r: "Warga Pamulang Barat", q: "Lubang di depan rumah dilaporkan pagi, sore sudah ada petugas yang datang menambal." },
  { n: "Budi Santoso", r: "Warga Rawa Buntu", q: "Saya suka bisa lihat status laporan. Tidak perlu lagi menelepon kelurahan." },
  { n: "Maya Putri", r: "Warga Pondok Aren", q: "Prosesnya cepat, cukup foto dan kirim. Lokasinya terisi sendiri." },
];

function Pill({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-4 py-1.5 text-xs font-bold ${
        dark ? "bg-forest text-primary" : "bg-sage text-forest"
      }`}
    >
      {children}
    </span>
  );
}

function ArrowCircle() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-primary">
      <ArrowRight className="h-4 w-4" />
    </span>
  );
}

function HomePage() {
  const [appStage, setAppStage] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);

  // Interaktif Rating Kelurahan
  const [kelurahanList, setKelurahanList] = useState(INITIAL_KELURAHAN);
  const [activeKelurahan, setActiveKelurahan] = useState<typeof INITIAL_KELURAHAN[0] | null>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [hoverRatingVal, setHoverRatingVal] = useState(0);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerComment, setReviewerComment] = useState("");

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKelurahan) return;
    if (!reviewerName.trim() || !reviewerComment.trim()) {
      toast.error("Mohon isi nama dan ulasan Anda.");
      return;
    }

    setKelurahanList((prev) =>
      prev.map((k) => {
        if (k.id === activeKelurahan.id) {
          const newReports = k.reports + 1;
          const newAvgRating = Number(((k.rating * k.reports + ratingVal) / newReports).toFixed(1));
          return {
            ...k,
            reports: newReports,
            rating: Math.min(5.0, newAvgRating),
          };
        }
        return k;
      })
    );

    toast.success(`Rating ⭐ ${ratingVal}.0 untuk ${activeKelurahan.name} berhasil disimpan!`);
    setActiveKelurahan(null);
    setReviewerName("");
    setReviewerComment("");
    setRatingVal(5);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setAppStage((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader overlay />
      <main className="flex-1">
        {/* HERO */}
        <section className="px-3 pt-3 md:px-5 md:pt-5">
          <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[36px] bg-forest">
            <img
              src={pamulangRoadImg}
              alt="Jalan di Tangerang Selatan"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-forest/20" />
            <div className="relative grid min-h-[680px] items-end gap-8 px-6 pb-12 pt-40 md:px-14 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="flex flex-col gap-5 text-white animate-fade-in-up">
                <Pill>Uji coba di 4 kelurahan Tangerang Selatan</Pill>
                <h1 className="text-4xl font-extrabold leading-[1.05] text-balance sm:text-5xl lg:text-6xl">
                  Jalan berlubang di Tangsel? Foto, kirim, pantau sampai ditambal.
                </h1>
                <p className="max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
                  Foto lubangnya, AURA mencatat lokasinya, lalu tugasnya masuk ke petugas dinas. Status laporan bisa kamu lihat kapan saja.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="gap-3 pr-2">
                    <Link to="/warga">
                      Lapor sekarang <ArrowCircle />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="border border-white/40 !bg-transparent text-white hover:!bg-white/15 hover:text-white font-medium shadow-none"
                  >
                    <Link to="/fitur">Lihat cara kerjanya</Link>
                  </Button>
                </div>
              </div>

              <div className="h-[260px] w-full max-w-[340px] animate-fade-in-up justify-self-end overflow-hidden rounded-[32px] ring-4 ring-white/20">
                <TangselDiorama />
              </div>
            </div>
          </div>

          {/* 3 poin singkat */}
          <div className="mx-auto mt-6 flex max-w-[1200px] flex-wrap justify-center gap-x-10 gap-y-3 px-4 text-sm font-semibold text-forest dark:text-foreground">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Lokasi terekam otomatis</span>
            <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Langsung ke petugas</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Status laporan bisa dipantau</span>
          </div>

          {/* 3 kartu layanan */}
          <div className="mx-auto mt-8 grid max-w-[1200px] gap-4 px-2 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_CARDS.map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex min-h-[200px] flex-col rounded-[28px] border border-border bg-card p-6 shadow-soft">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage text-forest">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                <span className="mt-auto flex h-9 w-9 items-center justify-center self-end rounded-full bg-forest text-primary">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* KENAPA AURA */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 md:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div className="space-y-6">
              <div className="space-y-3">
                <Pill>Mengapa Memilih AURA</Pill>
                <h2 className="text-3xl font-extrabold leading-tight text-forest md:text-4xl dark:text-foreground">
                  Sistem Pelaporan Tata Kota Terintegrasi & Efisien
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  AURA menghadirkan kemudahan melapor kerusakan jalan langsung dari ponsel Anda. Didukung sistem pemetaan GIS real-time dan dispatch petugas dinas secara instan.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: MapPin, t: "Deteksi Lokasi Otomatis", d: "Sistem kami secara otomatis merekam koordinat GPS presisi dan mencocokkannya dengan wilayah kelurahan terkait.", delay: 50 },
                  { icon: Wrench, t: "Penugasan Kerja Instan", d: "Laporan yang lolos verifikasi AI langsung didisposisikan ke aplikasi petugas lapangan untuk penanganan segera.", delay: 150 },
                  { icon: ShieldCheck, t: "Monitoring Progres Transparan", d: "Pantau setiap tahapan pengerjaan secara langsung melalui peta GIS publik, mulai dari aduan masuk hingga jalan mulus kembali.", delay: 250 },
                ].map(({ icon: Icon, t, d, delay }) => (
                  <ScrollReveal key={t} direction="up" delay={delay}>
                    <div className="card-dashed flex items-center gap-4 p-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h4 className="text-sm font-extrabold">{t}</h4>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{d}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: FileText, v: "2.4k+", l: "Laporan Selesai", tone: "bg-forest text-white", num: "text-primary" },
                  { icon: CheckCircle2, v: "94%", l: "Penyelesaian", tone: "bg-sage text-forest", num: "text-forest" },
                  { icon: Users, v: "37", l: "Petugas Siaga", tone: "bg-forest text-white", num: "text-primary" },
                ].map(({ icon: Icon, v, l, tone, num }) => (
                  <div key={l} className={`rounded-3xl p-4 ${tone}`}>
                    <Icon className="h-4 w-4 opacity-70" />
                    <p className={`mt-2 text-2xl font-extrabold sm:text-3xl ${num}`}>{v}</p>
                    <p className="text-[11px] font-semibold opacity-80">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulator ponsel */}
            <ScrollReveal direction="up" delay={200} className="flex justify-center lg:justify-end">
              <div className="relative h-[580px] w-[300px] select-none overflow-hidden rounded-[3rem] border-[6px] border-forest-soft bg-forest p-3.5 shadow-elev">
                <div className="absolute left-1/2 top-4 z-30 h-4 w-24 -translate-x-1/2 rounded-full bg-forest" />
                <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2.4rem] bg-background">
                  <div className="flex items-center justify-between border-b border-border/60 bg-card px-4 pb-3 pt-6">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      <span className="text-[10px] font-bold text-foreground/80">AURA Citizen</span>
                    </div>
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[9px] text-muted-foreground">v1.0</span>
                  </div>

                  <div className="flex flex-1 flex-col justify-center p-4">
                    {appStage === 0 && (
                      <div className="space-y-4">
                        <div className="relative flex h-[240px] w-full items-center justify-center overflow-hidden rounded-3xl bg-sky/50">
                          <svg className="absolute inset-0 h-full w-full text-forest/10" fill="none">
                            <path d="M 0,80 L 260,80 M 80,0 L 80,240 M 0,160 L 260,120 M 170,0 L 170,240" stroke="currentColor" strokeWidth="2.5" />
                            <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                          </svg>
                          <span className="relative flex h-6 w-6">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                            <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-forest text-primary shadow-soft">
                              <MapPin className="h-3 w-3" />
                            </span>
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Mendeteksi Lokasi</span>
                          <p className="truncate text-[11px] font-bold leading-tight">BSD City, Tangerang Selatan</p>
                        </div>
                      </div>
                    )}

                    {appStage === 1 && (
                      <div className="space-y-4">
                        <div className="relative flex h-[240px] w-full items-center justify-center overflow-hidden rounded-3xl">
                          <img src={potholeImg} alt="Foto jalan berlubang" className="absolute inset-0 h-full w-full object-cover" />
                          <div className="pointer-events-none absolute inset-0 bg-black/10" />
                          <div className="animate-scan pointer-events-none absolute inset-x-0 h-0.5 bg-primary" />
                          <div className="absolute flex h-24 w-36 flex-col justify-between rounded-xl border-2 border-primary bg-primary/20 p-1">
                            <div className="w-fit rounded-full bg-primary px-2 py-0.5 font-mono text-[8px] font-bold tracking-widest text-primary-foreground">
                              JALAN BERLUBANG
                            </div>
                            <div className="w-fit self-end rounded-full bg-black/60 px-1.5 font-mono text-[8px] font-bold text-primary">94.6%</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Pindai Objek Foto</span>
                          <p className="text-[11px] font-bold leading-tight">Terdeteksi: Kerusakan Jalan (Sedang)</p>
                        </div>
                      </div>
                    )}

                    {appStage === 2 && (
                      <div className="space-y-4">
                        <div className="flex h-[240px] w-full flex-col justify-center gap-3.5 rounded-3xl bg-field p-4">
                          <div className="space-y-1.5">
                            <div className="h-2 w-1/3 rounded-full bg-forest/15" />
                            <div className="h-6 w-full rounded-full bg-forest/10" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2 w-1/4 rounded-full bg-forest/15" />
                            <div className="h-6 w-full rounded-full bg-forest/10" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Komunikasi Server</span>
                          <p className="text-[11px] font-bold leading-tight">Mengirim data spasial...</p>
                        </div>
                      </div>
                    )}

                    {appStage === 3 && (
                      <div className="space-y-4">
                        <div className="flex h-[240px] w-full flex-col items-center justify-center gap-3 rounded-3xl bg-sage">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-primary shadow-soft">
                            <CheckCircle2 className="h-7 w-7 animate-bounce" />
                          </div>
                          <div className="space-y-0.5 px-2 text-center">
                            <p className="text-[11px] font-bold">Laporan Terkirim!</p>
                            <p className="mx-auto max-w-[150px] text-[9px] leading-relaxed text-forest/70">
                              Tiket #AURA-4028 aktif. Petugas dinas segera ditugaskan.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-success">Berhasil</span>
                          <p className="text-[11px] font-bold leading-tight">Terima kasih atas laporannya!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border/40 bg-card px-4 pb-7 pt-4">
                    <div
                      className={`w-full rounded-full py-2.5 text-center text-[10px] font-bold ${
                        appStage === 3 ? "bg-forest text-white" : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {appStage === 0 && "Konfirmasi Lokasi"}
                      {appStage === 1 && "Unggah & Lapor"}
                      {appStage === 2 && "Sedang Mengirim..."}
                      {appStage === 3 && "Selesai"}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* KONDISI KELURAHAN */}
        <section className="my-12 overflow-hidden rounded-[48px] bg-[#dcf0f8] py-14 md:rounded-[64px] md:py-20 dark:bg-card">
          <div className="relative mx-auto max-w-[1200px] px-4">
            <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="space-y-3">
                <Pill dark>Daerah Aktif</Pill>
                <h3 className="text-3xl font-extrabold text-forest md:text-4xl dark:text-foreground">Kondisi Kelurahan Terkini</h3>
                <p className="max-w-xl text-sm text-forest/70 dark:text-muted-foreground">
                  Pantau tingkat penyelesaian laporan infrastruktur jalan dan trotoar di wilayah percontohan secara real-time.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button variant="dark" className="w-fit gap-3 pr-1.5" onClick={() => setMapOpen(true)}>
                  Lihat Peta Interaktif
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
                <Button asChild variant="outline" className="rounded-full bg-card/80 text-forest font-bold hover:bg-card dark:text-foreground">
                  <Link to="/daerah">
                    Lihat Semua Rating Daerah
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {kelurahanList.map((c) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveKelurahan(c);
                    setRatingVal(5);
                    setHoverRatingVal(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveKelurahan(c);
                      setRatingVal(5);
                      setHoverRatingVal(0);
                    }
                  }}
                  className="group relative block h-[350px] cursor-pointer overflow-hidden rounded-[28px] bg-card shadow-soft transition-shadow duration-300 hover:shadow-elev focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img src={c.img} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/30 to-transparent" />
                  
                  <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
                    <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-soft">
                      {c.stat}
                    </span>
                    <span className="rounded-full bg-forest/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      ★ Beri Rating
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex flex-col p-5 text-white">
                    <span className="text-[10px] font-bold text-primary">{c.sub}</span>
                    <h4 className="mt-0.5 text-base font-extrabold group-hover:text-primary transition-colors">{c.name}</h4>
                    
                    <div className="mt-2.5 flex items-center justify-between border-t border-white/15 pt-2.5 text-xs text-white/90">
                      <div className="flex items-center gap-1.5">
                        <span className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-primary stroke-primary" />
                          ))}
                        </span>
                        <span className="font-extrabold">{c.rating}</span>
                      </div>
                      <span className="opacity-80 font-medium">{c.reports} laporan</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
                      <span>Respon SLA:</span>
                      <span className="font-bold text-primary">{c.speed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* MODAL DIALOG BERI RATING KELURAHAN LANGSUNG DARI BERANDA */}
            <Dialog open={!!activeKelurahan} onOpenChange={(open) => !open && setActiveKelurahan(null)}>
              <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-[32px] p-0 border-none">
                {activeKelurahan && (
                  <div className="flex flex-col bg-card">
                    {/* Header Banner */}
                    <div className="relative h-40 w-full overflow-hidden bg-forest">
                      <img
                        src={activeKelurahan.img}
                        alt={activeKelurahan.name}
                        className="h-full w-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                      <div className="absolute top-4 right-4">
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
                          {activeKelurahan.stat}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-5 right-5">
                        <span className="text-[11px] font-bold text-primary uppercase">{activeKelurahan.sub}</span>
                        <h3 className="text-2xl font-black text-white">{activeKelurahan.name}</h3>
                      </div>
                    </div>

                    {/* Form Rating */}
                    <form onSubmit={handleRatingSubmit} className="p-5 space-y-4">
                      <div>
                        <label className="text-xs font-bold text-forest dark:text-foreground">
                          Pilih Bintang Kepuasan:
                        </label>
                        <div
                          className="mt-2 flex items-center gap-1.5"
                          onMouseLeave={() => setHoverRatingVal(0)}
                        >
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= (hoverRatingVal || ratingVal);
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingVal(star)}
                                onMouseEnter={() => setHoverRatingVal(star)}
                                className="rounded-xl p-1 transition-colors hover:bg-sage/40 focus:outline-none"
                              >
                                <Star
                                  className={`h-8 w-8 transition-colors duration-150 ${
                                    isFilled
                                      ? "fill-primary stroke-primary text-primary"
                                      : "stroke-muted-foreground/30 text-transparent"
                                  }`}
                                />
                              </button>
                            );
                          })}
                          <span className="ml-2 rounded-full bg-sage px-3 py-1 text-xs font-extrabold text-forest">
                            {hoverRatingVal || ratingVal}.0 / 5.0
                          </span>
                        </div>
                        <p className="mt-1 min-h-[1.25rem] text-xs font-medium text-forest/80 dark:text-primary">
                          {(hoverRatingVal || ratingVal) === 5 && "Sangat Puas! Jalanan mulus & respon kilat (5/5)"}
                          {(hoverRatingVal || ratingVal) === 4 && "Puas! Respon cepat & tambalan rapi (4/5)"}
                          {(hoverRatingVal || ratingVal) === 3 && "Cukup, penanganan sedang berjalan (3/5)"}
                          {(hoverRatingVal || ratingVal) === 2 && "Kurang Puas, penanganan agak lambat (2/5)"}
                          {(hoverRatingVal || ratingVal) === 1 && "Kecewa, masih banyak lubang (1/5)"}
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-forest dark:text-foreground">Nama Anda</label>
                        <Input
                          placeholder="Nama warga pelapor"
                          className="mt-1 rounded-2xl"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-forest dark:text-foreground">Ulasan & Kesan Anda</label>
                        <Textarea
                          placeholder={`Bagikan pengalaman kondisi jalan atau respon petugas di ${activeKelurahan.name}...`}
                          rows={3}
                          className="mt-1 rounded-2xl resize-none"
                          value={reviewerComment}
                          onChange={(e) => setReviewerComment(e.target.value)}
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <Link
                          to="/daerah"
                          className="text-xs font-bold text-forest hover:underline dark:text-primary"
                          onClick={() => setActiveKelurahan(null)}
                        >
                          Lihat semua ulasan daerah →
                        </Link>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setActiveKelurahan(null)}
                          >
                            Tutup
                          </Button>
                          <Button type="submit" variant="dark" className="rounded-full gap-2">
                            <Send className="h-3.5 w-3.5 text-primary" /> Kirim Rating
                          </Button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* PROGRAM UNGGULAN */}
        <section className="mx-auto max-w-[1200px] px-4 py-8 md:py-12">
          <div className="grid gap-5 md:grid-cols-[1.1fr_1.2fr_1.2fr]">
            <ScrollReveal delay={0} direction="up" className="flex min-h-[320px] flex-col justify-between rounded-[28px] bg-sage p-7">
              <div className="space-y-3">
                <Pill dark>Program Terpadu</Pill>
                <h3 className="text-2xl font-extrabold leading-tight text-forest">Program Penataan Kota</h3>
                <p className="text-sm leading-relaxed text-forest/75">
                  AURA mendukung berbagai gerakan perbaikan fasilitas publik demi terciptanya jalanan kota yang lebih ramah lingkungan dan aman bagi semua kalangan warga.
                </p>
              </div>
              <Button asChild variant="dark" className="mt-6 w-fit gap-3 pr-1.5">
                <Link to="/fitur">
                  Jelajahi Fitur
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </ScrollReveal>

            {[
              { img: pamulangRoadImg, t: "Gerakan Jalan Bebas Lubang", d: "Pemberantasan jalan rusak secara masif di kelurahan percontohan.", delay: 150 },
              { img: rawaBuntuRoadImg, t: "Pedestrian Ramah Difabel", d: "Restorasi trotoar berlubang menjadi jalur ramah pejalan kaki & difabel.", delay: 300 },
            ].map(({ img, t, d, delay }) => (
              <ScrollReveal key={t} delay={delay} direction="up">
                <div className="group relative min-h-[320px] overflow-hidden rounded-[28px] bg-card shadow-soft">
                  <img src={img} alt={t} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/90 via-forest/20 to-transparent" />
                  <div className="absolute inset-x-6 bottom-6 text-white">
                    <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold text-primary-foreground">Program</span>
                    <h4 className="mt-3 text-lg font-extrabold">{t}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/80">{d}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ALUR KERJA */}
        <section className="mx-auto max-w-[1200px] px-4 py-12 md:py-16">
          <ScrollReveal direction="up" className="mx-auto mb-10 max-w-2xl text-center">
            <Pill>Alur Kerja</Pill>
            <h2 className="mt-4 text-3xl font-extrabold text-forest md:text-4xl dark:text-foreground">
              Dari Foto Laporan ke Perbaikan dalam Hitungan Jam
            </h2>
          </ScrollReveal>

          <div className="relative grid gap-5 md:grid-cols-4">
            <div aria-hidden className="absolute left-[12%] right-[12%] top-[52px] hidden border-t-2 border-dashed border-forest/25 md:block" />
            {STEPS.map(({ n, icon: Icon, t, d }, index) => (
              <ScrollReveal key={n} delay={index * 100} direction="up" className="h-full w-full">
                <div className="card-dashed relative h-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest text-lg font-extrabold text-primary">{n}</span>
                    <Icon className="h-5 w-5 text-forest/60" />
                  </div>
                  <h4 className="mt-5 text-base font-extrabold">{t}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* TESTIMONI */}
        <section className="mx-auto max-w-[1200px] px-4 py-10">
          <div className="mx-auto mb-8 max-w-2xl space-y-4 text-center">
            <Pill>Suara Warga</Pill>
            <h2 className="text-3xl font-extrabold text-forest md:text-4xl dark:text-foreground">
              Cerita dari warga yang sudah melapor
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.n} className="flex flex-col rounded-[28px] border border-border bg-card p-6 shadow-soft">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary stroke-primary" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed">“{t.q}”</p>
                <div className="mt-auto flex items-center gap-3 pt-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-xs font-extrabold text-forest">
                    {t.n.split(" ").map((s) => s[0]).join("")}
                  </span>
                  <div className="text-xs">
                    <p className="font-extrabold">{t.n}</p>
                    <p className="text-muted-foreground">{t.r}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-[36px] bg-forest p-8 text-white md:p-12">
            <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground">Resolusi Cepat 3 Hari</span>
            <blockquote className="mt-5 max-w-3xl text-xl font-semibold leading-relaxed md:text-2xl">
              “Dalam tiga hari, jalanan di kompleks kami yang berlubang sudah mulus ditambal. Benar-benar membantu warga.”
            </blockquote>
            <p className="mt-5 text-sm font-extrabold">
              Dewi Lestari <span className="font-normal text-white/70">· Ketua RW 05 Ciputat</span>
            </p>
          </div>
        </section>

        {/* CTA */}
        <CtaBanner />
      </main>

      {/* POP-UP PETA 3D */}
      {mapOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest/80 p-4 backdrop-blur-sm"
          onClick={() => setMapOpen(false)}
        >
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <TangselDiorama />
            <button
              onClick={() => setMapOpen(false)}
              aria-label="Tutup peta"
              className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-card text-forest shadow-soft hover:bg-sage"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

function ScrollReveal({ children, className = "", delay = 0, direction = "up" }: ScrollRevealProps) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          // Sekali muncul, kunci dan hentikan observasi agar tidak mendut-mendut saat scroll
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px 80px 0px",
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, []);

  const directionClasses = {
    up: "translate-y-12",
    down: "-translate-y-12",
    left: "translate-x-12",
    right: "-translate-x-12",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={`transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        isIntersecting
          ? "opacity-100 translate-y-0 translate-x-0"
          : `opacity-0 ${directionClasses[direction]}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}