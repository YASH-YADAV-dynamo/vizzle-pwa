// app/layout.tsx
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Vizzle - Virtual Try-On",
  description: "Try on clothes virtually with AI-powered virtual try-on technology",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vizzle",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  other: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID
    ? {
        "google-adsense-account": process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
      }
    : {},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  return (
    <html lang="en">
      <body>
        {/* Google AdSense Script */}
        {adsensePublisherId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
