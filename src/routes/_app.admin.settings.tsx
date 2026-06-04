import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Save,
  Settings,
  ShieldAlert,
  Bell,
  Sliders,
  Loader2,
  Info,
  Building,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_app/admin/settings")({
  head: () => ({ meta: [{ title: "Pengaturan Sistem " }] }),
  component: AdminSettingsPage,
});

interface SystemSettings {
  appName: string;
  appUrl: string;
  requireGps: boolean;
  enableAutoAssign: boolean;
  maxReportsPerDay: number;
  ipCooldownPeriod: number;
  spamThreshold: number;
  notifyEmail: boolean;
  adminEmail: string;
  notifyTelegram: boolean;
  telegramToken: string;
  telegramChatId: string;
  catJalan: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  appName: "AURA - Citizen Reporting",
  appUrl: "https://aura-ai.aura-project.workers.dev",
  requireGps: true,
  enableAutoAssign: false,
  maxReportsPerDay: 3,
  ipCooldownPeriod: 24,
  spamThreshold: 80,
  notifyEmail: true,
  adminEmail: "admin@dinas.aura.go.id",
  notifyTelegram: false,
  telegramToken: "",
  telegramChatId: "",
  catJalan: true,
};

function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("aura_system_settings");
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error("Gagal membaca pengaturan dari localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Simulasi penulisan database / server delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      localStorage.setItem("aura_system_settings", JSON.stringify(settings));
      toast.success("Pengaturan berhasil disimpan ke sistem!");
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h2>
        <p className="text-muted-foreground text-sm">
          Konfigurasi perilaku aplikasi, kuota pelaporan, webhook notifikasi, dan kategori aktif.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Tabs defaultValue="general" className="w-full">
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <TabsList className="flex md:flex-col h-auto w-full md:w-64 gap-1 p-2 bg-sidebar border border-border rounded-xl shrink-0">
              <TabsTrigger value="general" className="w-full justify-start py-2.5 gap-2 cursor-pointer">
                <Building className="h-4 w-4" />
                Umum & Informasi
              </TabsTrigger>
              <TabsTrigger value="security" className="w-full justify-start py-2.5 gap-2 cursor-pointer">
                <ShieldAlert className="h-4 w-4" />
                Batas & Anti-Spam
              </TabsTrigger>
              <TabsTrigger value="notifications" className="w-full justify-start py-2.5 gap-2 cursor-pointer">
                <Bell className="h-4 w-4" />
                Notifikasi Otomatis
              </TabsTrigger>
              <TabsTrigger value="categories" className="w-full justify-start py-2.5 gap-2 cursor-pointer">
                <Sliders className="h-4 w-4" />
                Kategori Laporan
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 w-full space-y-6">
              <TabsContent value="general">
                <Card className="p-6 space-y-6 border border-border">
                  <div>
                    <h3 className="text-lg font-medium">Informasi & Akses Umum</h3>
                    <p className="text-xs text-muted-foreground">Sesuaikan identitas instansi dan aturan GPS default.</p>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="appName">Nama Aplikasi / Instansi</Label>
                      <Input
                        id="appName"
                        value={settings.appName}
                        onChange={(e) => updateField("appName", e.target.value)}
                        placeholder="Contoh: AURA - Pengaduan Kerusakan"
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">Digunakan pada nama website dan navigasi utama.</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="appUrl">Domain Aplikasi</Label>
                      <Input
                        id="appUrl"
                        value={settings.appUrl}
                        onChange={(e) => updateField("appUrl", e.target.value)}
                        placeholder="https://aura-ai.aura-project.workers.dev"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
                      <div className="space-y-0.5 max-w-[80%]">
                        <Label className="text-sm font-semibold">Wajibkan GPS Perangkat</Label>
                        <p className="text-xs text-muted-foreground">
                          Jika diaktifkan, warga tidak dapat mengirim laporan tanpa koordinat lokasi GPS asli dari perangkat.
                        </p>
                      </div>
                      <Switch
                        checked={settings.requireGps}
                        onCheckedChange={(checked) => updateField("requireGps", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/20">
                      <div className="space-y-0.5 max-w-[80%]">
                        <Label className="text-sm font-semibold">Distribusi Tugas Otomatis (Auto-Assign)</Label>
                        <p className="text-xs text-muted-foreground">
                          Secara otomatis membuat Work Order ke petugas lapangan terdekat ketika ada laporan baru masuk.
                        </p>
                      </div>
                      <Switch
                        checked={settings.enableAutoAssign}
                        onCheckedChange={(checked) => updateField("enableAutoAssign", checked)}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 2: BATAS & ANTI-SPAM */}
              <TabsContent value="security">
                <Card className="p-6 space-y-6 border border-border">
                  <div>
                    <h3 className="text-lg font-medium">Batas Penggunaan & Kebijakan Anti-Spam</h3>
                    <p className="text-xs text-muted-foreground">
                      Mencegah warga menyalahgunakan pelaporan atau mengirim laporan palsu berkali-kali.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="maxReports">Maks. Laporan Harian Per Perangkat (IP)</Label>
                      <Input
                        id="maxReports"
                        type="number"
                        min={1}
                        max={10}
                        value={settings.maxReportsPerDay}
                        onChange={(e) => updateField("maxReportsPerDay", parseInt(e.target.value) || 3)}
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Jumlah laporan maksimum yang dapat dikirim oleh satu alamat IP dalam 24 jam.
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="cooldown">Masa Reset Kuota IP (Jam)</Label>
                      <Input
                        id="cooldown"
                        type="number"
                        min={1}
                        max={72}
                        value={settings.ipCooldownPeriod}
                        onChange={(e) => updateField("ipCooldownPeriod", parseInt(e.target.value) || 24)}
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="spamThreshold">Pendeteksi Duplikasi Judul (%)</Label>
                      <Input
                        id="spamThreshold"
                        type="number"
                        min={50}
                        max={100}
                        value={settings.spamThreshold}
                        onChange={(e) => updateField("spamThreshold", parseInt(e.target.value) || 80)}
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Sistem memblokir laporan baru jika kemiripan kata dengan laporan aktif lain melebihi batas ini.
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* TAB 3: NOTIFIKASI */}
              <TabsContent value="notifications">
                <Card className="p-6 space-y-6 border border-border">
                  <div>
                    <h3 className="text-lg font-medium">Notifikasi Dinas & Saluran Eksternal</h3>
                    <p className="text-xs text-muted-foreground">
                      Atur saluran komunikasi dinas untuk pemberitahuan instan ketika ada laporan baru masuk.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-semibold text-sm">Notifikasi Email Dinas</Label>
                          <p className="text-xs text-muted-foreground">Kirim log laporan baru ke kotak masuk admin utama.</p>
                        </div>
                        <Switch
                          checked={settings.notifyEmail}
                          onCheckedChange={(checked) => updateField("notifyEmail", checked)}
                        />
                      </div>

                      {settings.notifyEmail && (
                        <div className="grid gap-2 pl-4 border-l-2 border-primary/20">
                          <Label htmlFor="adminEmail">Alamat Email Dinas</Label>
                          <Input
                            id="adminEmail"
                            type="email"
                            value={settings.adminEmail}
                            onChange={(e) => updateField("adminEmail", e.target.value)}
                            placeholder="admin@dinas.aura.go.id"
                            required={settings.notifyEmail}
                          />
                        </div>
                      )}
                    </div>

                    <hr className="border-border" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-semibold text-sm">Integrasi Telegram Bot</Label>
                          <p className="text-xs text-muted-foreground">
                            Kirim ringkasan koordinat & foto ke grup koordinasi lapangan di Telegram.
                          </p>
                        </div>
                        <Switch
                          checked={settings.notifyTelegram}
                          onCheckedChange={(checked) => updateField("notifyTelegram", checked)}
                        />
                      </div>

                      {settings.notifyTelegram && (
                        <div className="grid gap-4 pl-4 border-l-2 border-primary/20">
                          <div className="grid gap-2">
                            <Label htmlFor="tgToken">Bot API Token</Label>
                            <Input
                              id="tgToken"
                              type="password"
                              value={settings.telegramToken}
                              onChange={(e) => updateField("telegramToken", e.target.value)}
                              placeholder="1234567890:ABCdefGhIJKlmNoPQRsT..."
                              required={settings.notifyTelegram}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="tgChat">Chat ID / ID Grup</Label>
                            <Input
                              id="tgChat"
                              value={settings.telegramChatId}
                              onChange={(e) => updateField("telegramChatId", e.target.value)}
                              placeholder="-100XXXXXXXXXX"
                              required={settings.notifyTelegram}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="categories">
                <Card className="p-6 space-y-6 border border-border">
                  <div>
                    <h3 className="text-lg font-medium">Kategori Kerusakan Aktif</h3>
                    <p className="text-xs text-muted-foreground">
                      Pilih kategori infrastruktur yang terbuka bagi pelaporan warga. Kategori non-aktif tidak akan muncul di form warga.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-secondary/10 transition-colors">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold">Jalan Berlubang</Label>
                        <p className="text-xs text-muted-foreground">Meliputi lubang jalan, jalan retak, bergelombang, atau ambles.</p>
                      </div>
                      <Switch
                        checked={settings.catJalan}
                        onCheckedChange={(checked) => updateField("catJalan", checked)}
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* SAVE FLOATING OR BOTTOM ACTION */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-leaf-gradient text-primary-foreground shadow-soft hover:opacity-95 px-6 gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Tabs>
      </form>

      {/* INFO FOOTER */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-600 dark:text-blue-400">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-xs">Petunjuk Penggunaan</p>
          <p className="text-xs opacity-90 leading-relaxed">
            Perubahan pada pengaturan ini akan langsung memengaruhi UI form pengaduan warga secara real-time. Batasan
            laporan harian menggunakan alamat IP untuk menghalangi serangan spam tanpa mengharuskan warga membuat akun terlebih dahulu.
          </p>
        </div>
      </div>
    </div>
  );
}
