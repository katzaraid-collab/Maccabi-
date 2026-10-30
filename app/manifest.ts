import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "מכבי תל אביב – החנות הרשמית",
    short_name: "מכבי חנות",
    description: "החנות הרשמית של מועדון הכדורגל מכבי תל אביב: תלבושות 26/27, הדפסה אישית, אופנה ואביזרים.",
    lang: "he",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f2ea",
    theme_color: "#000e62",
    categories: ["shopping", "sports"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "תלבושות משחק", url: "/shop/kits" },
      { name: "עונת 26/27", url: "/shop/new" },
      { name: "SALE", url: "/shop/sale" },
    ],
  };
}
