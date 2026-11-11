// Data Administratif Resmi Kota Tangerang Selatan (7 Kecamatan, 54 Kelurahan)
// Sumber: Bappeda & Peraturan Daerah Pembentukan Kota Tangerang Selatan

export interface KelurahanData {
  code: string;
  name: string;
  center: [number, number]; // [lat, lng]
}

export interface KecamatanData {
  id: string;
  name: string;
  shortName: string;
  code: string;
  color: string;      // Warna utama (hex) sesuai peta administrasi Bappeda
  bgLight: string;    // Warna background badge
  textColor: string;  // Warna teks kontras
  center: [number, number]; // [lat, lng]
  zoom: number;
  kelurahan: KelurahanData[];
  description?: string;
}

export const TANGSEL_KECAMATAN: Record<string, KecamatanData> = {
  "serpong-utara": {
    id: "serpong-utara",
    name: "Kecamatan Serpong Utara",
    shortName: "Serpong Utara",
    code: "I.A",
    color: "#0284c7",     // Biru Muda (Sky Blue)
    bgLight: "#e0f2fe",
    textColor: "#0369a1",
    center: [-6.2425, 106.6625],
    zoom: 13,
    description: "Kawasan utara berbatasan dengan Kota Tangerang (Alam Sutera, dsb.)",
    kelurahan: [
      { code: "I.A.1", name: "Pakulonan", center: [-6.2365, 106.6492] },
      { code: "I.A.2", name: "Paku Jaya", center: [-6.2372, 106.6811] },
      { code: "I.A.3", name: "Pondok Jagung Timur", center: [-6.2468, 106.6689] },
      { code: "I.A.4", name: "Pakualam", center: [-6.2332, 106.6578] },
      { code: "I.A.5", name: "Pondok Jagung", center: [-6.2554, 106.6598] },
      { code: "I.A.6", name: "Jelupang", center: [-6.2642, 106.6715] },
      { code: "I.A.7", name: "Lengkong Karya", center: [-6.2736, 106.6642] },
    ],
  },
  "pondok-aren": {
    id: "pondok-aren",
    name: "Kecamatan Pondok Aren",
    shortName: "Pondok Aren",
    code: "I.B",
    color: "#16a34a",     // Hijau Muda (Emerald/Green)
    bgLight: "#dcfce7",
    textColor: "#15803d",
    center: [-6.2652, 106.7058],
    zoom: 13,
    description: "Kawasan timur laut berbatasan dengan Jakarta Selatan (Bintaro Jaya, dsb.)",
    kelurahan: [
      { code: "I.B.1", name: "Pondok Betung", center: [-6.2698, 106.7441] },
      { code: "I.B.2", name: "Pondok Karya", center: [-6.2682, 106.7328] },
      { code: "I.B.3", name: "Jurangmangu Timur", center: [-6.2675, 106.7212] },
      { code: "I.B.4", name: "Jurangmangu Barat", center: [-6.2625, 106.7118] },
      { code: "I.B.5", name: "Pondok Aren", center: [-6.2605, 106.6995] },
      { code: "I.B.6", name: "Pondok Kacang Timur", center: [-6.2498, 106.6992] },
      { code: "I.B.7", name: "Pondok Kacang Barat", center: [-6.2442, 106.6895] },
      { code: "I.B.8", name: "Perigi Baru", center: [-6.2721, 106.6922] },
      { code: "I.B.9", name: "Perigi Lama", center: [-6.2798, 106.7025] },
      { code: "I.B.10", name: "Pondok Pucung", center: [-6.2875, 106.7042] },
      { code: "I.B.11", name: "Pondok Jaya", center: [-6.2762, 106.7188] },
    ],
  },
  "ciputat-timur": {
    id: "ciputat-timur",
    name: "Kecamatan Ciputat Timur",
    shortName: "Ciputat Timur",
    code: "I.C",
    color: "#db2777",     // Pink / Magenta Soft
    bgLight: "#fce7f3",
    textColor: "#be185d",
    center: [-6.3055, 106.7562],
    zoom: 13,
    description: "Kawasan timur berbatasan langsung dengan Jakarta Selatan (Lebak Bulus)",
    kelurahan: [
      { code: "I.C.1", name: "Pondok Ranji", center: [-6.2895, 106.7392] },
      { code: "I.C.2", name: "Rempoa", center: [-6.2925, 106.7621] },
      { code: "I.C.3", name: "Rengas", center: [-6.2995, 106.7568] },
      { code: "I.C.4", name: "Cempaka Putih", center: [-6.3112, 106.7512] },
      { code: "I.C.5", name: "Cireundeu", center: [-6.3168, 106.7682] },
      { code: "I.C.6", name: "Pisangan", center: [-6.3262, 106.7548] },
    ],
  },
  "ciputat": {
    id: "ciputat",
    name: "Kecamatan Ciputat",
    shortName: "Ciputat",
    code: "I.D",
    color: "#ea580c",     // Oranye / Peach Soft
    bgLight: "#ffedd5",
    textColor: "#c2410c",
    center: [-6.3115, 106.7235],
    zoom: 13,
    description: "Pusat perkotaan tradisional Tangerang Selatan",
    kelurahan: [
      { code: "I.D.1", name: "Jombang", center: [-6.2982, 106.7082] },
      { code: "I.D.2", name: "Serua", center: [-6.3195, 106.7058] },
      { code: "I.D.3", name: "Serua Indah", center: [-6.3142, 106.7168] },
      { code: "I.D.4", name: "Sawah Baru", center: [-6.2965, 106.7245] },
      { code: "I.D.5", name: "Sawah", center: [-6.3065, 106.7325] },
      { code: "I.D.6", name: "Ciputat", center: [-6.3242, 106.7268] },
      { code: "I.D.7", name: "Cipayung", center: [-6.3352, 106.7342] },
    ],
  },
  "serpong": {
    id: "serpong",
    name: "Kecamatan Serpong",
    shortName: "Serpong",
    code: "I.E",
    color: "#6366f1",     // Biru Indigo / Ungu Muda
    bgLight: "#e0e7ff",
    textColor: "#4338ca",
    center: [-6.3182, 106.6715],
    zoom: 13,
    description: "Kawasan pusat BSD City, perkantoran & permukiman modern",
    kelurahan: [
      { code: "I.E.1", name: "Lengkong Wetan", center: [-6.2842, 106.6632] },
      { code: "I.E.2", name: "Lengkong Gudang", center: [-6.2975, 106.6668] },
      { code: "I.E.3", name: "Lengkong Gudang Timur", center: [-6.2995, 106.6812] },
      { code: "I.E.4", name: "Rawa Mekar Jaya", center: [-6.3092, 106.6845] },
      { code: "I.E.5", name: "Rawa Buntu", center: [-6.3155, 106.6728] },
      { code: "I.E.6", name: "Cilenggang", center: [-6.3072, 106.6625] },
      { code: "I.E.7", name: "Ciater", center: [-6.3268, 106.6912] },
      { code: "I.E.8", name: "Serpong", center: [-6.3225, 106.6658] },
      { code: "I.E.9", name: "Buaran", center: [-6.3421, 106.6898] },
    ],
  },
  "pamulang": {
    id: "pamulang",
    name: "Kecamatan Pamulang",
    shortName: "Pamulang",
    code: "I.G",
    color: "#0d9488",     // Toska / Mint Hijau
    bgLight: "#ccfbf1",
    textColor: "#0f766e",
    center: [-6.3482, 106.7328],
    zoom: 13,
    description: "Kawasan selatan berbatasan dengan Kota Depok & Universitas Pamulang",
    kelurahan: [
      { code: "I.G.1", name: "Kedaung", center: [-6.3182, 106.7395] },
      { code: "I.G.2", name: "Bambu Apus", center: [-6.3312, 106.7212] },
      { code: "I.G.3", name: "Benda Baru", center: [-6.3385, 106.7115] },
      { code: "I.G.4", name: "Pondok Benda", center: [-6.3498, 106.7128] },
      { code: "I.G.5", name: "Pamulang Barat", center: [-6.3465, 106.7325] },
      { code: "I.G.6", name: "Pamulang Timur", center: [-6.3532, 106.7442] },
      { code: "I.G.7", name: "Pondok Cabe Udik", center: [-6.3582, 106.7582] },
      { code: "I.G.8", name: "Pondok Cabe Ilir", center: [-6.3412, 106.7645] },
    ],
  },
  "setu": {
    id: "setu",
    name: "Kecamatan Setu",
    shortName: "Setu",
    code: "I.F",
    color: "#ca8a04",     // Kuning / Emas Pastel
    bgLight: "#fef9c3",
    textColor: "#a16207",
    center: [-6.3495, 106.6725],
    zoom: 13,
    description: "Kawasan barat daya berbatasan dengan Kabupaten Bogor (kawasan riset Puspiptek)",
    kelurahan: [
      { code: "I.F.1", name: "Keranggan", center: [-6.3542, 106.6542] },
      { code: "I.F.2", name: "Kademangan", center: [-6.3412, 106.6625] },
      { code: "I.F.3", name: "Muncul", center: [-6.3598, 106.6685] },
      { code: "I.F.4", name: "Setu", center: [-6.3512, 106.6782] },
      { code: "I.F.5", name: "Babakan", center: [-6.3592, 106.6912] },
      { code: "I.F.6", name: "Bakti Jaya", center: [-6.3585, 106.7025] },
    ],
  },
};

export const KECAMATAN_LIST: KecamatanData[] = Object.values(TANGSEL_KECAMATAN);

// Total kelurahan se-Tangsel
export const ALL_KELURAHAN_LIST = KECAMATAN_LIST.flatMap((kec) =>
  kec.kelurahan.map((kel) => ({
    ...kel,
    kecamatanId: kec.id,
    kecamatanName: kec.name,
    kecamatanShort: kec.shortName,
    kecamatanColor: kec.color,
  }))
);

// Helper mencari Kecamatan berdasarkan nama atau koordinat
export function findKecamatanByCoords(lat: number, lng: number): KecamatanData {
  let closest = KECAMATAN_LIST[0];
  let minDistance = Infinity;

  for (const kec of KECAMATAN_LIST) {
    const d = Math.hypot(kec.center[0] - lat, kec.center[1] - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = kec;
    }
  }

  return closest;
}

// Helper mencari Kelurahan terdekat dari koordinat
export function findNearestKelurahan(lat: number, lng: number) {
  let closest = ALL_KELURAHAN_LIST[0];
  let minDistance = Infinity;

  for (const kel of ALL_KELURAHAN_LIST) {
    const d = Math.hypot(kel.center[0] - lat, kel.center[1] - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = kel;
    }
  }

  return closest;
}
