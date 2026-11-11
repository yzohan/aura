import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowRight, Camera, Link2, Loader2, Lock } from "lucide-react";
import { ROLE_LABEL } from "@/lib/auth";
import roadImg from "@/assets/pamulang_road.jpg";

export const Route = createFileRoute("/_app/admin/profile")({
  head: () => ({ meta: [{ title: "Profil Admin - AURA" }] }),
  component: AdminProfilePage,
});

const labelCls = "text-xs font-bold text-forest dark:text-foreground";

function AdminProfilePage() {
  const { user, profile, role, refreshProfile, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setAvatarUrl(profile.avatar_url || "");
      setPreviewUrl("");
    }
  }, [profile]);

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  const initials = (fullName || user?.email || "AD")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("reports").getPublicUrl(filePath);

      if (data?.publicUrl) {
        setAvatarUrl(data.publicUrl);
        setPreviewUrl(URL.createObjectURL(file));
        toast.success("Foto profil berhasil diunggah! Jangan lupa klik Simpan Perubahan.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal mengunggah foto: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName.trim()) {
      toast.error("Nama lengkap tidak boleh kosong.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profil berhasil diperbarui!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal memperbarui profil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-forest md:text-4xl dark:text-foreground">
          Profil Pengguna
        </h2>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">
          Kelola biodata dan foto profil akun admin Anda agar tetap akurat dan mudah dikenali petugas.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_1.9fr]">
        {/* Kartu foto */}
        <div className="overflow-hidden rounded-[32px] bg-card shadow-soft">
          <div className="relative h-36 bg-forest">
            <img src={roadImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
          </div>
          <div className="-mt-16 flex flex-col items-center px-6 pb-8 text-center">
            <Avatar className="h-32 w-32 border-[6px] border-card shadow-md">
              <AvatarImage src={previewUrl || profile?.resolved_avatar_url || avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-primary text-4xl font-extrabold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <label className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-forest px-5 text-sm font-bold text-forest transition-colors hover:bg-sage dark:border-foreground dark:text-foreground">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Ganti foto
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload} disabled={uploading || saving} />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">Maks 2MB, hanya gambar</p>

            <div className="my-5 w-full border-t border-border/60" />

            <h3 className="text-2xl font-extrabold text-forest dark:text-foreground">{fullName || "Admin Dinas"}</h3>
            <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-forest px-4 py-1.5 text-xs font-bold text-white">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {role ? ROLE_LABEL[role] : "Admin Dinas"}
            </span>
          </div>
        </div>

        {/* Form biodata */}
        <form onSubmit={handleSave} className="rounded-[32px] bg-card p-6 shadow-soft md:p-8">
          <h3 className="text-2xl font-extrabold text-forest dark:text-foreground">Biodata Diri</h3>
          <p className="mt-1 text-sm text-muted-foreground">Perbarui informasi kontak yang tampil pada akun Anda.</p>

          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="email" className={labelCls}>Email Akun</label>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> tidak dapat diubah
                </span>
              </div>
              <Input id="email" value={user?.email || ""} disabled className="opacity-70" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="full-name" className={labelCls}>Nama Lengkap</label>
              <Input id="full-name" placeholder="Nama Lengkap Admin" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className={labelCls}>Nomor Telepon</label>
              <Input id="phone" placeholder="Contoh: 08123456789" value={phone}
                onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className={labelCls}>Alamat Lengkap</label>
              <Textarea id="address" placeholder="Alamat lengkap instansi atau domisili…" rows={4}
                className="resize-none" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="avatar-url" className={labelCls}>Link Foto</label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="avatar-url" placeholder="https://example.com/foto.jpg" className="pl-11"
                  value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Bisa unggah langsung lewat tombol "Ganti foto", atau tempel tautan gambar di sini.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center border-t border-border/60 pt-6">
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex h-12 items-center gap-3 rounded-full bg-primary pl-7 pr-1.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan Perubahan"}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}