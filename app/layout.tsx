import type { Metadata, Viewport } from "next";
import { Anton, Heebo, JetBrains_Mono, Noto_Sans_Hebrew } from "next/font/google";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { RevealObserver } from "@/components/shell/RevealObserver";
import { TransitionRouter } from "@/components/shell/TransitionRouter";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { INDEXABLE } from "@/lib/seo";
import "./globals.css";

const body = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-body", display: "swap" });
const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-latin-display", display: "swap" });
// Hebrew display voice: Noto Sans Hebrew Black on its condensed width axis sits
// next to Anton far better than a wide geometric black.
const displayHe = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-display-he",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-mono-face", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://shop.maccabi-tlv.co.il"),
  title: { default: "מכבי תל אביב – החנות הרשמית", template: "%s · מכבי תל אביב" },
  description: "תלבושות המשחק של עונת 26/27, הדפסת שם ומספר, קולקציית 120 שנה, אופנה, ילדים ואביזרים – החנות הרשמית של מועדון הכדורגל מכבי תל אביב.",
  openGraph: { type: "website", locale: "he_IL", siteName: "מכבי תל אביב – החנות הרשמית" },
  alternates: { canonical: "/" },
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
