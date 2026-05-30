import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
  { name: "Artificial Intelligence", desc: "Klasifikasi gambar, deteksi kerusakan, scoring urgensi.", color: "bg-primary/10 text-primary border-primary/20" },
  { name: "Data Science", desc: "Analisis spasial, indeks aksesibilitas, prioritas penanganan.", color: "bg-accent/15 text-accent border-accent/20" },
  { name: "Full-Stack Development", desc: "Aplikasi web, dashboard GIS, integrasi backend.", color: "bg-success/15 text-success border-success/20" },
];


const PLACEHOLDER_MEMBERS = [
  {
    id: 1,
    name: "Dennis Satriani Sucipto Putra",
    role: "Artificial Intelligence",
    task: "",
  },
  {
    id: 2,
    name: "Dewi Wati",
    role: "Data Science",
    task: "",
  },
  {
    id: 3,
    name: "Nathania Englandia Saraswati",
    role: "Full-Stack Development",
    task: "",
  },
    {
    id: 4,
    name: "Zidan Farabi",
    role: "Artificial Intelligence",
    task: "",
  },
  {
    id: 5,
    name: "Nethania Emmanuela Rahadian",
    role: "Full-Stack Development",
    task: "",
  },

];

function TeamPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <Badge variant="outline" className="border-primary/30 text-primary">Coding Camp 2026 · DBS Foundation</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">Tim di balik AURA</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Tiga path, satu misi: membangun ekosistem tata kota yang lebih responsif.
          </p>
        </section>

        <section className="container mx-auto grid gap-6 px-4 pb-12 md:grid-cols-3">
          {PATHS.map((p) => (
            <div key={p.name} className={`rounded-2xl border p-6 ${p.color}`}>
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-2 text-sm opacity-80">{p.desc}</p>
            </div>
          ))}
        </section>

        <section className="container mx-auto px-4 pb-20">
          <h2 className="text-2xl font-bold tracking-tight">Anggota tim</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Slot placeholder — lengkapi dengan nama, foto, dan tanggung jawab masing-masing anggota.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_MEMBERS.map((m) => (
              <div key={m.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-leaf-gradient text-primary-foreground text-lg">
                    {m.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-primary">{m.role}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{m.task}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
