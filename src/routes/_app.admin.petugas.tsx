import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2, Search, MapPin, Phone, UserCog, CheckCircle2,
  Pencil, UserPlus, Camera, ArrowRight, X, Zap, ClipboardList, Smartphone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import roadImg from "@/assets/ciputat_road.jpg";

export const Route = createFileRoute("/_app/admin/petugas")({
  head: () => ({ meta: [{ title: "Kelola Petugas" }] }),
  component: AdminPetugasPage,
});

interface PetugasProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  stats: {
    total: number;
    completed: number;
    pending: number;
  };
}

const getTempSupabase = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// Ubah path/URL storage "reports" jadi signed URL (berlaku 1 tahun)
async function resolveAvatarUrl(avatar: string | null): Promise<string | null> {
  if (!avatar) return avatar;
  let path = avatar;
  let isStoragePath = false;
  if (avatar.startsWith("http")) {
    const marker = "/storage/v1/object/public/reports/";
    const index = avatar.indexOf(marker);
    if (index !== -1) {
      path = avatar.substring(index + marker.length);
      isStoragePath = true;
    }
  } else {
    isStoragePath = true;
  }
  if (!isStoragePath) return avatar;
  try {
    const { data } = await supabase.storage.from("reports").createSignedUrl(path, 31536000);
    if (data?.signedUrl) return data.signedUrl;
  } catch (e) {
    console.error("Gagal membuat signed URL:", e);
  }
  return avatar;
}

const labelCls = "text-sm font-bold";
const pillBtn =
  "inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-opacity hover:opacity-90";

function AdminPetugasPage() {
  const { user } = useAuth();
  const [petugasList, setPetugasList] = useState<PetugasProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // State for edit form
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", address: "", avatar_url: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // State for Add Petugas modal
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", email: "", password: "", phone: "", address: "" });
  const [isAdding, setIsAdding] = useState(false);

  const fetchPetugas = async () => {
    setLoading(true);

    const { data: roles, error: rErr } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "petugas");

    if (rErr) {
      toast.error(rErr.message);
      setLoading(false);
      return;
    }

    if (!roles || roles.length === 0) {
      setPetugasList([]);
      setLoading(false);
      return;
    }

    const userIds = roles.map((r) => r.user_id);

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .in("id", userIds)
      .order("full_name");

    if (pErr) {
      toast.error(pErr.message);
      setLoading(false);
      return;
    }

    const { data: workOrders, error: wErr } = await supabase
      .from("work_orders")
      .select("assigned_to, completed_at")
      .in("assigned_to", userIds);

    if (wErr) {
      console.error("Gagal mengambil data tugas:", wErr);
    }

    const combined: PetugasProfile[] = await Promise.all(
      profiles.map(async (p) => {
        const pWorkOrders = workOrders?.filter((w) => w.assigned_to === p.id) || [];
        const completed = pWorkOrders.filter((w) => w.completed_at !== null).length;
        const avatar = await resolveAvatarUrl(p.avatar_url);

        return {
          ...(p as any),
          avatar_url: avatar,
          stats: {
            total: pWorkOrders.length,
            completed,
            pending: pWorkOrders.length - completed,
          },
        };
      })
    );

    setPetugasList(combined);
    if (combined.length > 0 && !activeId) setActiveId(combined[0].id);
    setLoading(false);
  };

  useEffect(() => {
    fetchPetugas();

    // Realtime: jaga daftar tetap segar
    const channel = supabase
      .channel("admin-petugas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchPetugas();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        fetchPetugas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isAddDialogOpen) {
      setAddForm({ full_name: "", email: "", password: "", phone: "", address: "" });
    }
  }, [isAddDialogOpen]);

  const filteredPetugas = petugasList.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const activePetugas = petugasList.find((p) => p.id === activeId);

  // Isi form edit saat petugas aktif / dialog berubah
  useEffect(() => {
    if (activePetugas) {
      setEditForm({
        full_name: activePetugas.full_name || "",
        phone: activePetugas.phone || "",
        address: activePetugas.address || "",
        avatar_url: activePetugas.avatar_url || "",
      });
    }
  }, [activePetugas, isEditDialogOpen]);

  const handleSaveBiodata = async () => {
    if (!activePetugas) return;

    if (!editForm.full_name.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    setIsSaving(true);

    const updates = {
      full_name: editForm.full_name.trim(),
      phone: editForm.phone || null,
      address: editForm.address || null,
      avatar_url: editForm.avatar_url || null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", activePetugas.id);

    if (error) {
      toast.error("Gagal menyimpan data: " + error.message);
    } else {
      toast.success("Biodata petugas berhasil diperbarui!");
      const resolvedAvatar = await resolveAvatarUrl(updates.avatar_url);

      setPetugasList((prev) =>
        prev.map((p) =>
          p.id === activePetugas.id ? { ...p, ...updates, avatar_url: resolvedAvatar } : p
        )
      );
      setIsEditDialogOpen(false);
    }
    setIsSaving(false);
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePetugas) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const uploaderId = user?.id || activePetugas.id;
      const filePath = `${uploaderId}/petugas-${activePetugas.id}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("reports")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("reports").getPublicUrl(filePath);

      if (data?.publicUrl) {
        setEditForm((prev) => ({ ...prev, avatar_url: data.publicUrl }));
        toast.success("Foto profil berhasil diunggah! Ingat untuk klik Simpan Perubahan.");
      }
    } catch (err: any) {
      toast.error("Gagal mengunggah gambar: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePetugas = async () => {
    if (!addForm.full_name.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }
    if (!addForm.email.trim()) {
      toast.error("Email wajib diisi.");
      return;
    }
    if (addForm.password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    setIsAdding(true);

    const tempSupabase = getTempSupabase();

    // 1. Sign up user di Supabase Auth (admin tidak ter-logout karena persistSession: false)
    const { data: signUpData, error: signUpErr } = await tempSupabase.auth.signUp({
      email: addForm.email.trim(),
      password: addForm.password,
      options: {
        data: {
          full_name: addForm.full_name.trim(),
          phone: addForm.phone.trim() || null,
        },
      },
    });

    if (signUpErr || !signUpData.user) {
      toast.error("Gagal mendaftarkan akun autentikasi petugas: " + (signUpErr?.message || "User tidak terbentuk"));
      setIsAdding(false);
      return;
    }

    const newUserId = signUpData.user.id;

    // 2. Update phone & address pada profile yang otomatis terbentuk
    const { error: profileUpdateErr } = await supabase
      .from("profiles")
      .update({
        phone: addForm.phone.trim() || null,
        address: addForm.address.trim() || null,
      })
      .eq("id", newUserId);

    if (profileUpdateErr) {
      // Fallback upsert jika trigger profile belum selesai
      await supabase
        .from("profiles")
        .upsert({
          id: newUserId,
          full_name: addForm.full_name.trim(),
          phone: addForm.phone.trim() || null,
          address: addForm.address.trim() || null,
        });
    }

    // 3. Tetapkan role 'petugas'
    const { error: roleErr } = await supabase
      .from("user_roles")
      .insert({
        user_id: newUserId,
        role: "petugas",
      });

    if (roleErr) {
      toast.error("Gagal menetapkan peran petugas: " + roleErr.message);
      setIsAdding(false);
      return;
    }

    toast.success("Petugas baru berhasil ditugaskan!");
    setIsAddDialogOpen(false);
    fetchPetugas();
    setIsAdding(false);
  };

  const ratio = activePetugas && activePetugas.stats.total > 0
    ? Math.round((activePetugas.stats.completed / activePetugas.stats.total) * 1000) / 10
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 px-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-forest md:text-4xl dark:text-foreground">
            Kelola Petugas
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Pantau penugasan, kontak, dan kinerja petugas lapangan di seluruh kelurahan Tangerang Selatan.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama petugas…"
              className="pl-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Dialog tambah petugas */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex h-12 shrink-0 items-center justify-between gap-3 rounded-full bg-primary pl-6 pr-1.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">
                Tugaskan Petugas Baru
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-primary">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] p-7 sm:max-w-lg [&>button]:hidden">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <UserPlus className="h-5 w-5" />
                </span>
                <DialogTitle className="flex-1 text-2xl font-extrabold text-forest dark:text-foreground">
                  Tugaskan Petugas Baru
                </DialogTitle>
                <DialogClose asChild>
                  <button aria-label="Tutup" className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-forest hover:bg-sage/70">
                    <X className="h-4 w-4" />
                  </button>
                </DialogClose>
              </div>
              <DialogDescription className="sr-only">Form petugas baru</DialogDescription>

              <div className="mt-2 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <label htmlFor="add-name" className={labelCls}>Nama Lengkap</label>
                  <Input id="add-name" placeholder="Contoh: Mas Rusdi" value={addForm.full_name}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, full_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="add-email" className={labelCls}>Email Login</label>
                  <Input id="add-email" type="email" placeholder="rusdi@aura.com" value={addForm.email}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="add-password" className={labelCls}>Password Login</label>
                  <Input id="add-password" type="password" placeholder="Minimal 6 karakter" value={addForm.password}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, password: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="add-phone" className={labelCls}>Nomor Telepon (Opsional)</label>
                  <Input id="add-phone" placeholder="08123456789" value={addForm.phone}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="add-address" className={labelCls}>Alamat Lengkap (Opsional)</label>
                  <Textarea id="add-address" placeholder="Jl. Raya No. 1…" className="resize-none" rows={3}
                    value={addForm.address}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <DialogClose asChild>
                  <button className={`${pillBtn} border-[1.5px] border-forest text-forest hover:bg-sage`}>Batal</button>
                </DialogClose>
                <button onClick={handleCreatePetugas} disabled={isAdding}
                  className={`${pillBtn} gap-2 bg-primary text-primary-foreground disabled:opacity-60`}>
                  {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
                  Tugaskan
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-forest" />
        </div>
      ) : filteredPetugas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-[32px] border-[1.5px] border-dashed border-forest-soft/40 bg-card py-16">
          <UserCog className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-lg font-extrabold">Tidak ada petugas</p>
            <p className="mt-1 text-sm text-muted-foreground">Belum ada data petugas yang cocok dengan pencarian.</p>
          </div>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
          {/* Daftar petugas */}
          <div className="rounded-[32px] bg-card p-5 shadow-soft">
            <h3 className="px-1 text-lg font-extrabold text-forest dark:text-foreground">
              Daftar Petugas ({filteredPetugas.length})
            </h3>
            <div className="mt-4 grid max-h-[620px] gap-2 overflow-y-auto pr-1">
              {filteredPetugas.map((petugas) => {
                const active = activeId === petugas.id;
                return (
                  <button
                    key={petugas.id}
                    onClick={() => setActiveId(petugas.id)}
                    className={`flex w-full items-center gap-3 rounded-full border-2 p-2 pr-4 text-left transition-colors ${
                      active
                        ? "border-primary bg-sage"
                        : "border-transparent hover:bg-sage-soft"
                    }`}
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={petugas.avatar_url || ""} className="object-cover" />
                      <AvatarFallback className="bg-sage text-sm font-bold text-forest">
                        {petugas.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{petugas.full_name}</p>
                      <p className="text-xs text-muted-foreground">{petugas.stats.total} Tugas</p>
                    </div>
                    {active && <span className="h-2.5 w-2.5 rounded-full bg-forest" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail petugas */}
          {activePetugas && (
            <div className="space-y-6">
              {/* Kartu profil */}
              <div className="overflow-hidden rounded-[32px] bg-card shadow-soft">
                <div className="relative h-44 bg-forest">
                  <img src={roadImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/50 to-transparent" />
                </div>

                <div className="relative px-6 pb-7 md:px-8">
                  <div className="-mt-14 flex flex-wrap items-end justify-between gap-3">
                    <Avatar className="h-28 w-28 border-[6px] border-card shadow-md">
                      <AvatarImage src={activePetugas.avatar_url || ""} className="object-cover" />
                      <AvatarFallback className="bg-primary text-3xl font-extrabold text-primary-foreground">
                        {activePetugas.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex gap-2">
                      {activePetugas.phone && (
                        <a
                          href={`tel:${activePetugas.phone}`}
                          className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-forest px-5 text-sm font-bold text-forest transition-colors hover:bg-sage dark:border-foreground dark:text-foreground"
                        >
                          <Smartphone className="h-4 w-4" /> Hubungi
                        </a>
                      )}

                      {/* Dialog edit biodata */}
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <button className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-forest px-5 text-sm font-bold text-forest transition-colors hover:bg-sage dark:border-foreground dark:text-foreground">
                            <Pencil className="h-4 w-4" /> Edit Biodata
                          </button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[32px] p-7 sm:max-w-lg [&>button]:hidden">
                          <div className="flex items-center gap-3">
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Pencil className="h-5 w-5" />
                            </span>
                            <DialogTitle className="flex-1 text-2xl font-extrabold text-forest dark:text-foreground">
                              Edit Biodata Petugas
                            </DialogTitle>
                            <DialogClose asChild>
                              <button aria-label="Tutup" className="flex h-10 w-10 items-center justify-center rounded-full bg-sage text-forest hover:bg-sage/70">
                                <X className="h-4 w-4" />
                              </button>
                            </DialogClose>
                          </div>
                          <DialogDescription className="sr-only">Form edit biodata petugas</DialogDescription>

                          <div className="mt-2 space-y-4">
                            <div className="space-y-1.5">
                              <label htmlFor="edit-name" className={labelCls}>Nama Lengkap</label>
                              <Input id="edit-name" placeholder="Contoh: Mas Rusdi" value={editForm.full_name}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))} required />
                            </div>

                            <div className="space-y-1.5">
                              <label className={`${labelCls} flex items-center justify-between`}>
                                <span>Foto Profil (unggah atau URL)</span>
                                {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              </label>
                              <div className="flex gap-2">
                                <label className="flex h-12 shrink-0 cursor-pointer select-none items-center gap-2 rounded-full bg-sage px-5 text-xs font-bold text-forest hover:bg-sage/70">
                                  <Camera className="h-4 w-4" />
                                  Pilih Gambar
                                  <input type="file" accept="image/*" className="sr-only"
                                    disabled={isUploading || isSaving} onChange={handleUploadAvatar} />
                                </label>
                                <Input id="avatar" placeholder="Atau tempel link foto…" value={editForm.avatar_url}
                                  disabled={isUploading}
                                  onChange={(e) => setEditForm((prev) => ({ ...prev, avatar_url: e.target.value }))} />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="phone" className={labelCls}>Nomor Telepon</label>
                              <Input id="phone" placeholder="08123456789" value={editForm.phone}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="address" className={labelCls}>Alamat Lengkap</label>
                              <Textarea id="address" placeholder="Jl. Merdeka No. 1…" className="resize-none" rows={3}
                                value={editForm.address}
                                onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <DialogClose asChild>
                              <button className={`${pillBtn} border-[1.5px] border-forest text-forest hover:bg-sage`}>Batal</button>
                            </DialogClose>
                            <button onClick={handleSaveBiodata} disabled={isSaving}
                              className={`${pillBtn} gap-2 bg-primary text-primary-foreground disabled:opacity-60`}>
                              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                              Simpan Perubahan
                            </button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
                      ID: {activePetugas.id.split("-")[0].toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-xs font-bold text-forest">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Terverifikasi
                    </span>
                  </div>

                  <h3 className="mt-3 text-3xl font-extrabold text-forest dark:text-foreground">{activePetugas.full_name}</h3>
                  <p className="text-sm text-muted-foreground">Petugas Lapangan</p>
                </div>
              </div>

              {/* Informasi kontak */}
              <div>
                <h3 className="mb-3 px-2 text-xl font-extrabold text-forest dark:text-foreground">Informasi Kontak</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <InfoCard icon={Phone} label="Nomor Telepon" value={activePetugas.phone || "Belum diatur"} />
                  <InfoCard icon={MapPin} label="Alamat Lengkap" value={activePetugas.address || "Belum diatur"} />
                  <InfoCard
                    icon={CheckCircle2}
                    label="Terdaftar Sejak"
                    value={new Date(activePetugas.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  />
                </div>
              </div>

              {/* Statistik kinerja */}
              <div>
                <h3 className="mb-3 px-2 text-xl font-extrabold text-forest dark:text-foreground">Statistik Kinerja</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[28px] bg-forest p-5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Tugas</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-primary">
                        <ClipboardList className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-6 text-5xl font-extrabold text-primary">{activePetugas.stats.total}</p>
                  </div>
                  <div className="rounded-[28px] bg-sage p-5 text-forest">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tugas Selesai</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-6 text-5xl font-extrabold">{activePetugas.stats.completed}</p>
                  </div>
                  <div className="rounded-[28px] bg-card p-5 text-forest shadow-soft dark:text-foreground">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sedang Dikerjakan</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Zap className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-6 text-5xl font-extrabold">{activePetugas.stats.pending}</p>
                  </div>
                </div>
              </div>

              {/* Tingkat penyelesaian */}
              <div className="rounded-[28px] bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-lg font-extrabold text-forest dark:text-foreground">Tingkat Penyelesaian</h4>
                  <span className="text-3xl font-extrabold text-forest dark:text-foreground">{ratio}%</span>
                </div>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-sage-soft">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ratio}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {activePetugas.stats.completed} dari {activePetugas.stats.total} tugas telah diselesaikan sejak terdaftar.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon, label, value,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="card-dashed p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-extrabold leading-relaxed text-forest dark:text-foreground">{value}</p>
    </div>
  );
}