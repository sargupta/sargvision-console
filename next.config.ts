import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages — the whole app is client-side
  // (WebSocket data, MapLibre rendering); no SSR data fetching needed.
  output: "export",
  // Pages writes to .next; export writes to out/
  distDir: process.env.NEXT_STATIC_EXPORT === "1" ? "out" : ".next",
  images: {
    unoptimized: true,  // required for static export
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
