import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
// Absolute base for share links (LinkedIn needs full image URLs). Vercel
// sets VERCEL_PROJECT_PRODUCTION_URL; locally we fall back to localhost.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const title = "LedgerLite · Full-stack internship project";
const description =
  "A multi-tenant accounting workspace built with Next.js and FastAPI during my PSEB internship: 47 topics across the full stack.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "LedgerLite", template: "%s · LedgerLite" },
  description,
  openGraph: {
    type: "website",
    siteName: "LedgerLite",
    title,
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#082d63",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

