import type { NextConfig } from "next";
import path from "node:path";

const repositoryRoot = path.resolve(__dirname, "..");

const storageHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : null;

const config: NextConfig = {
  turbopack: { root: repositoryRoot },
  outputFileTracingRoot: repositoryRoot,
  poweredByHeader: false,
  images: {
    remotePatterns: storageHost ? [{ protocol: "https", hostname: storageHost, pathname: "/storage/v1/**" }] : [],
    // Signed storage URLs are permission checked by Supabase and expire.
    minimumCacheTTL: 60,
  },
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default config;
