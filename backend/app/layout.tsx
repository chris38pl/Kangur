import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";

import { DEFAULT_LOCALE, isAppLocale } from "@/lib/marketing/locale";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kangur – Smart shopping list",
    template: "%s | Kangur",
  },
  description:
    "Kangur - shared smart shopping lists with AI. Download the app and shop with less friction.",
  applicationName: "Kangur",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Kangur",
    title: "Kangur – Smart shopping list",
    description:
      "Shared smart shopping lists with AI. Download Kangur and shop with less friction.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Kangur" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kangur – Smart shopping list",
    description:
      "Shared smart shopping lists with AI. Download Kangur and shop with less friction.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#43BFA8",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const fromHeader = headerList.get("x-kangur-locale");
  const lang = isAppLocale(fromHeader) ? fromHeader : DEFAULT_LOCALE;

  return (
    <html lang={lang}>
      <body className={jakarta.variable}>{children}</body>
    </html>
  );
}
