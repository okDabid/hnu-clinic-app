// @ts-ignore: side-effect CSS import without module declarations
import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Poppins, Inter } from "next/font/google";
import Providers from "./providers";
{/*import { SpeedInsights } from "@vercel/speed-insights/next";*/ }
import { Analytics } from "@vercel/analytics/next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HNU Clinic Health Record & Appointment System",
  description: "Health Record & Appointment System for HNU Clinic",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-192x192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  // Keep the manifest and theme color for PWA & Android
  manifest: "/site.webmanifest",
};

/**
 * Renders the root HTML structure and shared providers for the app.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${inter.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <Providers>{children}</Providers>
        {/*<SpeedInsights />*/}
        <Analytics />
      </body>
    </html>
  );
}
