import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "../../app/globals.css";
import Providers from "../Providers";
import { Toaster } from "@/components/ui/sonner";

const archivo = Archivo({
  variable: "--font-archivo-sans",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
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
    url: "https://pms-connect.vercel.app",
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
  // Explicit `apple` entry required: setting `metadata.icons` at all makes
  // Next.js skip file-convention auto-detection entirely (verified against
  // the rendered DOM — apple-icon.png/icon1.png weren't linked at all once
  // `icons.icon` was set), it doesn't just override the one slot you named.
  icons: {
    icon: "/web-app-manifest-192x192.png",
    apple: "/apple-icon.png",
  },
  // Next.js's `appleWebApp.capable` renders `mobile-web-app-capable` (the
  // Chrome/Android tag) but NOT `apple-mobile-web-app-capable` itself —
  // verified against the actual rendered HTML, an easy assumption to get
  // wrong. Some iOS Safari versions specifically check the apple-prefixed
  // tag for standalone mode, so it's added explicitly via `other`.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PMSCONNECT",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1017" },
  ],
  colorScheme: 'light dark',
};


import { getDictionary } from "@/app/getDictionary";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>
}>) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as 'en' | 'fr'); // FETCH ON SERVER

  return (
    <html lang={lang} suppressHydrationWarning>
      {/* No manual <link rel="manifest">/apple-mobile-web-app-* tags here —
          metadata.manifest + metadata.appleWebApp above already generate
          them (duplicated tags otherwise). */}
      <body
        suppressHydrationWarning
        className={`${archivo.variable} ${bricolage.variable} ${geistMono.variable} antialiased`}
      >
        <Providers dictionary={dictionary}>
          <PwaInstallPrompt />
          {children}
        </Providers>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
