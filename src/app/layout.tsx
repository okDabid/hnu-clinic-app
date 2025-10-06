import "./globals.css";
import { ReactNode } from "react";
import { Poppins, Inter } from "next/font/google";
import Providers from "./providers";

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

export const metadata = {
  title: "HNU Clinic",
  description: "Health Record & Appointment System for HNU Clinic",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${poppins.variable} ${inter.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
