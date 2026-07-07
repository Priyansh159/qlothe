import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const tee = await db.product.create({
    data: {
      slug: "vintage-bull-oversized-tee",
      name: "Vintage Bull Oversized Tee",
      description: "240 GSM heavyweight cotton, boxy fit, vintage longhorn print.",
      category: "oversized-tees",
      basePrice: 79900, // ₹799
      attributes: { fabric: "100% cotton", gsm: 240, fit: "oversized" },
      images: { create: [{ cloudinaryPublicId: "qlothe/bull-tee-front", sortOrder: 0 }] },
      variants: {
        create: ["S", "M", "L", "XL"].flatMap((size) =>
          ["Black", "Off-White"].map((color) => ({
            sku: `QLO-TEE-BULL-${color.slice(0, 3).toUpperCase()}-${size}`,
            size, color, stock: 25,
          }))
        ),
      },
    },
  });
  await db.coupon.create({
    data: { code: "LAUNCH10", type: "PERCENT", value: 10, minOrder: 49900, maxUses: 100 },
  });
  console.log("Seeded:", tee.slug);
}

main().finally(() => db.$disconnect());
