import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://ruwtkjvwsoklwtzgalqq.supabase.co/storage/v1/object/public/pms-connect-bucket/**')],
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}/__/auth/:path*`,
      },
      {
        source: '/__/firebase/init.json',
        destination: 'https://pms-connect-e5cb8.firebaseapp.com/__/firebase/init.json',
      }
    ]
  },
};

export default nextConfig;
