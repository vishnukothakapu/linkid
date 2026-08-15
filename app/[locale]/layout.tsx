import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import Providers from "@/app/providers";
import BackToTop from "@/components/ui/BackToTop";

import PwaRegister from "@/components/PwaRegister";

import { headers } from "next/headers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();
  const headerList = await headers();
  const nonce = headerList.get("x-nonce") || undefined;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <PwaRegister />
          <Providers nonce={nonce}>{children}</Providers>
          <BackToTop />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
