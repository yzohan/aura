import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import member1 from "@/assets/member-1.jpg";
import member2 from "@/assets/member-2.jpg";
import member3 from "@/assets/member-3.jpg";
import member4 from "@/assets/member-4.jpg";
import member5 from "@/assets/member-5.jpg";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Instagram, Cpu, TrendingUp, Terminal, Award, Briefcase } from "lucide-react";

export const Route = createFileRoute("/tim")({
  head: () => ({
    meta: [
      { title: "Tim AURA — Coding Camp 2026 powered by DBS Foundation" },
      {
        name: "description",
        content:
          "Tim multidisiplin di balik AURA: Artificial Intelligence, Data Science, dan Full-Stack Development.",
      },
      { property: "og:title", content: "Tim AURA" },
      { property: "og:description", content: "Tim kolaboratif lintas-path di Coding Camp 2026 yang membangun AURA." },
    ],
  }),
  component: TeamPage,
});

const PATHS = [
  { 
    name: "Artificial Intelligence", 
    desc: "Mengembangkan model computer vision untuk deteksi otomatis keretakan jalan dan klasifikasi tingkat kerusakan secara real-time.",
    icon: <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    color: "bg-emerald-50 text-emerald-800 border-emerald-100/60 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30" 
  },
  { 
    name: "Data Science", 
    desc: "Menganalisis data spasial (GIS), mengindeks tingkat aksesibilitas, serta memformulasikan prioritas perbaikan infrastruktur jalan.",
    icon: <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
    color: "bg-amber-50 text-amber-800 border-amber-100/60 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30" 
  },
  { 
    name: "Full-Stack Development", 
    desc: "Membangun platform web interaktif, visualisasi dashboard laporan warga/admin, dan merancang arsitektur cloud serverless.",
    icon: <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    color: "bg-blue-50 text-blue-800 border-blue-100/60 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30" 
  },
];

const TEAM_MEMBERS = [
  {
    id: 1,
    name: "Dennis Satriani Sucipto Putra",
    role: "Artificial Intelligence",
    task: "Membangun model computer vision YOLOv8 untuk mendeteksi keretakan dan lubang jalan secara real-time dari video feed dengan akurasi klasifikasi mencapai 94%.",
    github: "https://github.com/dennis1645",
    linkedin: "https://www.linkedin.com/in/dennissp/",
    instagram: "https://instagram.com/dennis",
    avatarText: "DS",
    avatarImage: member1,
    gradientFrom: "from-emerald-400",
    gradientTo: "to-teal-600",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    pathType: "ai"
  },
  {
    id: 2,
    name: "Dewi Wati",
    role: "Data Science",
    task: "Menganalisis data spasial (GIS) tata kota di Indonesia, merancang indeks prioritas perbaikan jalan berdasarkan tingkat kerusakan dan kepadatan lalu lintas harian.",
    github: "https://github.com/dewi",
    linkedin: "https://linkedin.com/in/dewi",
    instagram: "https://instagram.com/dewi",
    avatarText: "DW",
    avatarImage: member2,
    gradientFrom: "from-orange-400",
    gradientTo: "to-amber-600",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    pathType: "ds"
  },
  {
    id: 3,
    name: "Nathania Englandia Saraswati",
    role: "Full-Stack Development",
    task: "Merancang arsitektur database Supabase, mengelola REST APIs, sistem otentikasi multi-role (Warga/Petugas/Admin), serta optimasi serverless Cloudflare.",
    github: "https://github.com/yzohan",
    linkedin: "https://linkedin.com/in/nathania-englandia-b4b59836b",
    instagram: "https://instagram.com/nvzyox",
    avatarText: "NS",
    avatarImage: member3,
    gradientFrom: "from-blue-400",
    gradientTo: "to-indigo-600",
    badgeBg: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    pathType: "fs"
  },
  {
    id: 4,
    name: "Zidan Farabi",
    role: "Artificial Intelligence",
    task: "Melatih model CNN Keras untuk klasifikasi detail jalan berlubang, mengoptimalkan pipeline machine learning untuk integrasi dengan Flask API backend.",
    github: "https://github.com/Zidfar",
    linkedin: "https://linkedin.com/in/zidan-farabi-0a0477283",
    instagram: "https://instagram.com/Zidfar",
    avatarText: "ZF",
    avatarImage: member4,
    gradientFrom: "from-cyan-400",
    gradientTo: "to-blue-600",
    badgeBg: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
    pathType: "ai"
  },
  {
    id: 5,
    name: "Nethania Emmanuela Rahadian",
    role: "Full-Stack Development",
    task: "Menyusun tata letak navigasi sidebar menu, membangun halaman pengaturan (settings), mengelola manajemen data kondisi jalan, serta mengimplementasikan visualisasi grafik statistik pada dashboard utama AURA.",
    github: "https://github.com/nethania",
    linkedin: "https://linkedin.com/in/nethania",
    instagram: "https://instagram.com/nethania",
    avatarText: "NR",
    avatarImage: member5,
    gradientFrom: "from-purple-400",
    gradientTo: "to-pink-600",
    badgeBg: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-[#2e1b4e] dark:text-[#d3adff] dark:border-[#4d2d7c]",
    pathType: "fs"
  }
];

function TeamPage() {
  const getPathIcon = (type: string) => {
    switch(type) {
      case "ai": return <Cpu className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "ds": return <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      default: return <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5] dark:bg-[#121212] transition-colors duration-300">
      <SiteHeader />
      <main className="flex-1">
        {/* Banner Hero */}
        <section className="container mx-auto px-4 pt-12 md:pt-20 pb-12 text-center max-w-4xl">
          <Badge variant="outline" className="border-emerald-600/30 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-1 text-xs font-semibold">
            Coding Camp 2026 · DBS Foundation
          </Badge>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl text-gray-900 dark:text-white leading-tight">
            Tim Kolaborator AURA
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base text-gray-600 dark:text-gray-300 font-medium leading-relaxed px-2">
            Membangun ekosistem tata kota cerdas yang lebih responsif melalui integrasi kecerdasan buatan, analisis spasial data, dan rekayasa perangkat lunak.
          </p>
        </section>

        {/* Team Grid */}
        <section className="container mx-auto px-4 pb-16 max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {TEAM_MEMBERS.map((m) => (
              <div 
                key={m.id} 
                className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Card Background Banner */}
                <div className={`h-24 md:h-28 w-full bg-gradient-to-br ${m.gradientFrom} ${m.gradientTo} relative overflow-hidden`}>
                  {/* Subtle Grid Pattern Overlay */}
                  <div className="absolute inset-0 opacity-15">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id={`card-grid-${m.id}`} width="16" height="16" patternUnits="userSpaceOnUse">
                          <rect width="16" height="16" fill="none" />
                          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#fff" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#card-grid-${m.id})`} />
                    </svg>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="p-5 md:p-6 pt-0 relative flex-1 flex flex-col">
                  {/* Overlapping Avatar */}
                  <div className="absolute -top-8 left-5 md:left-6">
                    <Avatar className="h-14 w-14 ring-4 ring-white dark:ring-[#1e1e1e] shadow-sm">
                      <AvatarImage src={m.avatarImage} alt={m.name} className="object-cover" />
                      <AvatarFallback className={`bg-gradient-to-br ${m.gradientFrom} ${m.gradientTo} text-white font-extrabold text-base`}>
                        {m.avatarText}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Header Badge & Social Links */}
                  <div className="mt-8 flex justify-between items-center">
                    <Badge className={`border text-[9px] md:text-[10px] font-bold py-0.5 px-2 ${m.badgeBg}`}>
                      {m.role}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <a 
                        href={m.github} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#2b2b2b] rounded-full transition-all"
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                      <a 
                        href={m.linkedin} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#2b2b2b] rounded-full transition-all"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                      <a 
                        href={m.instagram} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#2b2b2b] rounded-full transition-all"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Profile Name */}
                  <h3 className="mt-4 text-base md:text-lg font-extrabold text-gray-900 dark:text-white">
                    {m.name}
                  </h3>

                  {/* Divider */}
                  <div className="border-t border-gray-100 dark:border-gray-800 my-3 w-full"></div>

                  {/* Contributions Detail */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      Peran & Kontribusi
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
                      {m.task}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Path Descriptions Board */}
        <section className="container mx-auto px-4 pb-20 max-w-6xl">
          <div className="border-t border-gray-200/60 dark:border-gray-800 pt-10 mb-6">
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 dark:text-white text-center md:text-left flex items-center justify-center md:justify-start gap-2">
              <Award className="w-4.5 h-4.5 text-emerald-600" />
              Detail Kompetensi Tim Lintas Path
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PATHS.map((p) => (
              <div 
                key={p.name} 
                className={`rounded-3xl border p-5 transition-all shadow-xs dark:shadow-none hover:shadow-md flex flex-col justify-between ${p.color}`}
              >
                <div className="mb-3">
                  <h3 className="text-sm md:text-base font-bold tracking-tight">{p.name}</h3>
                </div>
                <p className="text-xs md:text-sm leading-relaxed opacity-95 font-medium">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
