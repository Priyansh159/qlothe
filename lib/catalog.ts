// Storefront category config. `slug` must match Product.category values in
// the database (free-form string on the Product model).
export const CATEGORIES = [
  { slug: "oversized-tees", name: "Oversized" },
  { slug: "classic-tees", name: "Classic" },
  { slug: "polo-tees", name: "Polo T-Shirt" },
] as const;

export function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug.replace(/-/g, " ");
}

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

// Swatch hexes for known variant colours; unknown colours fall back to grey.
const COLOR_HEX: Record<string, string> = {
  black: "#1A1A16",
  charcoal: "#1A1A16",
  "off-white": "#F4F4F2",
  bone: "#F4F4F2",
  white: "#FFFFFF",
  butter: "#FDF6DC",
  forest: "#06402B",
  green: "#06402B",
  navy: "#1F2A44",
  olive: "#5B5B3C",
  sand: "#D9CBB0",
  brown: "#5C4633",
  maroon: "#5E1F2A",
  grey: "#8A8A85",
  gray: "#8A8A85",
};

export function colorHex(name: string): string {
  return COLOR_HEX[name.trim().toLowerCase()] ?? "#B5B5B0";
}

export function isLightColor(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}
