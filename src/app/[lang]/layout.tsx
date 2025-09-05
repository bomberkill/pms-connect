import type { Metadata, Viewport } from "next";
import {Inter, Manrope } from "next/font/google";
import "../../app/globals.css";
import Providers from "../Providers";
import { Toaster } from "@/components/ui/sonner";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Pms-Connect | Healthcare Professional Network",
  description:
    "Pms-Connect is the professional social network for healthcare providers. Connect, collaborate, and share insights with other professionals in the medical field.",
  manifest: "/manifest.json",
  applicationName: "Pms-Connect",
  // authors: [{ name: "Pms-Connect Team", url: "https://pms-connect.com" }],
  generator: "Next.js",
  keywords: [
    "Healthcare",
    "Medical",
    "Social Network",
    "Doctors",
    "Nurses",
    "Healthcare Providers",
    "Professional Networking",
    "Pms-Connect"
  ],
  // themeColor: "#000000",
  // colorScheme: "light",
  // viewport: {
  //   width: "device-width",
  //   initialScale: 1,
  //   maximumScale: 1,
  // },
  openGraph: {
    title: "Pms-Connect | Healthcare Professional Network",
    description:
      "Join Pms-Connect, the professional social network for healthcare providers. Share knowledge, grow your network, and collaborate across the medical community.",
    url: "https://pms-connect.com",
    siteName: "Pms-Connect",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "Pms-Connect Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/web-app-manifest-192x192.png",
    apple: "/web-app-manifest-512x512.png",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
  colorScheme: 'light',
};


export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{lang: string}>
}>) {
  const {lang} = await params
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${manrope.variable} antialiased`}
      >
        <Providers lang={lang}>
          {children}
        </Providers>
        <Toaster position="top-center" richColors/>
      </body>
    </html>
  );
}
