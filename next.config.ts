import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Shopify's CDN resizes on the fly, so we hand it the width instead of
    // running images through Next's optimizer.
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
};

export default nextConfig;
