import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  ArrowRight, Bell, Globe, Loader2, Shield, SlidersHorizontal, Tag,
} from "lucide-react";

export const Route = createFileRoute("/_app/admin/settings")({
  head: () => ({ meta: [{ title: "Pengaturan Sistem" }] }),
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

type TabKey = "general" | "security" | "notifications" | "categories";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "general", label: "Umum", icon: SlidersHorizontal },
  { key: "security", label: "Keamanan", icon: Shield },
  { key: "notifications", label: "Notifikasi", icon: Bell },
  { key: "categories", label: "Kategori", icon: Tag },
];

const labelCls = "text-xs font-bold text-forest dark:text-foreground";

function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("general");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("aura_system_settings");
      if (raw) {
        const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        setSettings(merged);
        setSaved(merged);
      }
    } catch (e) {
      console.error("Gagal membaca pengaturan dari localStorage", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Simulasi penulisan database / server delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      localStorage.setItem("aura_system_settings", JSON.stringify(settings));
      setSaved(settings);
      toast.success("Pengaturan berhasil disimpan ke sistem!");
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  const card = "rounded-[32px] bg-card p-6 shadow-soft md:p-8";

  return (
    <div className="space-y-6">
      <div className="px-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-forest md:text-4xl dark:text-foreground">
          Pengaturan Sistem
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Atur identitas aplikasi, kebijakan penggunaan, saluran notifikasi, dan kategori kerusakan yang aktif di AURA.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid items-start gap-6 lg:grid-cols-[250px_1fr]">
          {/* Menu tab */}
          <div className="rounded-[28px] bg-card p-2 shadow-soft">
            <div className="flex gap-1 overflow-x-auto lg:flex-col">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`flex shrink-0 items-center gap-3 rounded-full py-2 pl-2 pr-5 text-sm font-bold transition-colors ${
                      active ? "bg-forest text-white" : "text-forest hover:bg-sage-soft dark:text-foreground"
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-sage text-forest"}`}>
                      <t.icon className="h-4 w-4" />
                    </span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {/* UMUM */}
            {tab === "general" && (
              <div className={card}>
                <h3 className="text-2xl font-extrabold text-forest dark:text-foreground">Informasi dan Akses Umum</h3>
                <p className="mt-1 text-sm text-muted-foreground">Identitas aplikasi dan aturan dasar akses perangkat petugas.</p>

                <div className="mt-6 space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="appName" className={labelCls}>Nama Aplikasi / Instansi</label>
                    <Input id="appName" value={settings.appName}
                      onChange={(e) => updateField("appName", e.target.value)}
                      placeholder="Contoh: AURA - Dinas PUPR Tangerang Selatan" required />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="appUrl" className={labelCls}>Domain Aplikasi</label>
                    <div className="relative">
                      <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="appUrl" className="pl-11" value={settings.appUrl}
                        onChange={(e) => updateField("appUrl", e.target.value)}
                        placeholder="aura-tangsel.id" required />
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-5">
                    <ToggleRow
                      title="Wajibkan GPS Perangkat"
                      desc="Warga dan petugas harus mengaktifkan lokasi GPS agar koordinat laporan tercatat akurat sebelum dapat dikirim."
                      checked={settings.requireGps}
                      onChange={(v) => updateField("requireGps", v)}
                    />
                  </div>
                  <div className="border-t border-border/60 pt-5">
                    <ToggleRow
                      title="Distribusi Tugas Otomatis (Auto-Assign)"
                      desc="Laporan baru otomatis ditugaskan ke petugas terdekat yang tersedia berdasarkan lokasi dan beban kerja saat ini."
                      checked={settings.enableAutoAssign}
                      onChange={(v) => updateField("enableAutoAssign", v)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* KEAMANAN */}
            {tab === "security" && (
              <div className={card}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tab Keamanan</p>
                <h3 className="text-2xl font-extrabold text-forest dark:text-foreground">Batas Penggunaan dan Kebijakan Anti-Spam</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mencegah penyalahgunaan pelaporan atau pengiriman laporan palsu berkali-kali.
                </p>

                <div className="mt-6 space-y-6">
                  <SliderRow
                    id="maxReports" label="Maks. Laporan Harian Per Perangkat (IP)"
                    min={1} max={10} value={settings.maxReportsPerDay}
                    onChange={(v) => updateField("maxReportsPerDay", v)}
                  />
                  <SliderRow
                    id="cooldown" label="Masa Reset Kuota IP (Jam)"
                    min={1} max={72} value={settings.ipCooldownPeriod}
                    onChange={(v) => updateField("ipCooldownPeriod", v)}
                  />
                  <SliderRow
                    id="spamThreshold" label="Pendeteksi Duplikasi Judul (%)"
                    min={50} max={100} value={settings.spamThreshold}
                    onChange={(v) => updateField("spamThreshold", v)}
                  />
                </div>
              </div>
            )}

            {/* NOTIFIKASI */}
            {tab === "notifications" && (
              <div className={card}>
                <h3 className="text-2xl font-extrabold text-forest dark:text-foreground">Notifikasi Dinas dan Saluran Eksternal</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Atur saluran komunikasi dinas untuk pemberitahuan instan saat ada laporan baru.
                </p>

                <div className="mt-6 space-y-5">
                  <ToggleRow
                    title="Notifikasi Email Dinas"
                    desc="Kirim log laporan baru ke kotak masuk admin utama."
                    checked={settings.notifyEmail}
                    onChange={(v) => updateField("notifyEmail", v)}
                  />
                  {settings.notifyEmail && (
                    <div className="space-y-1.5 border-l-2 border-primary/50 pl-4">
                      <label htmlFor="adminEmail" className={labelCls}>Alamat Email Dinas</label>
                      <Input id="adminEmail" type="email" value={settings.adminEmail}
                        onChange={(e) => updateField("adminEmail", e.target.value)}
                        placeholder="admin@dinas.aura.go.id" required={settings.notifyEmail} />
                    </div>
                  )}

                  <div className="border-t border-border/60 pt-5">
                    <ToggleRow
                      title="Integrasi Telegram Bot"
                      desc="Kirim ringkasan koordinat dan foto ke grup koordinasi lapangan di Telegram."
                      checked={settings.notifyTelegram}
                      onChange={(v) => updateField("notifyTelegram", v)}
                    />
                  </div>
                  {settings.notifyTelegram && (
                    <div className="space-y-4 border-l-2 border-primary/50 pl-4">
                      <div className="space-y-1.5">
                        <label htmlFor="tgToken" className={labelCls}>Bot API Token</label>
                        <Input id="tgToken" type="password" value={settings.telegramToken}
                          onChange={(e) => updateField("telegramToken", e.target.value)}
                          placeholder="1234567890:ABCdefGhIJKlmNoPQRsT…" required={settings.notifyTelegram} />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="tgChat" className={labelCls}>Chat ID / ID Grup</label>
                        <Input id="tgChat" value={settings.telegramChatId}
                          onChange={(e) => updateField("telegramChatId", e.target.value)}
                          placeholder="-100XXXXXXXXXX" required={settings.notifyTelegram} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* KATEGORI */}
            {tab === "categories" && (
              <div className={card}>
                <h3 className="text-2xl font-extrabold text-forest dark:text-foreground">Kategori Kerusakan Aktif</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pilih kategori yang terbuka bagi pelaporan warga. Kategori non-aktif tidak muncul di form warga.
                </p>
                <div className="mt-6">
                  <ToggleRow
                    title="Jalan Berlubang"
                    desc="Meliputi lubang jalan, jalan retak, bergelombang, atau ambles."
                    checked={settings.catJalan}
                    onChange={(v) => updateField("catJalan", v)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bar simpan */}
        <div className="sticky bottom-4 z-20 mx-auto flex w-fit max-w-full items-center gap-4 rounded-full bg-card py-2 pl-6 pr-2 shadow-elev">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${dirty ? "bg-warning" : "bg-success"}`} />
            {dirty ? "Perubahan belum disimpan ke sistem" : "Semua perubahan sudah tersimpan"}
          </span>
          <button
            type="submit"
            disabled={saving || !dirty}
            className="inline-flex h-11 items-center gap-3 rounded-full bg-primary pl-6 pr-1.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Simpan Pengaturan"}
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleRow({
  title, desc, checked, onChange,
}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="max-w-xl">
        <p className="text-sm font-extrabold text-forest dark:text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0 data-[state=checked]:bg-primary"
      />
    </div>
  );
}

function SliderRow({
  id, label, min, max, value, onChange,
}: { id: string; label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_1.4fr_auto] md:gap-6">
      <label htmlFor={id} className="text-sm font-extrabold text-forest dark:text-foreground">{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="h-2 w-full cursor-pointer accent-primary"
      />
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value);
          onChange(Number.isNaN(n) ? min : Math.min(max, Math.max(min, n)));
        }}
        className="h-11 w-24 text-center font-bold"
      />
    </div>
  );
}