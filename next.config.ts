import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/**')],
  },
  /* config options here */
  // i18n: {
  //   locales: ["en", "fr"],
  //   defaultLocale: "en",
  //   // localeDetection: true,
  // }
};

export default nextConfig;
