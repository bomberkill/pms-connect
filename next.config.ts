import type { NextConfig } from "next";

// Derived from env so the R2 custom/public domain doesn't need to be
// hardcoded here; falls back to no remote pattern until it's configured.
const r2Hostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_R2_PUBLIC_URL
      ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

const baseConfig: NextConfig = {
  reactStrictMode: true,
  // experimental: {
  //   turbopack: {},
  // },
  experimental: {
    serverActions: {
      // Registration can upload a profile pic + cover pic + up to 2
      // accreditation documents (2MB each) in one go.
      bodySizeLimit: "15mb",
    },
  },
  compiler: {
    // removeConsole: process.env.NODE_ENV !== "development",
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {
    remotePatterns: [
      ...(r2Hostname
        ? [{ protocol: "https" as const, hostname: r2Hostname }]
        : []),
    ],
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  skipWaiting: true,
  register: true,
  disable: process.env.NODE_ENV === "development",
  // disable: false, // ENAbled for testing
  // disable: false,
  workboxOptions: { disableDevLogs: true },
});

// on applique la config PWA par-dessus
module.exports = withPWA(baseConfig);
