"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[70vh] animate-qfade items-center justify-center px-5 py-16">
      <div className="max-w-[420px] text-center">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[.16em] text-forest/50">
          A smudged impression
        </div>
        <h1 className="mb-3 font-serif text-[34px] font-semibold uppercase leading-none text-forest">
          Something went wrong
        </h1>
        <p className="mb-7 text-[14.5px] leading-relaxed text-ink/60">
          The plate slipped mid-pull. Nothing was charged and nothing was lost — try that again.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="h-[52px] rounded-full bg-forest px-[30px] text-[15px] font-bold text-white hover:bg-pine"
          >
            Try again
          </button>
          <Link
            href="/"
            className="flex h-[52px] items-center rounded-full border-[1.5px] border-forest px-6 text-[15px] font-bold text-forest hover:bg-forest/5"
          >
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
