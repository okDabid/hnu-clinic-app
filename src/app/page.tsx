// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-center">
      {/* System Title */}
      <h1 className="text-4xl md:text-5xl font-bold text-green-600 mb-4">
        HNU Clinic Health Record & Appointment System
      </h1>

      {/* Intro */}
      <p className="text-gray-600 dark:text-gray-400 max-w-2xl mb-12 text-lg">
        A secure platform that streamlines patient care, appointment scheduling,
        and clinic operations — giving patients, doctors, nurses, and staff
        the tools they need to work efficiently.
      </p>

      {/* User Login Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {/* Doctor */}
        <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-green-600">Doctor</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Manage diagnoses and patient health records.
          </p>
          <Link href="/login/doctor">
            <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
              Login as Doctor
            </Button>
          </Link>
        </div>

        {/* Nurse */}
        <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-green-600">Nurse</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Oversee clinic operations and assist doctors.
          </p>
          <Link href="/login/nurse">
            <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
              Login as Nurse
            </Button>
          </Link>
        </div>

        {/* Scholar */}
        <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-green-600">
            Working Scholar
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Support daily clinic operations.
          </p>
          <Link href="/login/scholar">
            <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
              Login as Scholar
            </Button>
          </Link>
        </div>

        {/* Patient */}
        <div className="p-6 rounded-xl shadow bg-white dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-green-600">Patient</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Book appointments and view your health records.
          </p>
          <Link href="/login/patient">
            <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
              Login as Patient
            </Button>
          </Link>
        </div>
      </div>

      {/* Extra Navigation */}
      {/*<div className="mt-12 flex gap-4 flex-wrap justify-center">
        <Link href="/clinic">
          <Button variant="outline" className="px-6">
            View Clinics
          </Button>
        </Link>
        <Link href="/admin/dashboard">
          <Button className="bg-gray-700 hover:bg-gray-800 text-white px-6">
            Admin Dashboard
          </Button>
        </Link>
      </div>*/}
    </main>
  );
}
