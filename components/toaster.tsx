"use client";

import { useStore } from "@/components/store-provider";

export function Toaster() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex w-[calc(100%-32px)] max-w-[400px] -translate-x-1/2 flex-col items-center gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full animate-qslideup items-center gap-3 rounded-[14px] px-[18px] py-[13px] text-[13.5px] font-semibold shadow-[0_8px_24px_rgba(6,64,43,.18)] ${
            t.type === "error" ? "border-[1.5px] border-forest bg-white text-forest" : "bg-forest text-white"
          }`}
        >
          <span
            className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold text-white ${
              t.type === "error" ? "bg-forest" : "bg-white/20"
            }`}
          >
            {t.type === "error" ? "!" : "✓"}
          </span>
          <span className="flex-1">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
