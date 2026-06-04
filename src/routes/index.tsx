import { useEffect, useRef, useState, ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  MapPin,
  Camera,
  Wrench,
  ShieldCheck,
  Activity,
  Leaf,
  Lightbulb,
  Footprints,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Quote,
  Sparkles,
  AlertCircle,
  Info,
  Users,
  FileText,
  Star,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JakartaDiorama } from "@/components/jakarta-diorama";
import potholeImg from "@/assets/pothole_road.jpg";
import mentengRoadImg from "@/assets/menteng_road.jpg";
import kebayoranRoadImg from "@/assets/kebayoran_road.jpg";
import senayanRoadImg from "@/assets/senayan_road.png";
import babakanRoadImg from "@/assets/babakan_road.jpg";

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

const PARTNERS_CONFIG = [
  { name: "Dinas PUPR", icon: Wrench },
  { name: "Dishub", icon: Activity },
  { name: "PJU Kota", icon: Lightbulb },
  { name: "Tata Ruang", icon: MapPin },
  { name: "Bappeda", icon: ShieldCheck },
  { name: "Kominfo", icon: Leaf },
];

function HomePage() {
  const [appStage, setAppStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAppStage((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden grain">
          <div className="absolute inset-0 grid-pattern opacity-60" />
          <div
            className="pointer-events-none absolute -top-40 -right-32 h-[480px] w-[480px] rounded-full opacity-35 blur-3xl animate-pulse-glow will-change-gpu"
            style={{ background: "radial-gradient(closest-side, var(--primary-glow), transparent)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl animate-pulse-glow animation-delay-300 will-change-gpu"
            style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
          />

          <div className="container relative mx-auto grid gap-8 px-4 py-8 md:grid-cols-[1.05fr_1fr] md:py-12">
            <div className="flex flex-col justify-center space-y-4">
              <Badge className="w-fit gap-1.5 border-emerald-200/50 bg-emerald-50/80 px-3 py-1 text-emerald-800 hover:bg-emerald-100/90 shadow-xs animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live di 3 kelurahan percontohan di Indonesia
              </Badge>

              <h1 className="mt-3 text-3xl sm:text-4xl md:text-[3.25rem] lg:text-[3.75rem] font-extrabold tracking-tight md:leading-[1.15] animate-fade-in-up">
                Langkah Kecil, <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-primary via-primary-glow to-success bg-clip-text text-transparent">
                  Dampak Nyata
                </span>{" "}
                Bagi Jalanan Kota.
              </h1>

              <p className="mt-3 md:mt-4 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-muted-foreground/90 font-medium animate-fade-in-up">
                Menghubungkan warga dan petugas dalam sistem pelaporan terpadu untuk jalan bebas lubang. Jadilah bagian dari solusi tata kota di Indonesia yang lebih responsif.
              </p>

              <div className="mt-5 flex flex-wrap gap-3 animate-fade-in-up">
                <Button
                  asChild
                  size="lg"
                  className="bg-leaf-gradient text-primary-foreground shadow-elev hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <Link to="/warga">
                    Lapor Sekarang <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="hover:bg-secondary/50 hover:scale-105 active:scale-95 transition-all duration-300">
                  <Link to="/fitur">Lihat cara kerjanya</Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground animate-fade-in-up">
                <div className="flex items-center gap-2 group cursor-default">
                  <ShieldCheck className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" /> Data spasial terverifikasi
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <Activity className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" /> Update tiap detik
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <Leaf className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" /> Eco-urban first
                </div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative animate-fade-in-up h-[480px] md:h-[520px]">
              <JakartaDiorama />
            </div>
          </div>

          {/* Partner marquee */}
          <div className="relative border-y border-border/40 py-5 bg-muted/10 overflow-hidden flex items-center">
            <div className="absolute left-0 z-10 bg-gradient-to-r from-background via-background/90 to-transparent pl-6 pr-16 py-5 hidden lg:block select-none">
              <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60">Partner Strategis:</span>
            </div>
            <div className="marquee-fade flex flex-1 whitespace-nowrap overflow-hidden">
              <div className="animate-marquee flex gap-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 select-none lg:pl-48">
                {[...PARTNERS_CONFIG, ...PARTNERS_CONFIG, ...PARTNERS_CONFIG].map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <span key={i} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-md border border-border/60 shadow-sm transition-all duration-300 hover:border-primary/20 hover:bg-card hover:scale-[1.03] cursor-pointer">
                      <Icon className="h-4 w-4 text-muted-foreground/75 group-hover:text-primary transition-colors duration-300" />
                      <span className="text-xs font-medium tracking-normal normal-case text-foreground/80 group-hover:text-foreground transition-colors duration-300">{p.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE AURA (FEATURES & SIMULATOR) */}
        <section className="container mx-auto px-4 py-8 md:py-11 border-t border-border/60">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] items-center">
            
            {/* Left Column: WANDER-style vertical cards & text */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-3 py-1 font-semibold text-xs tracking-wider uppercase">
                  Mengapa Memilih AURA
                </Badge>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Sistem Pelaporan Tata Kota Terintegrasi & Efisien
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AURA menghadirkan kemudahan melapor kerusakan jalan langsung dari ponsel Anda. Didukung sistem pemetaan GIS real-time dan dispatch petugas dinas secara instan.
                </p>
              </div>

              <div className="space-y-3">
                {/* Card 1 */}
                <ScrollReveal direction="up" delay={50}>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-soft transition-all duration-300 hover:border-primary/20 hover:shadow-glow">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold tracking-tight">Deteksi Lokasi Otomatis</h4>
                      <p className="text-[11px] font-medium leading-relaxed text-muted-foreground mt-0.5">
                        Sistem kami secara otomatis merekam koordinat GPS presisi and mencocokkannya dengan wilayah kelurahan terkait.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 2 */}
                <ScrollReveal direction="up" delay={150}>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-soft transition-all duration-300 hover:border-primary/20 hover:shadow-glow">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Wrench className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold tracking-tight">Penugasan Kerja Instan</h4>
                      <p className="text-[11px] font-medium leading-relaxed text-muted-foreground mt-0.5">
                        Laporan yang lolos verifikasi AI langsung didisposisikan ke aplikasi petugas lapangan untuk penanganan segera.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 3 */}
                <ScrollReveal direction="up" delay={250}>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-soft transition-all duration-300 hover:border-primary/20 hover:shadow-glow">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold tracking-tight">Monitoring Progres Transparansi</h4>
                      <p className="text-[11px] font-medium leading-relaxed text-muted-foreground mt-0.5">
                        Pantau setiap tahapan pengerjaan secara langsung melalui peta GIS publik, mulai dari aduan masuk hingga jalan mulus kembali.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Horizontal Stats counters row */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileText className="w-4 h-4" />
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-foreground">2.4k+</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Laporan Selesai</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-foreground">94%</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold">Penyelesaian</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Users className="w-4 h-4" />
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-foreground">37</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold font-sans">Petugas Siaga</p>
                </div>
              </div>
            </div>

            {/* Right Column: Smartphone Simulator */}
            <ScrollReveal direction="up" delay={200} className="flex justify-center lg:justify-end">
              <div className="relative w-[300px] h-[580px] bg-slate-950 rounded-[3rem] p-3.5 shadow-2xl border-[6px] border-slate-800 dark:border-slate-900 overflow-hidden select-none">
                {/* Dynamic Island Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center border border-white/5">
                  <div className="w-2.5 h-2.5 bg-slate-900 rounded-full ml-auto mr-1 border border-white/5" />
                </div>
                
                {/* Smartphone Screen Wrapper */}
                <div className="relative w-full h-full bg-background rounded-[2.5rem] overflow-hidden flex flex-col justify-between border border-border/20">
                  
                  {/* Header Info */}
                  <div className="px-4 pt-6 pb-3 border-b border-border/40 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] font-bold tracking-wide uppercase text-foreground/80">AURA Citizen</span>
                    </div>
                    <span className="text-[9px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">v1.0</span>
                  </div>
                  
                  {/* Dynamic Simulated Display Body */}
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    
                    {appStage === 0 && (
                      <div className="space-y-4">
                        <div className="relative w-full h-[240px] bg-secondary/30 rounded-2xl overflow-hidden flex items-center justify-center border border-border/40">
                          <div className="absolute inset-0 grid-pattern opacity-40" />
                          <svg className="absolute inset-0 w-full h-full text-muted-foreground/15" fill="none">
                            <path d="M 0,80 L 260,80 M 80,0 L 80,240 M 0,160 L 260,120 M 170,0 L 170,240" stroke="currentColor" strokeWidth="2.5" />
                            <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                          </svg>
                          <div className="relative z-10 flex flex-col items-center">
                            <span className="relative flex h-5 w-5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
                              <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-soft">
                                <MapPin className="w-3 h-3" />
                              </span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold text-muted-foreground/90 uppercase tracking-wide">Mendeteksi Lokasi</span>
                          <p className="text-[11px] font-bold text-foreground leading-tight truncate">Menteng, Jakarta Pusat</p>
                        </div>
                      </div>
                    )}
                    
                    {appStage === 1 && (
                      <div className="space-y-4">
                        <div className="relative w-full h-[240px] rounded-2xl overflow-hidden flex items-center justify-center border border-border/40">
                          <img
                            src={potholeImg}
                            alt="Foto jalan berlubang"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                          <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981] animate-scan pointer-events-none" />
                          <div className="absolute w-36 h-24 border-2 border-emerald-500 rounded-lg flex flex-col justify-between p-1 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse pointer-events-none">
                            <div className="text-[8px] font-mono font-bold tracking-widest text-emerald-100 bg-emerald-600 px-1.5 py-0.5 rounded w-fit">
                              JALAN BERLUBANG
                            </div>
                            <div className="text-[8px] font-mono font-bold text-emerald-300 bg-black/50 px-1 py-0.2 rounded w-fit self-end">
                              94.6%
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold text-muted-foreground/90 uppercase tracking-wide">Pindai Objek Foto</span>
                          <p className="text-[11px] font-bold text-foreground leading-tight">Terdeteksi: Kerusakan Jalan (Sedang)</p>
                        </div>
                      </div>
                    )}
                    
                    {appStage === 2 && (
                      <div className="space-y-4">
                        <div className="w-full h-[240px] bg-card/50 rounded-2xl p-4 flex flex-col justify-center gap-3.5 border border-border/40">
                          <div className="space-y-1.5">
                            <div className="h-2 bg-muted rounded w-1/3" />
                            <div className="h-6 bg-muted/60 rounded-lg w-full" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2 bg-muted rounded w-1/4" />
                            <div className="h-6 bg-muted/60 rounded-lg w-full" />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold text-muted-foreground/90 uppercase tracking-wide">Komunikasi Server</span>
                          <p className="text-[11px] font-bold text-foreground leading-tight">Mengirim data spasial...</p>
                        </div>
                      </div>
                    )}
                    
                    {appStage === 3 && (
                      <div className="space-y-4">
                        <div className="w-full h-[240px] bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center gap-3 border border-emerald-500/10">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-soft">
                            <CheckCircle2 className="w-6 h-6 animate-bounce" />
                          </div>
                          <div className="text-center px-2 space-y-0.5">
                            <p className="text-[11px] font-bold text-foreground">Laporan Terkirim!</p>
                            <p className="text-[9px] text-muted-foreground max-w-[150px] mx-auto leading-relaxed">
                              Tiket #AURA-4028 aktif. Petugas dinas segera ditugaskan.
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Berhasil</span>
                          <p className="text-[11px] font-bold text-foreground leading-tight">Terima kasih atas laporannya!</p>
                        </div>
                      </div>
                    )}
                    
                  </div>
                  
                  {/* Bottom Action Area */}
                  <div className="pt-4 px-4 pb-7 border-t border-border/40 bg-card">
                    <button className={`w-full py-2.5 rounded-xl text-[10px] font-semibold tracking-wide transition-all duration-300 ${
                      appStage === 3 
                        ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}>
                      {appStage === 0 && "Konfirmasi Lokasi"}
                      {appStage === 1 && "Unggah & Lapor"}
                      {appStage === 2 && "Sedang Mengirim..."}
                      {appStage === 3 && "Selesai"}
                    </button>
                  </div>
                  
                </div>
              </div>
            </ScrollReveal>
            
          </div>
        </section>

        {/* KONDISI KELURAHAN TERKINI */}
        <section className="bg-secondary/35 dark:bg-card/45 border-y border-border/40 py-8 md:py-11 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="up" className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
              <div className="space-y-3">
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
                  Daerah Aktif
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                  Kondisi Kelurahan Terkini
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Pantau tingkat penyelesaian laporan infrastruktur jalan dan trotoar di wilayah percontohan secara real-time.
                </p>
              </div>
              
              <Button
                asChild
                variant="outline"
                className="w-fit hover:bg-secondary/50 rounded-full px-6 transition-all duration-300"
              >
                <Link to="/warga">Lihat Peta Interaktif</Link>
              </Button>
            </ScrollReveal>
            
            {/* 4 Cards Grid */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  id: "menteng",
                  name: "Kelurahan Menteng",
                  sub: "Kec. Menteng, Jakarta Pusat",
                  stat: "98% Selesai",
                  rating: "4.9",
                  reports: "420 laporan",
                  img: mentengRoadImg,
                },
                {
                  id: "kebayoran",
                  name: "Kebayoran Baru",
                  sub: "Kec. Kebayoran Baru, Jaksel",
                  stat: "95% Selesai",
                  rating: "4.7",
                  reports: "310 laporan",
                  img: kebayoranRoadImg,
                },
                {
                  id: "senayan",
                  name: "Kelurahan Senayan",
                  sub: "Kec. Kebayoran Baru, Jaksel",
                  stat: "99% Selesai",
                  rating: "4.8",
                  reports: "510 laporan",
                  img: senayanRoadImg,
                },
                {
                  id: "babakan",
                  name: "Kelurahan Babakan",
                  sub: "Kec. Tangerang, Tangerang",
                  stat: "92% Selesai",
                  rating: "4.5",
                  reports: "280 laporan",
                  img: babakanRoadImg,
                },
              ].map((c, index) => (
                <ScrollReveal key={c.id} delay={index * 100} direction="up">
                  <div 
                    className="group relative h-[340px] rounded-3xl overflow-hidden shadow-soft hover:shadow-glow transition-all duration-500 cursor-pointer border border-border/40 bg-card"
                  >
                    {/* Background image */}
                    <img 
                      src={c.img} 
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-95" />
                    
                    {/* Top right pill */}
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/95 dark:bg-[#151c19]/95 text-emerald-800 dark:text-emerald-300 text-[10px] font-black tracking-wide px-3 py-1.5 rounded-full shadow-xs">
                        {c.stat}
                      </span>
                    </div>
                    
                    {/* Bottom details */}
                    <div className="absolute bottom-0 inset-x-0 p-5 text-white flex flex-col justify-end">
                      <span className="text-[9px] text-emerald-300/90 font-bold uppercase tracking-wider">{c.sub}</span>
                      <h4 className="text-base font-extrabold tracking-tight mt-0.5">{c.name}</h4>
                      
                      {/* Rating/reports */}
                      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/10 text-xs text-white/80">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        <span className="font-extrabold text-white">{c.rating}</span>
                        <span className="opacity-60">({c.reports})</span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* PROGRAM UNGGULAN */}
        <section className="container mx-auto px-4 py-8 md:py-11">
          <div className="grid gap-5 md:grid-cols-[1.1fr_1.2fr_1.2fr]">
            
            {/* Left Card: AURA Theme Background */}
            <ScrollReveal delay={0} direction="up" className="flex flex-col justify-between p-6 rounded-3xl bg-secondary/80 dark:bg-secondary/20 border border-border/60 text-foreground min-h-[300px]">
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">Program Terpadu</span>
                <h3 className="text-2xl font-black tracking-tight leading-tight text-foreground">
                  Program Penataan Kota
                </h3>
                <p className="text-xs font-medium leading-relaxed text-muted-foreground">
                  AURA mendukung berbagai gerakan perbaikan fasilitas publik demi terciptanya jalanan kota yang lebih ramah lingkungan dan aman bagi semua kalangan warga.
                </p>
              </div>
              
              <Button
                asChild
                className="w-fit bg-primary text-primary-foreground hover:opacity-90 rounded-full px-6 mt-6 shadow-xs text-xs font-bold transition-all duration-300"
              >
                <Link to="/fitur">Jelajahi Fitur</Link>
              </Button>
            </ScrollReveal>
            
            {/* Middle Card */}
            <ScrollReveal delay={150} direction="up">
              <div className="group relative rounded-3xl overflow-hidden min-h-[300px] shadow-soft border border-border/40 cursor-pointer bg-card">
                <img 
                  src={kebayoranRoadImg} 
                  alt="Jalan Bebas Lubang" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-widest">Inisiatif 01</span>
                  <h4 className="text-lg font-black tracking-tight mt-0.5">Gerakan Jalan Bebas Lubang</h4>
                  <p className="text-[10px] text-white/80 mt-1 leading-relaxed">Pemberantasan jalan rusak secara masif di kelurahan percontohan.</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Card */}
            <ScrollReveal delay={300} direction="up">
              <div className="group relative rounded-3xl overflow-hidden min-h-[300px] shadow-soft border border-border/40 cursor-pointer bg-card">
                <img 
                  src={mentengRoadImg} 
                  alt="Pedestrian Ramah Difabel" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-widest">Inisiatif 02</span>
                  <h4 className="text-lg font-black tracking-tight mt-0.5">Pedestrian Ramah Difabel</h4>
                  <p className="text-[10px] text-white/80 mt-1 leading-relaxed">Restorasi trotoar berlubang menjadi jalur ramah pejalan kaki & difabel.</p>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container mx-auto px-4 py-8 md:py-11 border-t border-border/60">
          <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center mb-6">
            <Badge variant="outline" className="border-accent/30 text-accent bg-accent/5 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
              Alur Kerja
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Dari Foto Laporan ke Perbaikan dalam Hitungan Jam
            </h2>
          </ScrollReveal>

          <div className="grid gap-5 md:grid-cols-4">
            {[
              {
                n: "01",
                icon: Camera,
                t: "Warga Melapor",
                d: "Mengunggah foto kerusakan jalan, mendeteksi lokasi GPS otomatis dalam waktu 30 detik.",
              },
              {
                n: "02",
                icon: Sparkles,
                t: "Verifikasi Sistem",
                d: "Sistem AI mengolah citra laporan untuk mengklasifikasikan tingkat urgensi secara otomatis.",
              },
              {
                n: "03",
                icon: Wrench,
                t: "Petugas Lapangan",
                d: "Menerima work order terdekat, melakukan perbaikan, dan mengirimkan konfirmasi hasil kerja.",
              },
              {
                n: "04",
                icon: ShieldCheck,
                t: "Selesai & Terbuka",
                d: "Admin memverifikasi perbaikan dan status diperbarui di peta GIS publik warga.",
              },
            ].map(({ n, icon: Icon, t, d }, index) => (
              <ScrollReveal key={n} delay={index * 100} direction="up" className="w-full h-full">
                <div 
                  className="h-full group relative rounded-2xl border border-border/80 bg-card p-5 shadow-soft hover:shadow-glow hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                      Langkah {n}
                    </span>
                    <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h4 className="mt-4 text-base font-extrabold tracking-tight text-foreground">{t}</h4>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="border-y border-border bg-warm-gradient overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="container mx-auto px-4 py-8 relative z-10">
            <ScrollReveal direction="up" className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elev">
                <Quote className="h-5 w-5" />
              </div>
              
              <blockquote className="text-lg sm:text-xl font-semibold leading-relaxed text-foreground italic">
                “Dulu melaporkan jalan berlubang sangat membingungkan dan memakan waktu berminggu-minggu tanpa kejelasan. Dengan AURA, saya tinggal ambil foto, kirim, dan dalam tiga hari jalanan kompleks kami sudah mulus ditambal. Anak-anak sekarang aman bermain sepeda lagi.”
              </blockquote>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  RS
                </div>
                <div className="text-left text-xs">
                  <p className="font-extrabold text-foreground">Rini Suryani</p>
                  <p className="text-muted-foreground">Warga Kelurahan Babakan · Pengguna AURA</p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Resolusi Cepat 3 Hari
                </span>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-8">
          <ScrollReveal direction="up">
            <div className="grain relative overflow-hidden rounded-3xl bg-hero-gradient p-8 text-primary-foreground shadow-elev md:p-12 animate-gradient-shift">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-35 blur-3xl animate-pulse-glow will-change-gpu"
                style={{ background: "var(--accent)" }}
              />
              <div
                className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full opacity-20 blur-3xl animate-pulse-glow animation-delay-500 will-change-gpu"
                style={{ background: "var(--primary-glow)" }}
              />
              <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
                    Jadilah bagian dari kota yang lebih baik.
                  </h2>
                  <p className="mt-3 max-w-xl text-primary-foreground/85">
                    Laporkan setiap jalan berlubang atau trotoar rusak di sekitar Anda dalam hitungan detik. Bersama-sama, kita wujudkan jalanan Indonesia yang lebih aman, mulus, dan tertata rapi.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" variant="secondary" className="hover:scale-105 active:scale-95 transition-all duration-300 shadow-soft">
                    <Link to="/warga">Lapor Sekarang</Link>
                  </Button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      {
        threshold: 0.01,
        rootMargin: "0px 0px -20px 0px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const directionClasses = {
    up: "translate-y-6",
    down: "-translate-y-6",
    left: "translate-x-6",
    right: "-translate-x-6",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={`transform transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
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

