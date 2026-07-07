import Link from "next/link";
import { listProducts } from "@/services/products";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { BrandIntro } from "@/components/brand-intro";
import { Reveal } from "@/components/reveal";
import { productImageUrl } from "@/lib/images";
import { inr } from "@/lib/format";
import { CATEGORIES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Server-rendered staggered letter rise for display type (pure CSS animation). */
function RiseText({ text, base = 0.1, step = 0.035 }: { text: string; base?: number; step?: number }) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <span key={i} className="qintro-letter" style={{ animationDelay: `${base + i * step}s` }}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </>
  );
}

const PROCESS = [
  {
    n: "01",
    title: "Engrave",
    body: "Every graphic starts as a single hand-drawn plate — hatched line by line the way ledger engravers worked a century ago.",
  },
  {
    n: "02",
    title: "Pull",
    body: "One plate, one impression. Water-based inks pulled by hand onto 240 GSM combed cotton, never rushed through a heat tunnel.",
  },
  {
    n: "03",
    title: "Cure",
    body: "Garment-dyed and pre-shrunk, so your size stays your size and the print softens into the fabric instead of sitting on top.",
  },
];

const BIG_MARQUEE = ["QLOTHE", "HERITAGE PRINT SHOP", "EST. BOMBAY", "VOL. 01"];

function BigMarqueeStrip({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="inline-flex flex-none items-baseline" aria-hidden={ariaHidden || undefined}>
      {BIG_MARQUEE.map((m, i) => (
        <span key={i} className="inline-flex items-baseline gap-8 px-8">
          <span className="font-serif text-[9vw] font-semibold uppercase leading-none tracking-[.02em] text-forest/[.09] md:text-7xl">
            {m}
          </span>
          <span className="text-2xl text-forest/[.12]">✦</span>
        </span>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? null;
  const { items: arrivals } = await listProducts({ sort: "new", page: 1, perPage: 4 });
  const hero = arrivals[0] ?? null;

  return (
    <div className="animate-qfade">
      <BrandIntro />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b border-forest/15 bg-white">
        {/* engraving watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-24 z-[1] h-[85%] w-auto opacity-[.05]"
        />
        <div className="relative z-[2] mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-8 px-[18px] pb-11 pt-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] md:gap-11 md:px-12 md:pb-[68px] md:pt-16">
          <div className="relative z-[2]">
            <div className="mb-6 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-forest/30 px-[13px] py-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[.14em] text-forest">
              <span className="h-[5px] w-[5px] flex-none animate-pulse rounded-full bg-forest" /> Vol. 01 — The
              Engraving Drop
            </div>
            <h1 className="mb-[22px] font-serif text-[52px] font-semibold uppercase leading-[.92] tracking-[-.01em] text-forest md:text-[clamp(56px,7vw,88px)]">
              <RiseText text="Wear the" base={0.15} />
              <br />
              <RiseText text="engraving" base={0.5} />
            </h1>
            <p className="mb-[30px] max-w-[400px] text-[15.5px] leading-[1.65] text-ink/70">
              Premium vintage-weight tees, cut and printed like a heritage label. Considered
              graphics, honest cotton, made for the long run.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="group flex h-[54px] items-center gap-2 rounded-full bg-forest px-[30px] text-[15.5px] font-bold tracking-[.01em] text-white transition-colors hover:bg-pine"
              >
                Shop the collection
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#story"
                className="px-1.5 text-[13px] font-bold uppercase tracking-[.08em] text-forest underline underline-offset-[5px] hover:opacity-60"
              >
                Our story
              </a>
            </div>
            {/* trust row */}
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-2 border-t border-forest/10 pt-5">
              {["240 GSM cotton", "7-day returns", "COD available"].map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[.12em] text-forest/60"
                >
                  <span className="h-1 w-1 rounded-full bg-forest/40" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="group relative aspect-square overflow-hidden border border-forest/15 bg-paper md:aspect-[4/4.4]">
            <ProductImage
              src={hero ? productImageUrl(cloudName, hero.image, 1000) : null}
              alt={hero?.name ?? "Featured tee"}
              label="Drop hero product photo"
              className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-forest/45 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-forest/60 to-transparent" />
            {hero ? (
              <>
                <div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[.14em] text-white">
                  {hero.name}
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-2.5">
                  <span className="font-serif text-[22px] font-bold text-white">{inr(hero.price)}</span>
                  <Link
                    href={`/products/${hero.slug}`}
                    className="flex h-10 items-center rounded-full border-[1.5px] border-white bg-white/15 px-[18px] text-[11px] font-bold uppercase tracking-[.08em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-forest"
                  >
                    View
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============ NEW ARRIVALS ============ */}
      <section className="mx-auto w-full max-w-[1200px] px-[18px] py-8 md:px-12 md:py-[54px]">
        <Reveal>
          <div className="mb-[26px] flex items-end justify-between gap-4 border-b border-forest/15 pb-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="m-0 font-serif text-[23px] font-semibold uppercase tracking-[.005em] text-forest md:text-[30px]">
                New arrivals
              </h2>
              <span className="font-mono text-[11px] tracking-[.12em] text-forest/50">
                / {String(arrivals.length).padStart(2, "0")}
              </span>
            </div>
            <Link
              href="/products?sort=new"
              className="whitespace-nowrap text-xs font-bold uppercase tracking-[.08em] text-forest underline underline-offset-4 hover:opacity-60"
            >
              View all
            </Link>
          </div>
        </Reveal>
        {arrivals.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/50">
            The first drop is at the press. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-[26px]">
            {arrivals.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <ProductCard product={p} cloudName={cloudName} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ============ SHOP BY CUT ============ */}
      <section className="mx-auto w-full max-w-[1200px] px-[18px] pb-8 md:px-12 md:pb-[54px]">
        <Reveal>
          <div className="mb-[22px] flex items-baseline gap-3 border-b border-forest/15 pb-4">
            <h2 className="m-0 font-serif text-[23px] font-semibold uppercase tracking-[.005em] text-forest md:text-[30px]">
              Shop by cut
            </h2>
            <span className="font-mono text-[11px] tracking-[.12em] text-forest/50">
              / {String(CATEGORIES.length).padStart(2, "0")}
            </span>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-5">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.slug} delay={i * 90}>
              <Link
                href={`/products?category=${c.slug}`}
                className="group relative flex min-h-[200px] flex-col justify-between overflow-hidden border border-forest/15 bg-paper p-[18px] transition-colors hover:border-forest md:min-h-[260px] md:p-6"
              >
                {/* engraving backdrop */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 -right-8 z-0 h-[85%] w-auto opacity-[.14] transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-forest/70 via-forest/15 to-forest/35" />
                <div className="relative z-[2] flex items-start justify-between">
                  <span className="font-mono text-[10.5px] tracking-[.14em] text-white/75">
                    THE {c.name.toUpperCase()} CUT
                  </span>
                  <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-white/55 text-[15px] text-white transition-all group-hover:border-white group-hover:bg-white group-hover:text-forest">
                    →
                  </span>
                </div>
                <div className="relative z-[2]">
                  <span className="font-serif text-[clamp(28px,4vw,40px)] font-bold uppercase leading-[.95] tracking-[.005em] text-white">
                    {c.name}
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ THE PROCESS ============ */}
      <section className="border-t border-forest/15 bg-paper/60">
        <div className="mx-auto w-full max-w-[1200px] px-[18px] py-10 md:px-12 md:py-[64px]">
          <Reveal>
            <div className="mb-8 flex items-baseline gap-3 md:mb-10">
              <h2 className="m-0 font-serif text-[23px] font-semibold uppercase tracking-[.005em] text-forest md:text-[30px]">
                One plate, one impression
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {PROCESS.map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <div className="group h-full border border-forest/15 bg-white p-6 transition-colors hover:border-forest md:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-[11px] tracking-[.16em] text-forest/45">/ {s.n}</span>
                    <span className="h-px w-10 bg-forest/20 transition-all group-hover:w-16 group-hover:bg-forest/50" />
                  </div>
                  <div className="mb-2.5 font-serif text-[22px] font-semibold text-forest">{s.title}</div>
                  <p className="m-0 text-[13.5px] leading-[1.7] text-ink/65">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BRAND STORY ============ */}
      <section id="story" className="relative overflow-hidden bg-forest text-white">
        {/* white engraving watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-10 z-[1] h-[120%] w-auto opacity-[.08]"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <div className="relative z-[2] mx-auto w-full max-w-[1200px] px-[18px] py-12 md:px-12 md:py-[72px]">
          <Reveal>
            <div className="mb-[18px] font-mono text-[11px] uppercase tracking-[.16em] text-white/55">
              The QLOTHE way
            </div>
            <p className="mb-[26px] max-w-[760px] font-serif text-[clamp(26px,5vw,42px)] font-medium leading-[1.25]">
              We print like an old engraving house — one plate, one impression, made to be worn until
              the ink softens and the story sets in.
            </p>
            <div className="flex flex-wrap gap-x-10 gap-y-3.5">
              {[
                ["240 GSM", "combed cotton"],
                ["Water-based", "soft-hand inks"],
                ["7-day", "easy returns"],
              ].map(([big, small]) => (
                <div key={big} className="flex flex-col gap-0.5">
                  <span className="font-serif text-2xl font-semibold">{big}</span>
                  <span className="text-[13px] text-white/55">{small}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ BIG SERIF MARQUEE ============ */}
      <div className="overflow-hidden whitespace-nowrap border-b border-forest/10 bg-white py-6 md:py-8">
        <div className="inline-flex animate-qmarquee will-change-transform">
          <BigMarqueeStrip />
          <BigMarqueeStrip ariaHidden />
        </div>
      </div>
    </div>
  );
}
