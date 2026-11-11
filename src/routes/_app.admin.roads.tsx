import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Building2, Search, Route as RouteIcon, X, Bus, Trash,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/admin/roads")({
  head: () => ({ meta: [{ title: "Kelola Data Jalan" }] }),
  component: RoadsPage,
});

// ── Types ────────────────────────────────────────────────────────────────────
interface Road {
  id: string;
  name: string;
  kelurahan: string | null;
  kecamatan: string | null;
  length_m: number | null;
  condition: "baik" | "sedang" | "rusak_ringan" | "rusak_berat" | null;
  created_at: string;
}

interface Facility {
  id: string;
  road_id: string;
  name: string;
  type: string;
  description: string | null;
}

const CONDITION_LABEL: Record<string, string> = {
  baik: "Baik",
  sedang: "Sedang",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
};

const CONDITION_TONE: Record<string, string> = {
  baik: "bg-success/15 text-success",
  sedang: "bg-warning/20 text-warning-foreground",
  rusak_ringan: "bg-orange/15 text-orange",
  rusak_berat: "bg-destructive/15 text-destructive",
};

const CONDITION_DOT: Record<string, string> = {
  baik: "bg-success",
  sedang: "bg-warning",
  rusak_ringan: "bg-orange",
  rusak_berat: "bg-destructive",
};

const FACILITY_TYPE_LABEL: Record<string, string> = {
  halte_bus: "Halte Bus",
  lampu_jalan: "Lampu Jalan",
  trotoar: "Trotoar",
  drainase: "Drainase",
  zebra_cross: "Zebra Cross",
  rambu_lalu_lintas: "Rambu Lalu Lintas",
  taman: "Taman",
  pos_keamanan: "Pos Keamanan",
  lainnya: "Lainnya",
};

// ── Empty form states ────────────────────────────────────────────────────────
const EMPTY_ROAD: Omit<Road, "id" | "created_at"> = {
  name: "",
  kelurahan: "",
  kecamatan: "",
  length_m: null,
  condition: null,
};

const EMPTY_FACILITY: Omit<Facility, "id" | "road_id"> = {
  name: "",
  type: "halte_bus",
  description: "",
};

const pillBtn =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-opacity hover:opacity-90";

// ── Main component ───────────────────────────────────────────────────────────
function RoadsPage() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedRoadId, setExpandedRoadId] = useState<string | null>(null);

  // Road dialog
  const [roadDialog, setRoadDialog] = useState<{ open: boolean; editing: Road | null }>({ open: false, editing: null });
  const [roadForm, setRoadForm] = useState(EMPTY_ROAD);

  // Facility dialog
  const [facilityDialog, setFacilityDialog] = useState<{ open: boolean; editing: Facility | null; roadId: string | null }>({ open: false, editing: null, roadId: null });
  const [facilityForm, setFacilityForm] = useState(EMPTY_FACILITY);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    const [{ data: r }, { data: f }] = await Promise.all([
      supabase.from("roads").select("*").order("name"),
      supabase.from("road_facilities").select("*").order("name"),
    ]);
    setRoads((r ?? []) as Road[]);
    setFacilities((f ?? []) as Facility[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Road CRUD ──────────────────────────────────────────────────────────────
  const openAddRoad = () => {
    setRoadForm(EMPTY_ROAD);
    setRoadDialog({ open: true, editing: null });
  };

  const openEditRoad = (road: Road) => {
    setRoadForm({ name: road.name, kelurahan: road.kelurahan, kecamatan: road.kecamatan, length_m: road.length_m, condition: road.condition });
    setRoadDialog({ open: true, editing: road });
  };

  const saveRoad = async () => {
    const payload = { ...roadForm, length_m: roadForm.length_m ? Number(roadForm.length_m) : null };
    if (!payload.name.trim()) { toast.error("Nama jalan wajib diisi"); return; }

    if (roadDialog.editing) {
      const { error } = await supabase.from("roads").update(payload).eq("id", roadDialog.editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Data jalan diperbarui");
    } else {
      const { error } = await supabase.from("roads").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Jalan berhasil ditambahkan");
    }
    setRoadDialog({ open: false, editing: null });
    fetchAll();
  };

  const deleteRoad = async (id: string) => {
    const { error } = await supabase.from("roads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Jalan dihapus");
    setRoads(roads.filter((r) => r.id !== id));
    setFacilities(facilities.filter((f) => f.road_id !== id));
    if (expandedRoadId === id) setExpandedRoadId(null);
  };

  // ── Facility CRUD ──────────────────────────────────────────────────────────
  const openAddFacility = (roadId: string) => {
    setFacilityForm(EMPTY_FACILITY);
    setFacilityDialog({ open: true, editing: null, roadId });
  };

  const openEditFacility = (fac: Facility) => {
    setFacilityForm({ name: fac.name, type: fac.type, description: fac.description ?? "" });
    setFacilityDialog({ open: true, editing: fac, roadId: fac.road_id });
  };

  const saveFacility = async () => {
    if (!facilityForm.name.trim()) { toast.error("Nama fasilitas wajib diisi"); return; }
    const payload = { ...facilityForm, road_id: facilityDialog.roadId! };

    if (facilityDialog.editing) {
      const { error } = await supabase.from("road_facilities").update(facilityForm).eq("id", facilityDialog.editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Fasilitas diperbarui");
    } else {
      const { error } = await supabase.from("road_facilities").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Fasilitas ditambahkan");
    }
    setFacilityDialog({ open: false, editing: null, roadId: null });
    fetchAll();
  };

  const deleteFacility = async (id: string) => {
    const { error } = await supabase.from("road_facilities").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Fasilitas dihapus");
    setFacilities(facilities.filter((f) => f.id !== id));
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredRoads = roads.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.kelurahan ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (r.kecamatan ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-forest md:text-4xl dark:text-foreground">
            Kelola Data Jalan
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Kelola data ruas jalan, kondisi, dan fasilitas umum di seluruh Tangerang Selatan.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama jalan, kelurahan…"
              className="pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={openAddRoad}
            className="inline-flex h-12 shrink-0 items-center justify-between gap-3 rounded-full bg-primary pl-6 pr-1.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Tambah Jalan
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-primary">
              <Plus className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>

      {/* Daftar jalan */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-forest" />
        </div>
      ) : filteredRoads.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-[32px] bg-card text-sm italic text-muted-foreground">
          Belum ada data jalan.
        </div>
      ) : (
        <div className="space-y-4 rounded-[32px] bg-card/70 p-3 shadow-soft md:p-4">
          {filteredRoads.map((road) => {
            const roadFacilities = facilities.filter((f) => f.road_id === road.id);
            const isExpanded = expandedRoadId === road.id;

            return (
              <div key={road.id} className="overflow-hidden rounded-[28px] bg-card">
                {/* Baris jalan */}
                <div className="flex flex-wrap items-center gap-3 p-4 md:gap-5">
                  <button
                    onClick={() => setExpandedRoadId(isExpanded ? null : road.id)}
                    aria-label={isExpanded ? "Tutup fasilitas" : "Lihat fasilitas"}
                    aria-expanded={isExpanded}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isExpanded ? "bg-forest text-primary" : "bg-sage text-forest hover:bg-sage/70"
                    }`}
                  >
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>

                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-lg font-extrabold text-forest dark:text-foreground">{road.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[road.kelurahan, road.kecamatan].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>

                  {road.length_m ? (
                    <div className="hidden text-left md:block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Panjang</p>
                      <p className="text-sm font-extrabold text-forest dark:text-foreground">
                        {road.length_m.toLocaleString("id-ID")} m
                      </p>
                    </div>
                  ) : null}

                  {road.condition && (
                    <span className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex ${CONDITION_TONE[road.condition]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${CONDITION_DOT[road.condition]}`} />
                      {CONDITION_LABEL[road.condition]}
                    </span>
                  )}

                  <span className="hidden items-center gap-2 text-xs font-bold text-forest md:inline-flex dark:text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage">
                      <Bus className="h-4 w-4" />
                    </span>
                    {roadFacilities.length} fasilitas
                  </span>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => openEditRoad(road)}
                      title="Edit jalan"
                      aria-label="Edit jalan"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-forest transition-colors hover:bg-sage/70"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          title="Hapus jalan"
                          aria-label="Hapus jalan"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-sm rounded-[32px] p-8 text-center">
                        <AlertDialogHeader className="items-center space-y-3 text-center sm:text-center">
                          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-white">
                              <Trash className="h-6 w-6" />
                            </span>
                          </span>
                          <AlertDialogTitle className="text-2xl font-extrabold text-destructive">Hapus Jalan?</AlertDialogTitle>
                          <AlertDialogDescription className="text-center">
                            Menghapus <strong>{road.name}</strong> juga menghapus seluruh fasilitas umumnya ({roadFacilities.length} fasilitas) dan tidak dapat dikembalikan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-2 grid grid-cols-2 gap-3 sm:space-x-0">
                          <AlertDialogCancel className="mt-0 h-12 rounded-full border-[1.5px] border-forest font-bold text-forest">
                            Batal
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRoad(road.id)}
                            className="h-12 rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
                          >
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Fasilitas umum */}
                {isExpanded && (
                  <div className="mx-3 mb-3 rounded-[24px] bg-sage-soft p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-extrabold text-forest md:text-base">
                        Fasilitas Umum di {road.name}
                      </h3>
                      <button
                        onClick={() => openAddFacility(road.id)}
                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-primary pl-4 pr-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Tambah
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-primary">
                          <Plus className="h-3 w-3" />
                        </span>
                      </button>
                    </div>

                    {roadFacilities.length === 0 ? (
                      <div className="flex items-center justify-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-forest-soft/40 px-4 py-8 text-sm text-muted-foreground">
                        <Building2 className="h-5 w-5" />
                        Belum ada fasilitas umum tercatat untuk jalan ini.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {roadFacilities.map((fac) => (
                          <div key={fac.id} className="flex items-center gap-3 rounded-full bg-card py-2 pl-2 pr-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-primary">
                              <Building2 className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold">{fac.name}</p>
                              <span className="inline-block rounded-full bg-sage px-2 py-0.5 text-[10px] font-bold text-forest">
                                {FACILITY_TYPE_LABEL[fac.type] ?? fac.type}
                              </span>
                            </div>
                            {fac.description && (
                              <p className="hidden max-w-[40%] truncate text-xs text-muted-foreground md:block">
                                {fac.description}
                              </p>
                            )}
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                onClick={() => openEditFacility(fac)}
                                aria-label="Edit fasilitas"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-forest transition-colors hover:bg-sage/70"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    aria-label="Hapus fasilitas"
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-sm rounded-[32px] p-8 text-center">
                                  <AlertDialogHeader className="items-center space-y-3 text-center sm:text-center">
                                    <AlertDialogTitle className="text-2xl font-extrabold text-destructive">Hapus Fasilitas?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-center">
                                      Hapus <strong>{fac.name}</strong> dari {road.name}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="mt-2 grid grid-cols-2 gap-3 sm:space-x-0">
                                    <AlertDialogCancel className="mt-0 h-12 rounded-full border-[1.5px] border-forest font-bold text-forest">
                                      Batal
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteFacility(fac.id)}
                                      className="h-12 rounded-full bg-destructive font-bold text-white hover:bg-destructive/90"
                                    >
                                      Ya, Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Dialog Jalan ── */}
      <Dialog open={roadDialog.open} onOpenChange={(o) => setRoadDialog((s) => ({ ...s, open: o }))}>
        <DialogContent className="rounded-[32px] p-7 sm:max-w-lg [&>button]:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <RouteIcon className="h-5 w-5" />
            </span>
            <DialogTitle className="flex-1 text-2xl font-extrabold text-forest dark:text-foreground">
              {roadDialog.editing ? "Edit Data Jalan" : "Tambah Jalan Baru"}
            </DialogTitle>
            <button
              onClick={() => setRoadDialog({ open: false, editing: null })}
              aria-label="Tutup"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-forest hover:bg-sage/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <DialogDescription className="sr-only">Form data jalan</DialogDescription>

          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Nama Jalan <span className="text-destructive">*</span></label>
              <Input placeholder="Contoh: Jalan Cipto Mangunkusumo" value={roadForm.name} onChange={(e) => setRoadForm({ ...roadForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-bold">Kelurahan</label>
                <Input placeholder="Contoh: Pamulang Barat" value={roadForm.kelurahan ?? ""} onChange={(e) => setRoadForm({ ...roadForm, kelurahan: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold">Kecamatan</label>
                <Input placeholder="Contoh: Pamulang" value={roadForm.kecamatan ?? ""} onChange={(e) => setRoadForm({ ...roadForm, kecamatan: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-bold">Panjang (m)</label>
                <Input type="number" placeholder="Contoh: 1250" value={roadForm.length_m ?? ""} onChange={(e) => setRoadForm({ ...roadForm, length_m: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold">Kondisi</label>
                <Select value={roadForm.condition ?? ""} onValueChange={(v) => setRoadForm({ ...roadForm, condition: v as Road["condition"] })}>
                  <SelectTrigger><SelectValue placeholder="Pilih kondisi…" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => setRoadDialog({ open: false, editing: null })}
              className={`${pillBtn} border-[1.5px] border-forest text-forest hover:bg-sage`}
            >
              Batal
            </button>
            <button onClick={saveRoad} className={`${pillBtn} bg-primary text-primary-foreground`}>
              {roadDialog.editing ? "Simpan Perubahan" : "Simpan"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Fasilitas ── */}
      <Dialog open={facilityDialog.open} onOpenChange={(o) => setFacilityDialog((s) => ({ ...s, open: o }))}>
        <DialogContent className="rounded-[32px] p-7 sm:max-w-lg [&>button]:hidden">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <DialogTitle className="flex-1 text-2xl font-extrabold text-forest dark:text-foreground">
              {facilityDialog.editing ? "Edit Fasilitas" : "Tambah Fasilitas Umum"}
            </DialogTitle>
            <button
              onClick={() => setFacilityDialog({ open: false, editing: null, roadId: null })}
              aria-label="Tutup"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-forest hover:bg-sage/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <DialogDescription className="sr-only">Form fasilitas umum</DialogDescription>

          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Nama Fasilitas <span className="text-destructive">*</span></label>
              <Input placeholder="Contoh: Halte Cipto 1" value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Jenis Fasilitas</label>
              <Select value={facilityForm.type} onValueChange={(v) => setFacilityForm({ ...facilityForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FACILITY_TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold">Keterangan</label>
              <Input placeholder="Opsional…" value={facilityForm.description ?? ""} onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => setFacilityDialog({ open: false, editing: null, roadId: null })}
              className={`${pillBtn} border-[1.5px] border-forest text-forest hover:bg-sage`}
            >
              Batal
            </button>
            <button onClick={saveFacility} className={`${pillBtn} bg-primary text-primary-foreground`}>
              {facilityDialog.editing ? "Simpan" : "Tambah"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}