import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] animate-qfade items-center justify-center px-5 py-16">
      <div className="max-w-[420px] text-center">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[.16em] text-forest/50">
          404 — off the plate
        </div>
        <h1 className="mb-3 font-serif text-[34px] font-semibold uppercase leading-none text-forest">
          Print not found
        </h1>
        <p className="mb-7 text-[14.5px] leading-relaxed text-ink/60">
          This page never made it to the press. The collection, however, is very real.
        </p>
        <Link
          href="/products"
          className="inline-flex h-[52px] items-center rounded-full bg-forest px-[30px] text-[15px] font-bold text-white hover:bg-pine"
        >
          Browse the collection
        </Link>
      </div>
    </div>
  );
}
