export const CATEGORY_LABEL = {
  jalan_berlubang: "Jalan Berlubang",
  trotoar_rusak: "Trotoar Rusak",
  pju_mati: "PJU Mati / Rusak",
} as const;

export const CATEGORY_ICON = {
  jalan_berlubang: "🕳️",
  trotoar_rusak: "🚶",
  pju_mati: "💡",
} as const;

export const STATUS_LABEL = {
  pending: "Menunggu Verifikasi",
  verified: "Terverifikasi",
  in_progress: "Dikerjakan",
  resolved: "Selesai",
  rejected: "Ditolak",
} as const;

export const STATUS_TONE: Record<keyof typeof STATUS_LABEL, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  verified: "bg-primary/10 text-primary border-primary/30",
  in_progress: "bg-accent/15 text-accent border-accent/30",
  resolved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

export const URGENCY_LABEL = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  critical: "Kritis",
} as const;

export const URGENCY_TONE: Record<keyof typeof URGENCY_LABEL, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning-foreground",
  high: "bg-accent/20 text-accent",
  critical: "bg-destructive/20 text-destructive",
};
