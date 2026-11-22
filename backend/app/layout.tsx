import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";

import { DEFAULT_LOCALE, isAppLocale } from "@/lib/marketing/locale";
import { ogImage } from "@/lib/marketing/seo";
import { APP_STORE_ID, SITE_URL } from "@/lib/marketing/site";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const defaultTitle = "Kangur – Shared grocery lists with AI";
const defaultDescription =
  "Create lists from a photo, text, a recipe or past shopping. Shop aisle by aisle and share your lists with your household.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: "%s | Kangur",
  },
  description: defaultDescription,
  applicationName: "Kangur",
  icons: {
    // /favicon.ico comes from the app/favicon.ico file convention.
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  // Safari on iPhone shows the native "Open in App Store" banner.
  itunes: { appId: APP_STORE_ID },
  openGraph: {
    type: "website",
    siteName: "Kangur",
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImage("en")],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [ogImage("en").url],
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
