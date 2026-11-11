import { type ReactNode } from "react";

const TEETH = 13;
const zigzag = (() => {
  const w = 1440 / TEETH;
  let d = "M0 24 L0 14";
  for (let i = 0; i < TEETH; i++) d += ` L${(i * w + w / 2).toFixed(1)} 2 L${((i + 1) * w).toFixed(1)} 14`;
  return d + " L1440 24 Z";
})();

export function PageHero({
  pill, title, subtitle, image, children,
}: {
  pill?: string; title: string; subtitle?: string; image?: string; children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#3f5a4e] to-forest text-white">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />}
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 pb-28 pt-40 text-center md:pt-44">
        {pill && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-primary" /> {pill}
          </span>
        )}
        <h1 className="text-4xl font-extrabold leading-tight text-balance md:text-6xl">{title}</h1>
        {subtitle && <p className="max-w-xl text-base text-white/85 md:text-lg">{subtitle}</p>}
        {children}
      </div>
      <svg aria-hidden viewBox="0 0 1440 24" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[-1px] h-5 w-full fill-background">
        <path d={zigzag} />
      </svg>
    </section>
  );
}