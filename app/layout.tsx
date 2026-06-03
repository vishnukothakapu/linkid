import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import PwaRegister from "./PwaRegister";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LinkID",
  description: "Your professional identity, simplified.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LinkID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
        {/* Safely registers the service worker on the client side */}
        <PwaRegister />
      </body>
    </html>
  );
}
