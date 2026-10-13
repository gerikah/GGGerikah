import type { NextConfig } from "next";

const storageHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const config: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: storageHost ? [{ protocol: "https", hostname: storageHost, pathname: "/storage/v1/**" }] : [],
    // Signed storage URLs are permission checked by Supabase and expire.
    minimumCacheTTL: 60,
  },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default config;
