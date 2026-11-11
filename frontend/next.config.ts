import type { NextConfig } from "next";

// Next can load this config as ESM when the native compiler is unavailable.
// process.cwd() stays valid in both ESM and CommonJS execution modes.
const repositoryRoot = process.cwd();

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
  experimental: { agentUpgrade: "security", serverActions: { bodySizeLimit: "4mb" } },
};

export default config;
