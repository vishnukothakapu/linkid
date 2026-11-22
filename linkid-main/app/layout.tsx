import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import "react-image-crop/dist/ReactCrop.css";
import Providers from "./providers";
import BackToTop from "@/components/ui/BackToTop";
import PwaRegister from "@/components/PwaRegister";
import { headers } from "next/headers";

const soraFont = Sora({
  subsets: ["latin"],
  variable: "--font-family",
});

export const viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "LinkID",
  description: "Your professional identity, simplified.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LinkID",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const nonce = headerList.get("x-nonce") || undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${soraFont.variable} antialiased font-sans`}
      >
        <PwaRegister />
        <Providers nonce={nonce}>{children}</Providers>
        <BackToTop />
      </body>
    </html>
  );
}
