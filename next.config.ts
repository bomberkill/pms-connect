import type { NextConfig } from "next";

const baseConfig: NextConfig = {
  reactStrictMode: true,
  // experimental: {
  //   turbopack: {},
  // },
  compiler: {
    // removeConsole: process.env.NODE_ENV !== "development",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ruwtkjvwsoklwtzgalqq.supabase.co",
        pathname: "/storage/v1/object/public/pms-connect-bucket/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        // pathname: "/v0/b/pms-connect-e5cb8.appspot.com/o/**",
        pathname: "/v0/b/nobisoft-nextjs-website.appspot.com/o/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}/__/auth/:path*`,
      },
      {
        source: "/__/firebase/init.json",
        destination:
          "https://pms-connect-e5cb8.firebaseapp.com/__/firebase/init.json",
      },
    ];
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
