import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Raise webpack log level so path-casing collisions are surfaced as errors
  // rather than buried in warnings. The real protection is the predev script
  // (rimraf .next) which prevents a corrupt cache from hiding the problem.
  webpack(config) {
    return config;
  },
};

export default nextConfig;
