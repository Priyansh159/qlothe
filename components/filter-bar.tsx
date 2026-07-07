"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SIZES } from "@/lib/catalog";

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const activeSize = params.get("size") ?? "";
  const sort = params.get("sort") ?? "new";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // filters reset pagination
    router.replace(`/products?${next.toString()}`, { scroll: false });
  };

  const pill = (active: boolean) =>
    `flex min-h-[40px] min-w-[44px] items-center justify-center whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-semibold transition-all ${
      active
        ? "border-[1.5px] border-forest bg-forest text-white"
        : "border-[1.5px] border-forest/25 text-forest hover:border-forest"
    }`;

  return (
    <div className="sticky top-[58px] z-40 border-b border-forest/10 bg-white/90 backdrop-blur-[10px] md:top-[104px]">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3.5 px-4 py-3 md:px-12">
        <div className="no-scrollbar flex gap-2 overflow-x-auto p-0.5">
          <button onClick={() => setParam("size", null)} className={pill(!activeSize)}>
            All
          </button>
          {SIZES.map((s) => (
            <button key={s} onClick={() => setParam("size", s)} className={pill(activeSize === s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative ml-auto flex-none">
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="h-10 cursor-pointer appearance-none rounded-full border border-forest/25 bg-paper pl-4 pr-[38px] text-[13.5px] font-semibold text-forest"
          >
            <option value="new">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <span className="pointer-events-none absolute right-[15px] top-1/2 -translate-y-1/2 text-[11px] text-forest">
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}
