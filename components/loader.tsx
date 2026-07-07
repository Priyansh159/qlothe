const LETTERS = ["Q", "L", "O", "T", "H", "E"];

const SIZES = {
  sm: "text-lg tracking-[.14em]",
  md: "text-2xl tracking-[.16em]",
  lg: "text-4xl tracking-[.18em]",
} as const;

/**
 * The brand loader: QLOTHE letters rise from just below the baseline one
 * after another (Q, then L, then O…) on a loop. Pure CSS — safe to server-
 * render inside loading.tsx files. Replaces every circular spinner.
 */
export function QlotheLoader({
  size = "md",
  tone = "forest",
  label = "Loading",
}: {
  size?: keyof typeof SIZES;
  tone?: "forest" | "white";
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex select-none font-serif font-bold uppercase ${SIZES[size]} ${
        tone === "white" ? "text-white" : "text-forest"
      }`}
    >
      {LETTERS.map((l, i) => (
        <span key={i} aria-hidden className="qloader-letter" style={{ animationDelay: `${i * 0.11}s` }}>
          {l}
        </span>
      ))}
    </span>
  );
}

/** Full-area centred loader for page-level loading states. */
export function PageLoader({ minH = "60vh" }: { minH?: string }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: minH }}>
      <QlotheLoader size="lg" />
    </div>
  );
}
