import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  MapPin, Building2, AlertTriangle, Search,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
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
  baik: "bg-success/15 text-success border-success/30",
  sedang: "bg-warning/15 text-warning-foreground border-warning/30",
  rusak_ringan: "bg-accent/15 text-accent border-accent/30",
  rusak_berat: "bg-destructive/15 text-destructive border-destructive/30",
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Kelola Data Jalan</h2>
          <p className="text-sm text-muted-foreground">
            Data jalan beserta fasilitas umum yang tersedia di setiap ruas jalan.
          </p>
        </div>
        <Button onClick={openAddRoad} className="shrink-0 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Tambah Jalan
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari nama jalan, kelurahan..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Roads list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredRoads.length === 0 ? (
        <Card className="flex h-40 items-center justify-center text-muted-foreground italic text-sm">
          Belum ada data jalan.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRoads.map((road) => {
            const roadFacilities = facilities.filter((f) => f.road_id === road.id);
            const isExpanded = expandedRoadId === road.id;

            return (
              <Card key={road.id} className="overflow-hidden border border-border shadow-soft">
                {/* ── Section 1: Data Jalan ── */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    onClick={() => setExpandedRoadId(isExpanded ? null : road.id)}
                  >
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
                      : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    }
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{road.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[road.kelurahan, road.kecamatan].filter(Boolean).join(", ") || "—"}
                        {road.length_m ? ` · ${road.length_m.toLocaleString("id-ID")} m` : ""}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {road.condition && (
                      <Badge variant="outline" className={`hidden sm:inline-flex text-xs ${CONDITION_TONE[road.condition]}`}>
                        {CONDITION_LABEL[road.condition]}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {roadFacilities.length} fasilitas
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRoad(road)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <div className="flex items-center gap-3 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertDialogTitle>Hapus Jalan?</AlertDialogTitle>
                          </div>
                          <AlertDialogDescription>
                            Menghapus <strong>{road.name}</strong> juga akan menghapus semua fasilitas umumnya ({roadFacilities.length} fasilitas). Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteRoad(road.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* ── Section 2: Fasilitas Umum (collapsible) ── */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/20">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium">Fasilitas Umum</span>
                        <span className="text-xs text-muted-foreground">di {road.name}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openAddFacility(road.id)} className="h-7 text-xs">
                        <Plus className="mr-1 h-3 w-3" /> Tambah
                      </Button>
                    </div>

                    {roadFacilities.length === 0 ? (
                      <p className="px-4 pb-4 text-sm text-muted-foreground italic">
                        Belum ada fasilitas umum tercatat untuk jalan ini.
                      </p>
                    ) : (
                      <div className="divide-y divide-border">
                        {roadFacilities.map((fac) => (
                          <div key={fac.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{fac.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {FACILITY_TYPE_LABEL[fac.type] ?? fac.type}
                                </Badge>
                                {fac.description && (
                                  <span className="text-xs text-muted-foreground truncate">{fac.description}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditFacility(fac)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Fasilitas?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Hapus <strong>{fac.name}</strong> dari {road.name}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteFacility(fac.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Hapus
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
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Road Dialog ── */}
      <Dialog open={roadDialog.open} onOpenChange={(o) => setRoadDialog((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{roadDialog.editing ? "Edit Data Jalan" : "Tambah Jalan Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Jalan <span className="text-destructive">*</span></label>
              <Input placeholder="Contoh: Jalan Cipto Mangunkusumo" value={roadForm.name} onChange={(e) => setRoadForm({ ...roadForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Kelurahan</label>
                <Input placeholder="Kelurahan" value={roadForm.kelurahan ?? ""} onChange={(e) => setRoadForm({ ...roadForm, kelurahan: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Kecamatan</label>
                <Input placeholder="Kecamatan" value={roadForm.kecamatan ?? ""} onChange={(e) => setRoadForm({ ...roadForm, kecamatan: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Panjang (meter)</label>
              <Input type="number" placeholder="Contoh: 1200" value={roadForm.length_m ?? ""} onChange={(e) => setRoadForm({ ...roadForm, length_m: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kondisi Jalan</label>
              <Select value={roadForm.condition ?? ""} onValueChange={(v) => setRoadForm({ ...roadForm, condition: v as Road["condition"] })}>
                <SelectTrigger><SelectValue placeholder="Pilih kondisi..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRoadDialog({ open: false, editing: null })}>Batal</Button>
            <Button onClick={saveRoad}>{roadDialog.editing ? "Simpan Perubahan" : "Tambah Jalan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Facility Dialog ── */}
      <Dialog open={facilityDialog.open} onOpenChange={(o) => setFacilityDialog((s) => ({ ...s, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{facilityDialog.editing ? "Edit Fasilitas" : "Tambah Fasilitas Umum"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Fasilitas <span className="text-destructive">*</span></label>
              <Input placeholder="Contoh: Halte Cipto 1" value={facilityForm.name} onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Jenis Fasilitas</label>
              <Select value={facilityForm.type} onValueChange={(v) => setFacilityForm({ ...facilityForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FACILITY_TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Keterangan</label>
              <Input placeholder="Opsional..." value={facilityForm.description ?? ""} onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFacilityDialog({ open: false, editing: null, roadId: null })}>Batal</Button>
            <Button onClick={saveFacility}>{facilityDialog.editing ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
