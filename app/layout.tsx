import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brothers Digital — Design, Development & Growth",
  description: "Studio indépendant au Maroc : sites, applications et identités visuelles.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
