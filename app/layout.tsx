import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "LinkID",
    template: "%s | LinkID",
  },
  description: "Your professional identity, simplified. One username, all your platforms.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://linkid.qzz.io",
    siteName: "LinkID",
    title: "LinkID",
    description: "Your professional identity, simplified.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkID",
    description: "Your professional identity, simplified.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
