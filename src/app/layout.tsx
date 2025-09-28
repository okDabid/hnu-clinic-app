import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "HNU Clinic",
  description: "Health Record & Appointment System for HNU Clinic",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}