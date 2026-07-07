const MESSAGES = [
  "Free shipping over ₹999",
  "7-day easy returns",
  "240 GSM heavyweight cotton",
  "Water-based inks",
  "Cash on delivery",
  "Made in India",
];

function Strip({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="inline-flex flex-none items-center" aria-hidden={ariaHidden || undefined}>
      {MESSAGES.map((m, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-[22px] px-[22px] py-[9px] font-mono text-[11px] uppercase tracking-[.14em] text-white/80"
        >
          {m}
          <span className="text-white/35">✦</span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="overflow-hidden whitespace-nowrap bg-forest">
      <div className="inline-flex animate-qmarquee will-change-transform">
        <Strip />
        <Strip ariaHidden />
      </div>
    </div>
  );
}
