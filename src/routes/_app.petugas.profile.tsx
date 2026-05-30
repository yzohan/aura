import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  User, Mail, Phone, MapPin, Camera, Save, Loader2, Globe, ShieldAlert 
} from "lucide-react";

export const Route = createFileRoute("/_app/petugas/profile")({
  head: () => ({ meta: [{ title: "Profil Saya - AURA" }] }),
  component: PetugasProfilePage,
});

function PetugasProfilePage() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (fullName || user?.email || "PT")
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
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("reports")
        .getPublicUrl(filePath);

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
      toast.success("Profil Anda berhasil diperbarui!");
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal memperbarui profil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profil Petugas</h2>
        <p className="text-muted-foreground text-sm">
          Kelola informasi data diri, foto profil, dan info kontak operasional lapangan Anda.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column */}
        <Card className="p-6 flex flex-col items-center text-center border border-border shadow-sm">
          <div className="relative group mb-4">
            <Avatar className="h-32 w-32 border-4 border-background shadow-md bg-secondary/50">
              <AvatarImage src={previewUrl || profile?.resolved_avatar_url || avatarUrl} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-4xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-full cursor-pointer shadow-md transition-all duration-200">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input 
                type="file" 
                accept="image/*" 
                className="sr-only" 
                onChange={handleFileUpload} 
                disabled={uploading || saving}
              />
            </label>
          </div>
          
          <h3 className="font-bold text-lg">{fullName || "Petugas Lapangan"}</h3>
          <p className="text-xs font-mono text-muted-foreground flex items-center gap-1 mt-1 justify-center">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Petugas Lapangan
          </p>
          <div className="w-full border-t border-border/60 my-4" />
          <div className="w-full text-left space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0 text-primary/70" />
              <span className="truncate">{user?.email}</span>
            </div>
            {phone && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary/70" />
                <span>{phone}</span>
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
                <span className="line-clamp-2">{address}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column Form */}
        <Card className="p-6 md:col-span-2 border border-border shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border pb-2 mb-4">Data Diri & Kontak</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email Akun (Tidak dapat diubah)</Label>
              <Input 
                id="email" 
                value={user?.email || ""} 
                disabled 
                className="bg-secondary/40 text-muted-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="full-name">Nama Lengkap</Label>
              <Input 
                id="full-name" 
                placeholder="Nama Lengkap Petugas" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input 
                id="phone" 
                placeholder="Contoh: 08123456789" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea 
                id="address" 
                placeholder="Alamat domisili atau tugas..." 
                className="resize-none"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid gap-2 border-t border-border pt-4 mt-2">
              <Label htmlFor="avatar-url" className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-primary" />
                Link Foto URL (Alternatif)
              </Label>
              <Input 
                id="avatar-url" 
                placeholder="https://example.com/path-to-photo.jpg" 
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Anda bisa mengunggah file langsung menggunakan ikon kamera di profil, atau menempelkan tautan URL gambar secara manual.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving || uploading} className="gap-2 font-semibold">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
