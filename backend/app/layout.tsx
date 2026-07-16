import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kangur Platform API",
  description: "Kangur — AI Shopping Assistant API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
