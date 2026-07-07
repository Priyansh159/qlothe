import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, DM_Mono } from "next/font/google";
import { auth } from "@/lib/auth";
import { StoreProvider } from "@/components/store-provider";
import { Toaster } from "@/components/toaster";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: { default: "QLOTHE — Heritage Print Shop", template: "%s · QLOTHE" },
  description:
    "Premium vintage-weight tees, cut and printed like a heritage label. Considered graphics, honest cotton, made for the long run.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06402B",
};

// Chrome (marquee/header/footer/cart drawer) lives in app/(storefront)/layout.tsx
// so /admin can render its own dashboard shell instead. This root layout only
// owns html/body, fonts, and the two things every route needs: auth-derived
// user state and toasts.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user?.id
    ? { id: session.user.id, name: session.user.name ?? null, email: session.user.email ?? null }
    : null;

  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} ${dmMono.variable}`}>
      <body>
        <StoreProvider
          cloudName={process.env.CLOUDINARY_CLOUD_NAME ?? null}
          razorpayKeyId={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null}
          user={user}
        >
          {children}
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
