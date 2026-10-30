import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // The store needs none of these; deny them so embedded scripts can't ask.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Shopify's CDN resizes on the fly, so we hand it the width instead of
    // running images through Next's optimizer.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Unhashed files in /public: cache for a day, serve stale for a week while revalidating.
      {
        source: "/:file(crest\\.png|icons/.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
