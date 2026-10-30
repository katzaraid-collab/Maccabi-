import type { Metadata, Viewport } from "next";
import { Anton, Heebo, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { RevealObserver } from "@/components/shell/RevealObserver";
import { TransitionRouter } from "@/components/shell/TransitionRouter";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { INDEXABLE, SITE_URL } from "@/lib/seo";
import "./globals.css";

const body = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-body", display: "swap" });
const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-latin-display", display: "swap" });
// Hebrew display voice: Karantina, a condensed poster face that reads like a
// stadium banner next to Anton. It sets small for its size, so it's scaled up.
const displayHe = localFont({
  src: "../assets/fonts/Karantina-Bold.ttf",
  weight: "700",
  variable: "--font-display-he",
  display: "swap",
  // Hebrew glyphs only: digits and Latin in headlines fall through to Anton.
  declarations: [
    { prop: "size-adjust", value: "128%" },
    { prop: "unicode-range", value: "U+0590-05FF, U+FB1D-FB4F, U+0020-002E, U+003A-0040" },
  ],
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono-face", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "מכבי תל אביב – החנות הרשמית", template: "%s · מכבי תל אביב" },
  description: "תלבושות המשחק של עונת 26/27, הדפסת שם ומספר, קולקציית 120 שנה, אופנה, ילדים ואביזרים – החנות הרשמית של מועדון הכדורגל מכבי תל אביב.",
  openGraph: { type: "website", locale: "he_IL", siteName: "מכבי תל אביב – החנות הרשמית" },
  robots: INDEXABLE ? undefined : { index: false, follow: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#000e62" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={`${body.variable} ${display.variable} ${displayHe.variable} ${mono.variable}`}>
      <head>
        {/* Mark JS as available before first paint so reveal animations never hide content without it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <SiteJsonLd />
        <a href="#main" className="skip">
          דלג לתוכן
        </a>
        <CartProvider>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
        <RevealObserver />
        <TransitionRouter />
      </body>
    </html>
  );
}
