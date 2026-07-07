import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { NewsletterForm } from "@/components/newsletter-form";

const HELP_LINKS = ["Shipping & returns", "Size guide", "Track order", "Contact us"];
const COMPANY_LINKS = ["Our story", "Stores", "Sustainability", "Careers"];
const PAY_BADGES = ["UPI", "VISA", "Mastercard", "COD"];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest text-white">
      <div className="relative z-[2] mx-auto w-full max-w-[1200px] px-5 pb-8 pt-12 md:px-12 md:pt-[68px]">
        {/* brand masthead */}
        <div className="mb-10 flex flex-col items-center gap-2.5 border-b border-white/15 pb-9 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.png" alt="" className="block h-14 w-14 object-contain" />
          <span className="font-serif text-[30px] font-bold leading-none tracking-[.02em]">QLOTHE</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-white/45">
            Heritage Print Shop · Est. Bombay
          </span>
        </div>

        <div className="flex flex-col gap-10 md:flex-row md:justify-between md:gap-12">
          {/* newsletter */}
          <div className="max-w-[380px]">
            <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[.14em] text-white/45">
              The Newsletter
            </div>
            <p className="mb-[18px] text-[14.5px] leading-relaxed text-white/70">
              Join the press. First dibs on drops and restocks — no noise, ever.
            </p>
            <NewsletterForm />
          </div>

          {/* link columns */}
          <div className="flex flex-wrap gap-y-8 gap-x-11 md:gap-x-14">
            <div className="flex flex-col gap-[13px]">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[.14em] text-white/40">Shop</div>
              <Link href="/products?sort=new" className="text-sm text-white/80 hover:text-white">
                New &amp; Featured
              </Link>
              {CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/products?category=${c.slug}`}
                  className="text-sm text-white/80 hover:text-white"
                >
                  {c.name}
                </Link>
              ))}
              <Link href="/products" className="text-sm text-white/80 hover:text-white">
                Sale
              </Link>
            </div>
            <div className="flex flex-col gap-[13px]">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[.14em] text-white/40">Help</div>
              {HELP_LINKS.map((l) => (
                <span key={l} className="text-sm text-white/80">
                  {l}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-[13px]">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[.14em] text-white/40">Company</div>
              {COMPANY_LINKS.map((l) => (
                <span key={l} className="text-sm text-white/80">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-[22px] mt-11 h-px bg-white/15" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-white/40">
              We accept
            </span>
            <div className="flex flex-wrap gap-2">
              {PAY_BADGES.map((b) => (
                <span
                  key={b}
                  className="inline-flex h-[30px] items-center rounded-[7px] border border-white/25 px-3 text-[11px] font-bold tracking-[.04em] text-white/80"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="text-[12.5px] text-white/45">© 2026 QLOTHE · Made in India</div>
        </div>
      </div>
    </footer>
  );
}
