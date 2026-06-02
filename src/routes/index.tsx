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
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JakartaDiorama } from "@/components/jakarta-diorama";
import potholeImg from "@/assets/pothole_road.jpg";

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

          <div className="container relative mx-auto grid gap-12 px-4 py-20 md:grid-cols-[1.05fr_1fr] md:py-28">
            <div className="flex flex-col justify-center">
              <Badge className="w-fit gap-1.5 border-emerald-200/50 bg-emerald-50/80 px-3 py-1 text-emerald-800 hover:bg-emerald-100/90 shadow-xs animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live di 3 kelurahan percontohan
              </Badge>

              <h1 className="mt-5 text-3xl sm:text-4xl md:text-[3.25rem] lg:text-[3.75rem] font-extrabold tracking-tight md:leading-[1.15] animate-fade-in-up animation-delay-100">
                Langkah Kecil, <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-primary via-primary-glow to-success bg-clip-text text-transparent">
                  Dampak Nyata
                </span>{" "}
                Bagi Jalanan Kota.
              </h1>

              <p className="mt-4 md:mt-6 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-muted-foreground/90 font-medium animate-fade-in-up animation-delay-200">
                Menghubungkan warga dan petugas dalam sistem pelaporan terpadu untuk jalan bebas lubang. Jadilah bagian dari solusi tata kota di Indonesia yang lebih responsif.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up animation-delay-300">
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

              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground animate-fade-in-up animation-delay-400">
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
            <div className="relative animate-fade-in-up animation-delay-200 h-[480px] md:h-[520px]">
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
              <div className="animate-marquee flex gap-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 select-none lg:pl-48" aria-hidden="true">
                {[...PARTNERS_CONFIG, ...PARTNERS_CONFIG, ...PARTNERS_CONFIG].map((p, i) => {
                  const Icon = p.icon;
                  return (
                    <span key={`dup-${i}`} className="group flex items-center gap-2.5 px-4 py-2 rounded-xl bg-card/50 backdrop-blur-md border border-border/60 shadow-sm transition-all duration-300 hover:border-primary/20 hover:bg-card hover:scale-[1.03] cursor-pointer">
                      <Icon className="h-4 w-4 text-muted-foreground/75 group-hover:text-primary transition-colors duration-300" />
                      <span className="text-xs font-medium tracking-normal normal-case text-foreground/80 group-hover:text-foreground transition-colors duration-300">{p.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="py-16 border-b border-border/60 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="relative rounded-[2.5rem] border border-border/80 bg-card/45 backdrop-blur-xl p-8 md:p-12 overflow-hidden shadow-soft">
              {/* Subtle background decorative shapes */}
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-success/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
              
              <div className="relative z-10 space-y-8 lg:space-y-12">
                
                {/* Header Info */}
                <div className="space-y-2.5">
                  <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-3 py-1 font-semibold text-xs tracking-wider uppercase">
                    AURA Dalam Angka
                  </Badge>
                  <h3 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    Kinerja Tata Kota Real-Time
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                    Setiap laporan diproses oleh sistem pintar dan dikirimkan langsung ke petugas terdekat untuk efisiensi maksimum di lapangan.
                  </p>
                </div>

                {/* Side-by-side Layout for Cards and Mockup */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start w-full">
                  
                  {/* Left Column: Interactive Stats Cards (2x2 Grid) */}
                  <div className="grid gap-4 grid-cols-2 flex-1 w-full">
                  {/* Card 1: Laporan Masuk */}
                  <ScrollReveal delay={0} direction="up">
                    <div className="group relative h-full flex flex-col justify-between p-6 rounded-2xl bg-card/65 backdrop-blur-md border border-border/80 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-card hover:shadow-glow cursor-default overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
                      
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground/80 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Aktif
                        </div>
                      </div>
                      
                      <div className="mt-4 mb-6">
                        <span className="text-3xl font-bold tracking-tight text-foreground">2.4k+</span>
                        <h4 className="text-sm font-semibold text-foreground/90 mt-1.5">Laporan masuk</h4>
                        <p className="text-xs text-muted-foreground/75 mt-0.5">Aduan terverifikasi dari warga</p>
                      </div>

                      {/* SVG Sparkline positioned absolutely at the bottom */}
                      <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden pointer-events-none">
                        <svg className="w-full h-full text-emerald-500/40 dark:text-emerald-500/30" viewBox="0 0 100 30" preserveAspectRatio="none" fill="none">
                          <path d="M0 25 Q15 15 30 22 T60 8 T90 12 T100 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M0 25 Q15 15 30 22 T60 8 T90 12 T100 4 L100 30 L0 30 Z" fill="currentColor" opacity="0.1" />
                        </svg>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Card 2: Tingkat Penyelesaian */}
                  <ScrollReveal delay={100} direction="up">
                    <div className="group relative h-full flex flex-col justify-between p-6 rounded-2xl bg-card/65 backdrop-blur-md border border-border/80 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-card hover:shadow-glow cursor-default overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
                      
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground/80 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Efisien
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-3xl font-bold tracking-tight text-foreground">94%</span>
                          <h4 className="text-sm font-semibold text-foreground/90 mt-1.5">Tingkat penyelesaian</h4>
                          <p className="text-xs text-muted-foreground/75 mt-0.5">Selesai ditangani petugas</p>
                        </div>
                        {/* Circular Progress SVG */}
                        <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="22" cy="22" r="17" stroke="currentColor" className="text-muted-foreground/10" strokeWidth="2.5" fill="transparent" />
                            <circle cx="22" cy="22" r="17" stroke="currentColor" className="text-primary" strokeWidth="2.5" fill="transparent"
                              strokeDasharray={2 * Math.PI * 17}
                              strokeDashoffset={2 * Math.PI * 17 * (1 - 0.94)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-[9px] font-bold text-foreground/80">94%</span>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Card 3: Rerata Respon */}
                  <ScrollReveal delay={200} direction="up">
                    <div className="group relative h-full flex flex-col justify-between p-6 rounded-2xl bg-card/65 backdrop-blur-md border border-border/80 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-card hover:shadow-glow cursor-default overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
                      
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground/80 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Cepat
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-3xl font-bold tracking-tight text-foreground">&lt; 6 jam</span>
                        <h4 className="text-sm font-semibold text-foreground/90 mt-1.5">Rerata respon</h4>
                        <p className="text-xs text-muted-foreground/75 mt-0.5">Kecepatan penanganan awal</p>
                      </div>

                      <div className="mt-4 pt-1 flex items-center">
                        <Badge className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-2 py-0.5 shadow-none">
                          ↓ 1.2 jam lebih cepat
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/70 ml-2">vs bulan lalu</span>
                      </div>
                    </div>
                  </ScrollReveal>

                  {/* Card 4: Petugas Aktif */}
                  <ScrollReveal delay={300} direction="up">
                    <div className="group relative h-full flex flex-col justify-between p-6 rounded-2xl bg-card/65 backdrop-blur-md border border-border/80 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-card hover:shadow-glow cursor-default overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-20 h-20 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />
                      
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-muted/60 text-muted-foreground/80 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                          Siaga
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-3xl font-bold tracking-tight text-foreground">37</span>
                        <h4 className="text-sm font-semibold text-foreground/90 mt-1.5">Petugas aktif</h4>
                        <p className="text-xs text-muted-foreground/75 mt-0.5">Siaga merespon laporan warga</p>
                      </div>

                      {/* Avatars Stack */}
                      <div className="flex -space-x-2 mt-4 overflow-hidden">
                        {[
                          { name: "AD", bg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
                          { name: "JS", bg: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
                          { name: "MK", bg: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
                          { name: "RY", bg: "bg-purple-500/15 text-purple-700 dark:text-purple-400" },
                        ].map((av, idx) => (
                          <div key={idx} className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold border-2 border-card ${av.bg}`}>
                            {av.name}
                          </div>
                        ))}
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground text-[10px] font-bold border-2 border-card">
                          +33
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
              
              {/* Right Column: Smartphone Mockup Simulator */}
              <div className="hidden lg:flex justify-end lg:w-[320px] shrink-0">
                <div className="relative w-[280px] h-[550px] bg-slate-950 rounded-[2.8rem] p-3 shadow-2xl border-[6px] border-slate-800 dark:border-slate-900 overflow-hidden select-none">
                  {/* Dynamic Island Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center border border-white/5">
                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full ml-auto mr-1 border border-white/5" />
                  </div>
                  
                  {/* Smartphone Screen Wrapper */}
                  <div className="relative w-full h-full bg-background rounded-[2.2rem] overflow-hidden flex flex-col justify-between border border-border/20">
                    
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
                          <div className="relative w-full h-[220px] bg-secondary/30 rounded-2xl overflow-hidden flex items-center justify-center border border-border/40">
                            <div className="absolute inset-0 grid-pattern opacity-40" />
                            <svg className="absolute inset-0 w-full h-full text-muted-foreground/15" fill="none">
                              <path d="M 0,80 L 260,80 M 80,0 L 80,240 M 0,160 L 260,120 M 170,0 L 170,240" stroke="currentColor" strokeWidth="2.5" />
                              <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                            </svg>
                            {/* Pulsing GPS Dot */}
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
                            <p className="text-[11px] font-bold text-foreground leading-tight truncate">Menteng, Kota Jakarta Pusat</p>
                          </div>
                        </div>
                      )}
                      
                      {appStage === 1 && (
                        <div className="space-y-4">
                          <div className="relative w-full h-[220px] rounded-2xl overflow-hidden flex items-center justify-center border border-border/40">
                            <img
                              src={potholeImg}
                              alt="Foto jalan berlubang riil"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                            
                            {/* Laser Scanner line */}
                            <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981] animate-scan pointer-events-none" />

                            {/* AI Green Bounding Box */}
                            <div className="absolute w-36 h-24 border-2 border-emerald-500 rounded-lg flex flex-col justify-between p-1 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse pointer-events-none">
                              <div className="text-[8px] font-mono font-bold tracking-widest text-emerald-100 bg-emerald-600 px-1.5 py-0.5 rounded w-fit">
                                JALAN BERLUBANG
                              </div>
                              <div className="text-[8px] font-mono font-bold text-emerald-300 bg-black/50 px-1 py-0.2 rounded w-fit self-end">
                                94.6%
                              </div>
                            </div>
                            <Camera className="absolute bottom-3 right-3 w-4 h-4 text-white drop-shadow-md" />
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-semibold text-muted-foreground/90 uppercase tracking-wide">Pindai Objek Foto</span>
                            <p className="text-[11px] font-bold text-foreground leading-tight">Terdeteksi: Kerusakan Jalan (Sedang)</p>
                          </div>
                        </div>
                      )}
                      
                      {appStage === 2 && (
                        <div className="space-y-4">
                          <div className="w-full h-[220px] bg-card/50 rounded-2xl p-4 flex flex-col justify-center gap-3.5 border border-border/40">
                            <div className="space-y-1.5">
                              <div className="h-2 bg-muted rounded w-1/3" />
                              <div className="h-6 bg-muted/60 rounded-lg w-full" />
                            </div>
                            <div className="space-y-1.5">
                              <div className="h-2 bg-muted rounded w-1/4" />
                              <div className="h-6 bg-muted/60 rounded-lg w-full" />
                            </div>
                            <div className="mt-2 pt-2 border-t border-border/20">
                              <div className="flex justify-between text-[9px] font-semibold text-muted-foreground/80 mb-1.5">
                                <span>Mengunggah Laporan...</span>
                                <span className="font-mono">75%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: "75%" }} />
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[9px] font-semibold text-muted-foreground/90 uppercase tracking-wide">Komunikasi Server</span>
                            <p className="text-[11px] font-bold text-foreground leading-tight">Mengirim data spasial enkripsi...</p>
                          </div>
                        </div>
                      )}
                      
                      {appStage === 3 && (
                        <div className="space-y-4">
                          <div className="w-full h-[220px] bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center gap-3 border border-emerald-500/10">
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
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </section>

        {/* CATEGORIES */}
        <section className="border-b border-border bg-secondary/40 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
          <div className="container mx-auto px-4 py-20 relative z-10">
            <ScrollReveal direction="up">
              <div className="mx-auto max-w-2xl text-center">
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
                  Fokus penanganan
                </Badge>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance md:text-4xl">
                  Tiga Jenis Prioritas Laporan
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Setiap laporan diverifikasi dan diklasifikasikan ke dalam tiga tingkat urgensi untuk efisiensi penanganan.
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: AlertTriangle,
                  t: "Jalan Berlubang Kritis",
                  d: "Kerusakan parah yang berlokasi di dekat fasilitas vital seperti sekolah, rumah sakit, tempat ibadah, atau jalan protokol utama dengan volume lalu lintas yang sangat padat.",
                  tag: "Kritis",
                  color: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
                },
                {
                  icon: AlertCircle,
                  t: "Jalan Berlubang Sedang",
                  d: "Kerusakan menengah yang berada di dalam kawasan pemukiman padat penduduk, jalan penghubung antar-kecamatan, atau rute alternatif warga yang ramai dilalui.",
                  tag: "Sedang",
                  color: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                },
                {
                  icon: Info,
                  t: "Jalan Berlubang Ringan",
                  d: "Kerusakan kecil atau retakan yang berlokasi di jalanan sepi, gang lingkungan perumahan kecil, atau jalan alternatif yang jarang dilalui oleh kendaraan warga.",
                  tag: "Ringan",
                  color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                },
              ].map(({ icon: Icon, t, d, tag, color }, index) => (
                <ScrollReveal key={t} delay={index * 150} direction="up" className="w-full h-full">
                  <div
                    className="h-full group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-glow flex flex-col justify-between"
                  >
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
                      style={{ background: "var(--primary-glow)" }}
                    />
                    <div className="flex items-start justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-300 group-hover:scale-105 ${color}`}>
                        {tag}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold transition-colors duration-300 group-hover:text-primary">{t}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container mx-auto px-4 py-24 relative overflow-hidden">
          <ScrollReveal direction="up">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="border-accent/30 text-accent bg-accent/5 px-3 py-1 font-semibold uppercase tracking-wider text-xs">
                <Sparkles className="mr-1 h-3 w-3 animate-pulse" /> Alur kerja
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance md:text-4xl animate-fade-in-up">
                Dari foto laporan ke perbaikan, dalam hitungan jam
              </h2>
            </div>
          </ScrollReveal>

          <div className="relative mt-14 grid gap-6 md:grid-cols-4">
            <div
              aria-hidden
              className="absolute left-0 right-0 top-12 hidden h-px md:block animate-pulse"
              style={{
                background:
                  "repeating-linear-gradient(to right, var(--border) 0 8px, transparent 8px 16px)",
              }}
            />
            {[
              {
                n: "01",
                icon: Camera,
                t: "Warga melapor",
                d: "Mengirimkan laporan foto kerusakan jalan, lokasi GPS, dan deskripsi kendala secara publik dalam 30 detik.",
              },
              {
                n: "02",
                icon: Sparkles,
                t: "Sistem AI mengolah",
                d: "AI otomatis mendeteksi lubang, menganalisis objek, serta mengklasifikasikan tingkat keparahan laporan secara real-time.",
              },
              {
                n: "03",
                icon: Wrench,
                t: "Petugas menangani",
                d: "Petugas lapangan menerima instruksi kerja (work order), melakukan perbaikan, dan mengirimkan bukti foto selesai.",
              },
              {
                n: "04",
                icon: ShieldCheck,
                t: "Admin memverifikasi",
                d: "Admin meninjau status penanganan dan memverifikasi apakah petugas sudah selesai mengerjakan tugasnya dengan benar.",
              },
            ].map(({ n, icon: Icon, t, d }, index) => (
              <ScrollReveal key={n} delay={index * 150} direction="up" className="w-full h-full">
                <div
                  className="h-full relative rounded-3xl border border-border bg-card p-7 shadow-soft transition-all duration-300 hover:shadow-glow hover:-translate-y-2 group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-leaf-gradient px-3 py-1 text-xs font-bold text-primary-foreground shadow-soft transition-transform duration-300 group-hover:scale-110">
                      {n}
                    </span>
                    <Icon className="h-7 w-7 text-primary/70 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold transition-colors duration-300 group-hover:text-primary">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="border-y border-border bg-warm-gradient overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <ScrollReveal direction="up">
            <div className="container mx-auto grid gap-10 px-4 py-20 md:grid-cols-[auto_1fr] md:items-center relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elev hover:rotate-6 transition-all duration-300 cursor-default">
                <Quote className="h-7 w-7" />
              </div>
              <div>
                <blockquote className="text-xl font-medium leading-relaxed text-foreground text-balance md:text-2xl italic">
                  “Dulu lapor lubang harus telpon kelurahan, ditunda berminggu. Sekarang foto, kirim,
                  tiga hari sudah ditambal. Anak saya jalan kaki ke sekolah jadi aman lagi.”
                </blockquote>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                    RS
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Rini Suryani</p>
                    <p className="text-xs text-muted-foreground">
                      Warga Kelurahan Babakan · pengguna sejak Maret
                    </p>
                  </div>
                  <span className="ml-3 hidden items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground md:inline-flex hover:bg-muted transition-colors">
                    <Clock className="h-3 w-3 text-primary animate-pulse" /> Resolusi 3 hari
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <ScrollReveal direction="up">
            <div className="grain relative overflow-hidden rounded-3xl bg-hero-gradient p-10 text-primary-foreground shadow-elev md:p-16 animate-gradient-shift">
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
                    Lapor kerusakan infrastruktur langsung tanpa perlu mendaftar. Admin dan petugas
                    dinas dapat masuk untuk memantau dan mengelola penanganan.
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
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const directionClasses = {
    up: "translate-y-8",
    down: "-translate-y-8",
    left: "translate-x-8",
    right: "-translate-x-8",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
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

