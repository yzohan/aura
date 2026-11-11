import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import potholeImg from "@/assets/pothole_road.jpg";
import pamulangImg from "@/assets/pamulang_road.jpg";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-10">
      <div className="relative overflow-hidden rounded-[36px] bg-forest">
        <div className="absolute inset-0 grid grid-cols-2">
          <img src={potholeImg} alt="" className="h-full w-full object-cover" />
          <img src={pamulangImg} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-forest/75" />
        <div className="relative flex flex-col items-center gap-4 px-6 py-16 text-center text-white md:py-24">
          <h2 className="max-w-2xl text-3xl font-extrabold text-balance md:text-5xl">Ada lubang di jalan dekat rumahmu?</h2>
          <p className="max-w-md text-white/85">Foto, kirim, dan lihat kapan petugas datang. Prosesnya hanya beberapa menit.</p>
          <Link
            to="/warga"
            className="mt-2 inline-flex h-12 items-center gap-3 rounded-full bg-primary pl-6 pr-1.5 text-sm font-bold text-primary-foreground"
          >
            Lapor Sekarang
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-primary">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}