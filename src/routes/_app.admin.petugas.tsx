import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, Search, MapPin, Phone, UserCog, Calendar, CheckCircle2, 
  ClipboardList, Clock, Edit2, Save, UserPlus, Camera 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
    }
  });
};

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

    const userIds = roles.map(r => r.user_id);

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
        const pWorkOrders = workOrders?.filter(w => w.assigned_to === p.id) || [];
        const completed = pWorkOrders.filter(w => w.completed_at !== null).length;

        let avatar = p.avatar_url;
        if (avatar) {
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
          if (isStoragePath) {
            try {
              const { data } = await supabase.storage
                .from("reports")
                .createSignedUrl(path, 31536000);
              if (data?.signedUrl) {
                avatar = data.signedUrl;
              }
            } catch (e) {
              console.error("Gagal membuat signed URL untuk petugas:", e);
            }
          }
        }

        return {
          ...(p as any),
          avatar_url: avatar,
          stats: {
            total: pWorkOrders.length,
            completed: completed,
            pending: pWorkOrders.length - completed,
          }
        };
      })
    );

    setPetugasList(combined);
    if (combined.length > 0 && !activeId) setActiveId(combined[0].id);
    setLoading(false);
  };

  useEffect(() => {
    fetchPetugas();

    // Subscribe to real-time updates for profiles and user_roles to automatically keep the list fresh
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

  const filteredPetugas = petugasList.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const activePetugas = petugasList.find(p => p.id === activeId);

  // Handle opening dialog
  useEffect(() => {
    if (activePetugas) {
      setEditForm({
        full_name: activePetugas.full_name || "",
        phone: activePetugas.phone || "",
        address: activePetugas.address || "",
        avatar_url: activePetugas.avatar_url || ""
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
      
      let resolvedAvatar = updates.avatar_url;
      if (resolvedAvatar) {
        let path = resolvedAvatar;
        let isStoragePath = false;
        if (resolvedAvatar.startsWith("http")) {
          const marker = "/storage/v1/object/public/reports/";
          const index = resolvedAvatar.indexOf(marker);
          if (index !== -1) {
            path = resolvedAvatar.substring(index + marker.length);
            isStoragePath = true;
          }
        } else {
          isStoragePath = true;
        }
        if (isStoragePath) {
          try {
            const { data } = await supabase.storage
              .from("reports")
              .createSignedUrl(path, 31536000);
            if (data?.signedUrl) {
              resolvedAvatar = data.signedUrl;
            }
          } catch (e) {
            console.error("Gagal membuat signed URL setelah simpan:", e);
          }
        }
      }

      setPetugasList(prev => prev.map(p => {
        if (p.id === activePetugas.id) {
          return { ...p, ...updates, avatar_url: resolvedAvatar };
        }
        return p;
      }));
      setIsEditDialogOpen(false);
    }
    setIsSaving(false);
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

    // 1. Sign up the user in Supabase Auth (does not sign out current admin because persistSession: false)
    const { data: signUpData, error: signUpErr } = await tempSupabase.auth.signUp({
      email: addForm.email.trim(),
      password: addForm.password,
      options: {
        data: {
          full_name: addForm.full_name.trim(),
          phone: addForm.phone.trim() || null,
        }
      }
    });

    if (signUpErr || !signUpData.user) {
      toast.error("Gagal mendaftarkan akun autentikasi petugas: " + (signUpErr?.message || "User tidak terbentuk"));
      setIsAdding(false);
      return;
    }

    const newUserId = signUpData.user.id;

    // 2. Try to update phone & address on the automatically generated profile
    const { error: profileUpdateErr } = await supabase
      .from("profiles")
      .update({
        phone: addForm.phone.trim() || null,
        address: addForm.address.trim() || null,
      })
      .eq("id", newUserId);

    if (profileUpdateErr) {
      // Fallback to upsert if profile trigger hasn't finished running yet
      await supabase
        .from("profiles")
        .upsert({
          id: newUserId,
          full_name: addForm.full_name.trim(),
          phone: addForm.phone.trim() || null,
          address: addForm.address.trim() || null,
        });
    }

    // 3. Assign role 'petugas' in user_roles table
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

  return (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0 border-b border-border/50 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Kelola Petugas
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manajemen biodata dan performa petugas lapangan aktif.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Cari nama petugas..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm font-semibold">
                <UserPlus className="h-4 w-4" />
                Tambah Petugas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Tugaskan Petugas Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid gap-2">
                  <Label htmlFor="add-name">Nama Lengkap</Label>
                  <Input 
                    id="add-name" 
                    placeholder="Contoh: Mas Rusdi" 
                    value={addForm.full_name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-email">Email Login</Label>
                  <Input 
                    id="add-email" 
                    type="email"
                    placeholder="RusdiImut@aura.com" 
                    value={addForm.email}
                    onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-password">Password Login</Label>
                  <Input 
                    id="add-password" 
                    type="password"
                    placeholder="Password minimal 6 karakter" 
                    value={addForm.password}
                    onChange={(e) => setAddForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-phone">Nomor Telepon (Opsional)</Label>
                  <Input 
                    id="add-phone" 
                    placeholder="08123456789" 
                    value={addForm.phone}
                    onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-address">Alamat Lengkap (Opsional)</Label>
                  <Textarea 
                    id="add-address" 
                    placeholder="Jl. Raya No. 1..." 
                    className="resize-none"
                    rows={3}
                    value={addForm.address}
                    onChange={(e) => setAddForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-border/50 pt-4">
                <DialogClose asChild>
                  <Button variant="ghost">Batal</Button>
                </DialogClose>
                <Button 
                  onClick={handleCreatePetugas} 
                  disabled={isAdding} 
                  className="gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Tugaskan Sebagai Petugas
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredPetugas.length === 0 ? (
        <Card className="flex flex-1 flex-col items-center justify-center border-dashed gap-4 rounded-xl py-16">
          <UserCog className="h-12 w-12 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-lg font-medium">Tidak ada petugas</p>
            <p className="text-sm text-muted-foreground mt-1">Belum ada data petugas yang cocok dengan pencarian.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT PANEL - LIST */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Daftar Petugas ({filteredPetugas.length})
            </div>
            <div className="grid gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPetugas.map((petugas) => (
                <button
                  key={petugas.id}
                  onClick={() => setActiveId(petugas.id)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                    activeId === petugas.id 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-card border-border hover:bg-secondary/45"
                  }`}
                >
                  <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                    <AvatarImage src={petugas.avatar_url || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {petugas.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{petugas.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {petugas.stats.total} Tugas
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL - BIODATA DETAILS */}
          {activePetugas && (
            <Card className="flex-1 overflow-hidden w-full flex flex-col shadow-sm border-border">
              {/* Cover Header */}
              <div className="h-32 bg-primary/10 relative shrink-0 border-b border-border/50">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 opacity-50" />
              </div>
              
              <div className="px-6 pb-6 lg:px-8 lg:pb-8 flex-1 flex flex-col relative">
                {/* Profile Picture Overlay */}
                <div className="flex justify-between items-end -mt-12 mb-5">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-sm bg-card">
                    <AvatarImage src={activePetugas.avatar_url || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                      {activePetugas.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-end gap-2 mb-2">
                    <Badge variant="outline" className="bg-background text-xs font-mono">
                      ID: {activePetugas.id.split("-")[0].toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1.5">{activePetugas.full_name}</h1>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                      <UserCog className="h-4 w-4 text-primary" /> Petugas Lapangan Aktif
                    </p>
                  </div>
                  
                  {/* Tombol Edit Biodata */}
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 shadow-sm shrink-0">
                        <Edit2 className="h-4 w-4" />
                        Edit Biodata
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Edit Biodata Petugas</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-name">Nama Lengkap</Label>
                          <Input 
                            id="edit-name" 
                            placeholder="Contoh: Mas Rusdi" 
                            value={editForm.full_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="flex items-center justify-between">
                            <span>Foto Profil (Unggah langsung atau URL)</span>
                            {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                          </Label>
                          <div className="flex gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-3 text-xs text-muted-foreground hover:border-primary/40 shrink-0 h-10 select-none items-center justify-center">
                              <Camera className="h-4 w-4 text-primary" />
                              <span>Pilih Gambar</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="sr-only"
                                disabled={isUploading || isSaving}
                                onChange={async (e) => {
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
                                      .upload(filePath, file, {
                                        cacheControl: "3600",
                                        upsert: true,
                                      });
                                    if (upErr) throw upErr;
                                    
                                    const { data } = supabase.storage
                                      .from("reports")
                                      .getPublicUrl(filePath);
                                      
                                    if (data?.publicUrl) {
                                      setEditForm(prev => ({ ...prev, avatar_url: data.publicUrl }));
                                      toast.success("Foto profil berhasil diunggah! Ingat untuk klik Simpan Perubahan.");
                                    }
                                  } catch (err: any) {
                                    toast.error("Gagal mengunggah gambar: " + err.message);
                                  } finally {
                                    setIsUploading(false);
                                  }
                                }}
                              />
                            </label>
                            <Input 
                              id="avatar" 
                              placeholder="Atau tempel Link Foto URL..." 
                              value={editForm.avatar_url}
                              disabled={isUploading}
                              onChange={(e) => setEditForm(prev => ({ ...prev, avatar_url: e.target.value }))}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">Pilih file gambar dari galeri Anda, atau tempel link foto di kolom samping.</p>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone">Nomor Telepon</Label>
                          <Input 
                            id="phone" 
                            placeholder="08123456789" 
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="address">Alamat Lengkap</Label>
                          <Textarea 
                            id="address" 
                            placeholder="Jl. Merdeka No. 1..." 
                            className="resize-none"
                            rows={3}
                            value={editForm.address}
                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <DialogClose asChild>
                          <Button variant="ghost">Batal</Button>
                        </DialogClose>
                        <Button onClick={handleSaveBiodata} disabled={isSaving} className="gap-2">
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Simpan Perubahan
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Grid Info & Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 border-t border-border/50 pt-6">
                  
                  {/* Biodata Kontak */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary/70 border-b pb-2 mb-4">Informasi Kontak</h3>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary rounded-md text-muted-foreground shrink-0 mt-0.5">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-0.5">Nomor Telepon</p>
                        <p className="text-sm font-medium">{activePetugas.phone || "Belum diatur"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary rounded-md text-muted-foreground shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-0.5">Alamat Lengkap</p>
                        <p className="text-sm font-medium leading-relaxed">{activePetugas.address || "Belum diatur"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary rounded-md text-muted-foreground shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-0.5">Terdaftar Sejak</p>
                        <p className="text-sm font-medium">
                          {new Date(activePetugas.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statistik Performa */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary/70 border-b pb-2 mb-4">Statistik Kinerja</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-card p-4 rounded-lg border flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-md shrink-0">
                            <ClipboardList className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground">Total Tugas</span>
                        </div>
                        <span className="text-xl font-bold">{activePetugas.stats.total}</span>
                      </div>

                      <div className="bg-card p-4 rounded-lg border flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-success/10 text-success rounded-md shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground">Tugas Selesai</span>
                        </div>
                        <span className="text-xl font-bold text-success">{activePetugas.stats.completed}</span>
                      </div>

                      <div className="bg-card p-4 rounded-lg border flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-warning/10 text-warning rounded-md shrink-0">
                            <Clock className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground">Sedang Dikerjakan</span>
                        </div>
                        <span className="text-xl font-bold text-warning">{activePetugas.stats.pending}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
