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
  // "মাসয়ালা-মাসায়েল" is the Q&A section.
  async redirects() {
    return [{ source: "/masail", destination: "/qa", permanent: true }];
  },
  experimental: {
    // Profile photos go through a Server Action; they are compressed in the
    // browser first, this is just headroom above the 1 MB default.
    serverActions: { bodySizeLimit: "3mb" },
  },
  images: {
    remotePatterns: r2Host ? [{ protocol: "https", hostname: r2Host }] : [],
  },
};

export default nextConfig;
