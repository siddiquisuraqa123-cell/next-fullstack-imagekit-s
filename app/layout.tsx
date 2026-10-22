import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#141414",
};

export const metadata: Metadata = {
  title: "StreamFlix - Watch TV Shows & Movies Online",
  description: "Cinematic video streaming powered by Next.js & ImageKit",
  applicationName: "StreamFlix",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StreamFlix",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#141414] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
