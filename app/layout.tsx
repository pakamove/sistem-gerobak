import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/shared/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Gerobak",
  description: "Sistem Operasional F&B Gerobak + Central Kitchen",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gerobak",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1C1712",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
