// Cloudinary delivery URLs. The cloud name is read server-side (layout) and
// passed down as a prop/context value — it is not a secret (it appears in
// every image URL), but env access stays server-only per project rules.

export function productImageUrl(
  cloudName: string | null | undefined,
  publicId: string | null | undefined,
  width = 800,
): string | null {
  if (!cloudName || !publicId) return null;
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,c_fill,g_auto,w_${width}/${publicId}`;
}
