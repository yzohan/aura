import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Star, MapPin, CheckCircle2, ThumbsUp, MessageSquarePlus, Filter,
  TrendingUp, ShieldCheck, Clock, Send, Award, Search, ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { PageHero } from "@/components/page-hero";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KECAMATAN_LIST, TANGSEL_KECAMATAN } from "@/lib/tangsel-data";

import rawaBuntuImg from "@/assets/rawa_buntu_road.jpg";
import pamulangImg from "@/assets/pamulang_road.jpg";
import pondokArenImg from "@/assets/pondok_aren_road.jpg";
import ciputatImg from "@/assets/ciputat_road.jpg";
import lengkongGudangImg from "@/assets/lengkong_gudang_road.jpg";
import cireundeuImg from "@/assets/cireundeu_road.jpg";
import pakulonanImg from "@/assets/pakulonan_road.jpg";
import babakanImg from "@/assets/babakan_road.jpg";

export const Route = createFileRoute("/daerah")({
  head: () => ({
    meta: [
      { title: "Kondisi Wilayah & Rating Warga Tangsel - AURA" },
      { name: "description", content: "Pantau rating kepuasan warga dan progres perbaikan infrastruktur jalan di 7 Kecamatan Kota Tangerang Selatan." },
    ],
  }),
  component: DaerahRatingPage,
});

// Data kartu kelurahan representatif
interface KelurahanCardData {
  id: string;
  name: string;
  kecamatanId: string;
  kecamatanName: string;
  stat: string;
  reports: number;
  rating: number;
  speed: string;
  img: string;
}

const KELURAHAN_CARDS: KelurahanCardData[] = [
  {
    id: "rawa-buntu",
    name: "Kelurahan Rawa Buntu",
    kecamatanId: "serpong",
    kecamatanName: "Kec. Serpong, Tangsel",
    stat: "98% Selesai",
    reports: 420,
    rating: 4.9,
    speed: "24 Jam",
    img: rawaBuntuImg,
  },
  {
    id: "pamulang-barat",
    name: "Kelurahan Pamulang Barat",
    kecamatanId: "pamulang",
    kecamatanName: "Kec. Pamulang, Tangsel",
    stat: "95% Selesai",
    reports: 310,
    rating: 4.8,
    speed: "36 Jam",
    img: pamulangImg,
  },
  {
    id: "pondok-aren",
    name: "Kelurahan Pondok Aren",
    kecamatanId: "pondok-aren",
    kecamatanName: "Kec. Pondok Aren, Tangsel",
    stat: "99% Selesai",
    reports: 510,
    rating: 5.0,
    speed: "18 Jam",
    img: pondokArenImg,
  },
  {
    id: "ciputat",
    name: "Kelurahan Ciputat",
    kecamatanId: "ciputat",
    kecamatanName: "Kec. Ciputat, Tangsel",
    stat: "92% Selesai",
    reports: 280,
    rating: 4.7,
    speed: "48 Jam",
    img: ciputatImg,
  },
  {
    id: "lengkong-gudang",
    name: "Kelurahan Lengkong Gudang",
    kecamatanId: "serpong",
    kecamatanName: "Kec. Serpong, Tangsel",
    stat: "97% Selesai",
    reports: 385,
    rating: 4.9,
    speed: "24 Jam",
    img: lengkongGudangImg,
  },
  {
    id: "cireundeu",
    name: "Kelurahan Cireundeu",
    kecamatanId: "ciputat-timur",
    kecamatanName: "Kec. Ciputat Timur, Tangsel",
    stat: "96% Selesai",
    reports: 295,
    rating: 4.8,
    speed: "30 Jam",
    img: cireundeuImg,
  },
  {
    id: "pakulonan",
    name: "Kelurahan Pakulonan",
    kecamatanId: "serpong-utara",
    kecamatanName: "Kec. Serpong Utara, Tangsel",
    stat: "94% Selesai",
    reports: 340,
    rating: 4.8,
    speed: "32 Jam",
    img: pakulonanImg,
  },
  {
    id: "babakan",
    name: "Kelurahan Babakan",
    kecamatanId: "setu",
    kecamatanName: "Kec. Setu, Tangsel",
    stat: "93% Selesai",
    reports: 215,
    rating: 4.7,
    speed: "40 Jam",
    img: babakanImg,
  },
];

// Data Ulasan Dummy dari warga berbagai penjuru Tangsel
interface CitizenReview {
  id: string;
  name: string;
  avatar: string;
  kecamatanId: string;
  kecamatanName: string;
  kelurahan: string;
  rating: number;
  timeAgo: string;
  comment: string;
  helpfulCount: number;
  verified: boolean;
  category: string;
}

const INITIAL_REVIEWS: CitizenReview[] = [
  {
    id: "rev-1",
    name: "Budi Santoso",
    avatar: "BS",
    kecamatanId: "serpong",
    kecamatanName: "Kec. Serpong",
    kelurahan: "Kel. Rawa Buntu",
    rating: 5,
    timeAgo: "2 hari lalu",
    comment: "Lapor lubang aspal parah dekat Stasiun Rawa Buntu pagi jam 8 pas berangkat kantor. Pas pulang jam 6 sore sudah rapi ditambal tim dinas! Ga nyangka responnya secepat itu.",
    helpfulCount: 28,
    verified: true,
    category: "Jalan Berlubang",
  },
  {
    id: "rev-2",
    name: "Siti Nurhaliza",
    avatar: "SN",
    kecamatanId: "pondok-aren",
    kecamatanName: "Kec. Pondok Aren",
    kelurahan: "Kel. Pondok Aren",
    rating: 5,
    timeAgo: "3 hari lalu",
    comment: "Jalan utama komplek sering tergenang dan retak pas musim hujan. Setelah difoto lewat AURA, besoknya langsung ada petugas dan armada penambal datang. Mantap Tangsel!",
    helpfulCount: 19,
    verified: true,
    category: "Aspal Ambles",
  },
  {
    id: "rev-3",
    name: "Rian Pratama",
    avatar: "RP",
    kecamatanId: "pamulang",
    kecamatanName: "Kec. Pamulang",
    kelurahan: "Kel. Pamulang Barat",
    rating: 5,
    timeAgo: "4 hari lalu",
    comment: "Senang banget sekarang ga perlu ribet kirim surat kelurahan atau birokrasi manual. Cukup jepret pakai kamera HP, GPS-nya akurat banget langsung masuk disposisi petugas.",
    helpfulCount: 34,
    verified: true,
    category: "Jalan Berlubang",
  },
  {
    id: "rev-4",
    name: "Dewi Lestari",
    avatar: "DL",
    kecamatanId: "ciputat-timur",
    kecamatanName: "Kec. Ciputat Timur",
    kelurahan: "Kel. Cireundeu",
    rating: 5,
    timeAgo: "5 hari lalu",
    comment: "Jalur Cireundeu arah Lebak Bulus yang tadinya bergelombang bahaya buat motor sudah ditambal rapi. Nilai transparansi aplikasinya jempolan, kita bisa pantau status pengerjaan secara real-time.",
    helpfulCount: 15,
    verified: true,
    category: "Jalan Berlubang",
  },
  {
    id: "rev-5",
    name: "Agus Setiawan",
    avatar: "AS",
    kecamatanId: "serpong-utara",
    kecamatanName: "Kec. Serpong Utara",
    kelurahan: "Kel. Pakulonan",
    rating: 4,
    timeAgo: "6 hari lalu",
    comment: "Wilayah Serpong Utara dan Alam Sutera sangat responsif. Petugas lapangan ramah dan pengerjaan tambalan jalan aspal halus ga bikin shockbreaker jeglong.",
    helpfulCount: 12,
    verified: true,
    category: "Retak Jalan",
  },
  {
    id: "rev-6",
    name: "Farhan Ramadhan",
    avatar: "FR",
    kecamatanId: "ciputat",
    kecamatanName: "Kec. Ciputat",
    kelurahan: "Kel. Cipayung",
    rating: 5,
    timeAgo: "1 minggu lalu",
    comment: "Inovasi terbaik buat warga Tangsel. Sistem AI-nya pintar mendeteksi estimasi kedalaman lubang jalan, jadi laporan kita langsung dapet prioritas penanganan darurat.",
    helpfulCount: 22,
    verified: true,
    category: "Jalan Berlubang",
  },
  {
    id: "rev-7",
    name: "Ratna Wulandari",
    avatar: "RW",
    kecamatanId: "setu",
    kecamatanName: "Kec. Setu",
    kelurahan: "Kel. Babakan",
    rating: 5,
    timeAgo: "1 minggu lalu",
    comment: "Kawasan Setu yang biasanya agak pinggir sekarang diperhatikan sama baiknya dengan BSD. Lubang jalan di pertigaan Babakan sudah mulus kembali. Terima kasih dinas SDABMBK!",
    helpfulCount: 17,
    verified: true,
    category: "Aspal Ambles",
  },
  {
    id: "rev-8",
    name: "Hendra Wijaya",
    avatar: "HW",
    kecamatanId: "serpong",
    kecamatanName: "Kec. Serpong",
    kelurahan: "Kel. Lengkong Gudang",
    rating: 5,
    timeAgo: "2 minggu lalu",
    comment: "Di jalanan protokol BSD yang ramai mobilitas truk dan mobil, begitu ada retakan langsung ditindak 1x24 jam. Sangat memuaskan!",
    helpfulCount: 20,
    verified: true,
    category: "Jalan Berlubang",
  },
];

function DaerahRatingPage() {
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>("all");
  const [cards, setCards] = useState<KelurahanCardData[]>(KELURAHAN_CARDS);
  const [reviews, setReviews] = useState<CitizenReview[]>(INITIAL_REVIEWS);
  const [searchQuery, setSearchQuery] = useState("");
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  // Modal Kartu Kelurahan Spesifik
  const [activeCard, setActiveCard] = useState<KelurahanCardData | null>(null);
  const [cardRating, setCardRating] = useState<number>(5);
  const [cardHoverRating, setCardHoverRating] = useState<number>(0);
  const [cardReviewerName, setCardReviewerName] = useState("");
  const [cardCategory, setCardCategory] = useState("Jalan Berlubang");
  const [cardComment, setCardComment] = useState("");

  // Modal Beri Ulasan Umum
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newName, setNewName] = useState("");
  const [newKecamatanId, setNewKecamatanId] = useState("serpong");
  const [newKelurahan, setNewKelurahan] = useState("");
  const [newComment, setNewComment] = useState("");

  const selectedKecData = TANGSEL_KECAMATAN[newKecamatanId];

  // Filter Cards
  const filteredCards = useMemo(() => {
    if (selectedKecamatan === "all") return cards;
    return cards.filter((c) => c.kecamatanId === selectedKecamatan);
  }, [cards, selectedKecamatan]);

  // Filter Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (selectedKecamatan !== "all" && r.kecamatanId !== selectedKecamatan) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.kelurahan.toLowerCase().includes(q) ||
          r.kecamatanName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, selectedKecamatan, searchQuery]);

  const toggleLike = (id: string) => {
    setLikedReviews((prev) => {
      const isLiked = !prev[id];
      setReviews((curReviews) =>
        curReviews.map((rev) => {
          if (rev.id === id) {
            return {
              ...rev,
              helpfulCount: rev.helpfulCount + (isLiked ? 1 : -1),
            };
          }
          return rev;
        })
      );
      return { ...prev, [id]: isLiked };
    });
  };

  // Submit dari Form Modal Khusus Kartu
  const handleSubmitCardReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    if (!cardReviewerName.trim() || !cardComment.trim()) {
      toast.error("Mohon isi nama dan komentar ulasan Anda.");
      return;
    }

    const kelNameClean = activeCard.name.replace("Kelurahan ", "");

    const newRev: CitizenReview = {
      id: `rev-${Date.now()}`,
      name: cardReviewerName.trim(),
      avatar: cardReviewerName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "W",
      kecamatanId: activeCard.kecamatanId,
      kecamatanName: activeCard.kecamatanName.split(",")[0],
      kelurahan: `Kel. ${kelNameClean}`,
      rating: cardRating,
      timeAgo: "Baru saja",
      comment: cardComment.trim(),
      helpfulCount: 1,
      verified: true,
      category: cardCategory,
    };

    // Update list review
    setReviews((prev) => [newRev, ...prev]);

    // Recalculate card rating & report count
    setCards((prevCards) =>
      prevCards.map((c) => {
        if (c.id === activeCard.id) {
          const newTotalReports = c.reports + 1;
          const newAvgRating = Number(
            ((c.rating * c.reports + cardRating) / newTotalReports).toFixed(1)
          );
          return {
            ...c,
            reports: newTotalReports,
            rating: Math.min(5.0, newAvgRating),
          };
        }
        return c;
      })
    );

    toast.success(`Rating ⭐ ${cardRating}.0 untuk ${activeCard.name} berhasil dikirim!`);
    setActiveCard(null);
    setCardReviewerName("");
    setCardComment("");
    setCardRating(5);
  };

  // Submit Ulasan Umum
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) {
      toast.error("Mohon lengkapi nama dan ulasan Anda.");
      return;
    }

    const kec = TANGSEL_KECAMATAN[newKecamatanId] || KECAMATAN_LIST[0];
    const kelName = newKelurahan.trim() || kec.kelurahan[0].name;

    const newRev: CitizenReview = {
      id: `rev-${Date.now()}`,
      name: newName.trim(),
      avatar: newName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "W",
      kecamatanId: kec.id,
      kecamatanName: `Kec. ${kec.shortName}`,
      kelurahan: `Kel. ${kelName}`,
      rating: newRating,
      timeAgo: "Baru saja",
      comment: newComment.trim(),
      helpfulCount: 1,
      verified: true,
      category: "Ulasan Warga",
    };

    setReviews([newRev, ...reviews]);
    toast.success("Ulasan Anda berhasil ditambahkan!");
    setDialogOpen(false);
    setNewName("");
    setNewComment("");
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5:
        return "Sangat Puas! Jalanan mulus & respon kilat (5/5)";
      case 4:
        return "Puas! Respon cepat dan tambalan rapi (4/5)";
      case 3:
        return "Cukup, penanganan sedang berjalan (3/5)";
      case 2:
        return "Kurang Puas, penanganan agak lambat (2/5)";
      case 1:
        return "Kecewa, jalan masih sering berlubang (1/5)";
      default:
        return `${val}.0 / 5.0`;
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <SiteHeader overlay />
      <main className="flex-1 pb-16">
        <PageHero
          pill="Wilayah & Rating"
          title="Rating Kepuasan Warga Tangsel"
          subtitle="Transparansi mutu perbaikan jalan dan suara nyata warga di 7 Kecamatan & 54 Kelurahan Kota Tangerang Selatan."
        />

        {/* METRIK KOTA TANGSEL */}
        <section className="mx-auto max-w-[1200px] px-4 pt-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-[28px] bg-forest p-6 text-white shadow-soft">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Star className="h-4 w-4 fill-primary" /> Kepuasan Publik
              </span>
              <p className="mt-2 text-4xl font-extrabold text-white">4.9<span className="text-xl font-normal text-white/60"> / 5.0</span></p>
              <p className="mt-1 text-xs text-white/70">Berdasarkan 1.840+ ulasan warga</p>
            </div>

            <div className="rounded-[28px] bg-card p-6 border border-border shadow-soft">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest dark:text-primary">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Penyelesaian
              </span>
              <p className="mt-2 text-4xl font-extrabold text-forest dark:text-foreground">96.8%</p>
              <p className="mt-1 text-xs text-muted-foreground">Tingkat perbaikan tertangani</p>
            </div>

            <div className="rounded-[28px] bg-card p-6 border border-border shadow-soft">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest dark:text-primary">
                <Clock className="h-4 w-4 text-primary" /> Respon Cepat
              </span>
              <p className="mt-2 text-4xl font-extrabold text-forest dark:text-foreground">&lt; 24 Jam</p>
              <p className="mt-1 text-xs text-muted-foreground">Rata-rata respon petugas</p>
            </div>

            <div className="rounded-[28px] bg-sage p-6 shadow-soft">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest">
                <MapPin className="h-4 w-4 text-forest" /> Cakupan Wilayah
              </span>
              <p className="mt-2 text-4xl font-extrabold text-forest">7 <span className="text-xl font-medium">Kecamatan</span></p>
              <p className="mt-1 text-xs text-forest/70">54 Kelurahan aktif terpetakan</p>
            </div>
          </div>
        </section>

        {/* SECTION FILTER WILAYAH */}
        <section className="mx-auto max-w-[1200px] px-4 pt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
                <Filter className="h-3.5 w-3.5" /> Filter Kecamatan
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-forest md:text-3xl dark:text-foreground">
                Pilih Wilayah Administrasi
              </h2>
            </div>

            {/* Modal Beri Ulasan */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="dark" className="gap-2 rounded-full px-5">
                  <MessageSquarePlus className="h-4 w-4 text-primary" />
                  Beri Rating & Ulasan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[32px] p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-extrabold text-forest">Tulis Ulasan & Rating Wilayah</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Bantu tetangga dan Pemkot Tangsel mengetahui kondisi jalanan di kelurahan Anda.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-forest dark:text-foreground">Rating Kepuasan</label>
                    <div
                      className="mt-1.5 flex items-center gap-1.5"
                      onMouseLeave={() => setNewRating(newRating)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="rounded-lg p-1 transition-colors hover:bg-sage/40 focus:outline-none"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors duration-150 ${
                              star <= newRating
                                ? "fill-primary stroke-primary text-primary"
                                : "stroke-muted-foreground/30 text-transparent"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 rounded-full bg-sage px-3 py-1 text-xs font-extrabold text-forest">
                        {newRating}.0 / 5.0
                      </span>
                    </div>
                    <p className="mt-1 min-h-[1.25rem] text-xs font-medium text-forest/80 dark:text-primary">
                      {getRatingLabel(newRating)}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-forest dark:text-foreground">Nama Anda</label>
                    <Input
                      placeholder="Contoh: Budi Santoso"
                      className="mt-1 rounded-2xl"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-forest dark:text-foreground">Kecamatan</label>
                      <Select value={newKecamatanId} onValueChange={(v) => {
                        setNewKecamatanId(v);
                        const k = TANGSEL_KECAMATAN[v];
                        if (k && k.kelurahan.length > 0) {
                          setNewKelurahan(k.kelurahan[0].name);
                        }
                      }}>
                        <SelectTrigger className="mt-1 rounded-2xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KECAMATAN_LIST.map((kec) => (
                            <SelectItem key={kec.id} value={kec.id}>
                              {kec.shortName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest dark:text-foreground">Kelurahan</label>
                      <Select value={newKelurahan || selectedKecData?.kelurahan[0]?.name || ""} onValueChange={setNewKelurahan}>
                        <SelectTrigger className="mt-1 rounded-2xl">
                          <SelectValue placeholder="Pilih Kelurahan" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedKecData?.kelurahan.map((kel) => (
                            <SelectItem key={kel.code} value={kel.name}>
                              {kel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-forest dark:text-foreground">Ulasan Anda</label>
                    <Textarea
                      placeholder="Ceritakan pengalaman Anda mengenai jalan berlubang, respon petugas, atau perbaikan jalan di wilayah ini..."
                      rows={3}
                      className="mt-1 rounded-2xl resize-none"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" className="rounded-full" onClick={() => setDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" variant="dark" className="rounded-full gap-2">
                      <Send className="h-3.5 w-3.5 text-primary" /> Kirim Ulasan
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Kecamatan Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedKecamatan("all")}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                selectedKecamatan === "all"
                  ? "bg-forest text-primary shadow-soft"
                  : "bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              Semua Wilayah (7 Kecamatan)
            </button>
            {KECAMATAN_LIST.map((kec) => {
              const active = selectedKecamatan === kec.id;
              return (
                <button
                  key={kec.id}
                  onClick={() => setSelectedKecamatan(kec.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    active
                      ? "text-white shadow-soft"
                      : "bg-card border border-border text-foreground hover:bg-secondary"
                  }`}
                  style={{
                    backgroundColor: active ? kec.color : undefined,
                    borderColor: active ? kec.color : undefined,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: active ? "#ffffff" : kec.color }}
                  />
                  <span>{kec.code}</span>
                  <span>{kec.shortName}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* KARTU KELURAHAN (SESUAI DOKUMENTASI DESAIN USER) */}
        <section className="mx-auto max-w-[1200px] px-4 pt-8">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-forest dark:text-foreground">
                Kondisi Kelurahan Percontohan ({filteredCards.length} Wilayah)
              </h3>
              <p className="text-xs text-muted-foreground">
                💡 <span className="font-semibold text-forest dark:text-primary">Klik kartu kelurahan mana saja</span> untuk langsung memberi rating bintang & menulis ulasan warga.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">Diperbarui real-time dari data penanganan dinas</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCards.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveCard(c);
                  setCardRating(5);
                  setCardHoverRating(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setActiveCard(c);
                    setCardRating(5);
                    setCardHoverRating(0);
                  }
                }}
                className="group relative h-[360px] cursor-pointer overflow-hidden rounded-[32px] bg-card shadow-soft transition-shadow duration-300 hover:shadow-elev focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img
                  src={c.img}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/95 via-forest/40 to-transparent" />

                {/* Badge Selesai */}
                <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
                  <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-soft">
                    {c.stat}
                  </span>
                  <span className="rounded-full bg-forest/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    ★ Beri Rating
                  </span>
                </div>

                {/* Label Wilayah & Rating */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col p-5 text-white">
                  <span className="text-[11px] font-bold text-primary">{c.kecamatanName}</span>
                  <h4 className="mt-0.5 text-lg font-extrabold leading-tight text-white group-hover:text-primary transition-colors">
                    {c.name}
                  </h4>

                  <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3 text-xs text-white/90">
                    <div className="flex items-center gap-1.5">
                      <span className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-primary stroke-primary" />
                        ))}
                      </span>
                      <span className="font-extrabold">{c.rating}</span>
                    </div>
                    <span className="font-medium opacity-80">{c.reports} laporan</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
                    <span>Target Respon:</span>
                    <span className="font-bold text-primary">{c.speed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MODAL DIALOG KHUSUS SAAT KARTU KELURAHAN DIKLIK */}
        <Dialog open={!!activeCard} onOpenChange={(open) => !open && setActiveCard(null)}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-[32px] p-0 border-none">
            {activeCard && (
              <div className="flex flex-col bg-card">
                {/* Header Foto Kelurahan */}
                <div className="relative h-44 w-full overflow-hidden bg-forest sm:h-52">
                  <img
                    src={activeCard.img}
                    alt={activeCard.name}
                    className="h-full w-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                  
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-soft">
                      {activeCard.stat}
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-6 right-6">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">
                      {activeCard.kecamatanName}
                    </span>
                    <h3 className="text-2xl font-black text-white sm:text-3xl">
                      {activeCard.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-white/80">
                      Kota Tangerang Selatan • Target Respon SLA: <span className="font-bold text-primary">{activeCard.speed}</span>
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Statistik Singkat Kelurahan */}
                  <div className="grid grid-cols-3 gap-3 rounded-2xl bg-sage-soft p-3.5 text-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rating Saat Ini</span>
                      <p className="text-lg font-black text-forest dark:text-primary flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-primary stroke-primary text-primary" /> {activeCard.rating}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Ditangani</span>
                      <p className="text-lg font-black text-forest dark:text-foreground">
                        {activeCard.reports} <span className="text-xs font-normal text-muted-foreground">Laporan</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kecepatan SLA</span>
                      <p className="text-lg font-black text-forest dark:text-foreground">{activeCard.speed}</p>
                    </div>
                  </div>

                  {/* FORM BERI RATING UNTUK KELURAHAN INI */}
                  <form onSubmit={handleSubmitCardReview} className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/50 pb-3">
                      <div>
                        <h4 className="text-base font-extrabold text-forest dark:text-foreground flex items-center gap-2">
                          <MessageSquarePlus className="h-4 w-4 text-primary" />
                          Beri Rating untuk {activeCard.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Bagikan pengalaman Anda mengenai kualitas perbaikan jalan di kelurahan ini.
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Picker Interaktif - Solid & Mulus Tanpa Getar */}
                    <div>
                      <label className="text-xs font-bold text-forest dark:text-foreground">
                        Pilih Bintang Kepuasan:
                      </label>
                      <div
                        className="mt-2 flex items-center gap-1.5"
                        onMouseLeave={() => setCardHoverRating(0)}
                      >
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled = star <= (cardHoverRating || cardRating);
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCardRating(star)}
                              onMouseEnter={() => setCardHoverRating(star)}
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
                          {cardHoverRating || cardRating}.0 / 5.0
                        </span>
                      </div>
                      <p className="mt-1.5 min-h-[1.25rem] text-xs font-medium text-forest/80 dark:text-primary">
                        {getRatingLabel(cardHoverRating || cardRating)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-forest dark:text-foreground">Nama Anda</label>
                        <Input
                          placeholder="Nama warga pelapor"
                          className="mt-1 rounded-2xl"
                          value={cardReviewerName}
                          onChange={(e) => setCardReviewerName(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-forest dark:text-foreground">Kategori Masukan</label>
                        <Select value={cardCategory} onValueChange={setCardCategory}>
                          <SelectTrigger className="mt-1 rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Jalan Berlubang">Jalan Berlubang</SelectItem>
                            <SelectItem value="Aspal Ambles">Aspal Ambles</SelectItem>
                            <SelectItem value="Retak Jalan">Retak Jalan</SelectItem>
                            <SelectItem value="Respon Petugas">Respon Petugas Dinas</SelectItem>
                            <SelectItem value="Trotoar & Drainase">Trotoar & Drainase</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-forest dark:text-foreground">Ulasan & Masukan Anda</label>
                      <Textarea
                        placeholder={`Contoh: "Jalan di ${activeCard.name} kemarin berlubang parah, sekarang sudah ditambal rapi dan cepat oleh petugas."`}
                        rows={3}
                        className="mt-1 rounded-2xl resize-none"
                        value={cardComment}
                        onChange={(e) => setCardComment(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setActiveCard(null)}
                      >
                        Tutup
                      </Button>
                      <Button type="submit" variant="dark" className="rounded-full gap-2">
                        <Send className="h-3.5 w-3.5 text-primary" /> Kirim Rating Sekarang
                      </Button>
                    </div>
                  </form>

                  {/* ULASAN WARGA SPESIFIK KELURAHAN INI */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Ulasan Warga di {activeCard.name}
                    </h5>

                    {(() => {
                      const kelNameClean = activeCard.name.replace("Kelurahan ", "").toLowerCase();
                      const specificReviews = reviews.filter(
                        (r) =>
                          r.kelurahan.toLowerCase().includes(kelNameClean) ||
                          r.kecamatanId === activeCard.kecamatanId
                      );

                      if (specificReviews.length === 0) {
                        return (
                          <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                            Belum ada ulasan warga lain di wilayah ini.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                          {specificReviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="rounded-2xl bg-secondary/50 p-3.5 text-xs text-foreground space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-forest dark:text-foreground">{rev.name}</span>
                                  <span className="text-[10px] text-muted-foreground">• {rev.timeAgo}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < rev.rating
                                          ? "fill-primary stroke-primary text-primary"
                                          : "stroke-muted text-transparent"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="italic text-muted-foreground">“{rev.comment}”</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* FEED ULASAN & SUARA WARGA TANGSEL */}
        <section className="mx-auto max-w-[1200px] px-4 pt-16">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
                <Sparkles className="h-3.5 w-3.5" /> Suara Warga
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-forest md:text-3xl dark:text-foreground">
                Ulasan & Kepuasan Warga Tangsel
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Ulasan langsung dari warga yang telah merasakan perbaikan jalan di lingkungannya.
              </p>
            </div>

            {/* Pencarian Ulasan */}
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari warga, kelurahan, kata kunci..."
                className="pl-11 rounded-full bg-card"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredReviews.length === 0 ? (
              <div className="col-span-full flex h-40 items-center justify-center rounded-[32px] border border-dashed border-border bg-card p-6 text-sm italic text-muted-foreground">
                Belum ada ulasan warga untuk kriteria pencarian ini. Jadilah yang pertama memberi ulasan!
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="flex flex-col justify-between rounded-[32px] border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:shadow-elev"
                >
                  <div>
                    {/* Header Review */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage font-extrabold text-forest text-sm">
                          {rev.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-extrabold text-forest dark:text-foreground">{rev.name}</h4>
                            {rev.verified && (
                              <Award className="h-3.5 w-3.5 text-primary" title="Warga Terverifikasi Tangsel" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {rev.kelurahan} • <span className="font-semibold text-forest dark:text-foreground">{rev.kecamatanName}</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-muted-foreground shrink-0">{rev.timeAgo}</span>
                    </div>

                    {/* Bintang & Kategori */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating
                                ? "fill-primary stroke-primary text-primary"
                                : "stroke-muted text-transparent"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {rev.category}
                      </span>
                    </div>

                    {/* Komentar */}
                    <p className="mt-3 text-xs leading-relaxed text-forest/90 dark:text-foreground/90 italic">
                      “{rev.comment}”
                    </p>
                  </div>

                  {/* Footer Like */}
                  <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[10px] font-semibold text-muted-foreground">Apakah ulasan ini membantu?</span>
                    <button
                      type="button"
                      onClick={() => toggleLike(rev.id)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors ${
                        likedReviews[rev.id]
                          ? "bg-forest text-primary"
                          : "bg-sage hover:bg-forest hover:text-primary text-forest"
                      }`}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      <span>{rev.helpfulCount}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="mx-auto max-w-[1200px] px-4 pt-16">
          <div className="relative overflow-hidden rounded-[36px] bg-forest p-8 md:p-12 text-white">
            <div className="relative z-10 max-w-xl space-y-4">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                Aksi Nyata Warga
              </span>
              <h3 className="text-3xl font-extrabold leading-tight">
                Menemukan Jalan Rusak di Sekitar Anda?
              </h3>
              <p className="text-sm leading-relaxed text-white/80">
                Jangan tunggu kecelakaan terjadi. Foto lubang jalan sekarang juga dan laporkan lewat AURA dalam waktu 30 detik. Laporan Anda langsung diteruskan ke petugas dinas.
              </p>
              <div className="pt-2">
                <Button asChild variant="primary" className="rounded-full px-6 py-6 font-extrabold text-forest gap-2 shadow-soft">
                  <Link to="/warga">
                    Laporkan Kerusakan Sekarang <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
