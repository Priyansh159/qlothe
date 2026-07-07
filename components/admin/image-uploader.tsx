"use client";

import { useRef, useState } from "react";
import { ProductImage } from "@/components/product-image";
import { productImageUrl } from "@/lib/images";

export type ImageEntry = { id?: string; cloudinaryPublicId: string; sortOrder: number };

/**
 * Signed direct-to-Cloudinary upload: we fetch a signature from
 * /api/admin/uploads/sign (server-only secret, never touches the browser),
 * then POST the file straight to Cloudinary. Only the resulting public_id
 * is stored on the product — matches lib/cloudinary.ts's contract.
 */
export function ImageUploader({
  cloudName,
  images,
  onChange,
}: {
  cloudName: string | null;
  images: ImageEntry[];
  onChange: (next: ImageEntry[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/admin/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!signRes.ok) throw new Error("Could not sign upload");
      const sig = await signRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) throw new Error("Upload to Cloudinary failed");
      const uploaded = await uploadRes.json();

      onChange([...images, { cloudinaryPublicId: uploaded.public_id, sortOrder: images.length }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, sortOrder: i })));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...images];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next.map((img, i) => ({ ...img, sortOrder: i })));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => (
          <div key={img.cloudinaryPublicId + idx} className="relative h-24 w-20 flex-none overflow-hidden rounded-lg border border-forest/15 bg-paper">
            <ProductImage
              src={productImageUrl(cloudName, img.cloudinaryPublicId, 200)}
              alt=""
              className="absolute inset-0 h-full w-full"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
              aria-label="Remove"
            >
              ✕
            </button>
            <div className="absolute bottom-1 left-1 right-1 flex justify-between">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => move(idx, -1)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                disabled={idx === images.length - 1}
                onClick={() => move(idx, 1)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        ))}
        <label className="flex h-24 w-20 flex-none cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-forest/25 text-forest hover:border-forest">
          <span className="text-xl">{uploading ? "…" : "+"}</span>
          <span className="text-[10px] font-semibold uppercase">{uploading ? "Uploading" : "Add photo"}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      </div>
      {error ? <div className="mt-2 text-xs font-semibold text-red-700">{error}</div> : null}
    </div>
  );
}
