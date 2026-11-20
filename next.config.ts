import type { NextConfig } from "next";

/** Allow next/image to optimise assets served from the R2 public custom domain. */
const r2Host = (() => {
  try {
    return process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: r2Host ? [{ protocol: "https", hostname: r2Host }] : [],
  },
};

export default nextConfig;
