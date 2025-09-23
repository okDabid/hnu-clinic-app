// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900 text-center">
      {/* Public Heading */}
      <h1 className="text-4xl font-bold text-green-600 mb-4">
        HNU Clinic Health Record and Appointment System
      </h1>

      {/* Public Intro */}
      <p className="text-gray-600 dark:text-gray-400 max-w-xl mb-8">
        This platform platform designed to streamline patient care by securely
        managing health records and simplifying appointment scheduling.
        It provides patients with easy access to their medical history and booking services,
        while enabling healthcare providers to efficiently track, update, and manage
        data.
      </p>

      {/* Call-to-Actions */}
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/clinic">
          <Button variant="outline" className="px-6">
            View Clinics
          </Button>
        </Link>

        <Link href="/admin/dashboard">
          <Button className="bg-green-600 hover:bg-green-700 text-white px-6">
            Admin Dashboard
          </Button>
        </Link>
      </div>
    </main>
  );
}
