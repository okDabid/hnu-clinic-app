"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Menu,
    X,
    UserCog,
    CalendarDays,
    ClipboardList,
    Bell,
} from "lucide-react";

export default function PatientPanel() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-green-50 flex flex-col">
            {/* Header */}
            <header className="w-full bg-white shadow px-4 md:px-8 py-4 sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg md:text-2xl font-bold text-green-600">
                        HNU Clinic – Patient Panel
                    </h1>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/patient" className="text-green-600 font-semibold">
                            Dashboard
                        </Link>
                        <Link href="/patient/appointments" className="text-gray-700 hover:text-green-600">
                            Appointments
                        </Link>
                        <Link href="/patient/services" className="text-gray-700 hover:text-green-600">
                            Services
                        </Link>
                        <Link href="/">
                            <Button className="bg-green-600 hover:bg-green-700">Logout</Button>
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? (
                            <X className="w-6 h-6 text-green-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-green-600" />
                        )}
                    </button>
                </div>

                {/* Mobile Dropdown */}
                {menuOpen && (
                    <div className="flex flex-col gap-4 mt-4 md:hidden">
                        <Link href="/patient" className="text-green-600 font-semibold">
                            Dashboard
                        </Link>
                        <Link href="/patient/appointments" className="text-gray-700 hover:text-green-600">
                            Appointments
                        </Link>
                        <Link href="/patient/services" className="text-gray-700 hover:text-green-600">
                            Services
                        </Link>
                        <Link href="/">
                            <Button className="bg-green-600 hover:bg-green-700 w-full">Logout</Button>
                        </Link>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="px-6 md:px-12 py-12 bg-white shadow-sm">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl md:text-4xl font-bold text-green-600 mb-4">
                        Welcome, Patient
                    </h2>
                    <p className="text-gray-700">
                        Manage your account, appointments, and stay updated with clinic schedules.
                    </p>
                </div>
            </section>

            {/* Patient Functionalities */}
            <section className="px-6 md:px-12 py-16 flex-1">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Account Management */}
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-6 text-center">
                            <UserCog className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">Account Management</h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                <li>Edit or update own account</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Clinic Schedules */}
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-6 text-center">
                            <CalendarDays className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">Clinic Schedules</h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                <li>View available services</li>
                                <li>Check time slots</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Appointment Management */}
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-6 text-center">
                            <ClipboardList className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">Appointments</h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                <li>Schedule appointments</li>
                                <li>Reschedule or cancel bookings</li>
                                <li>Monitor upcoming appointments</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card className="rounded-2xl shadow-lg md:col-span-3">
                        <CardContent className="p-6 text-center">
                            <Bell className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">Notifications</h3>
                            <p className="text-gray-700 text-sm">
                                Receive automated SMS notifications with appointment details, updates, and reminders.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-6 text-center text-gray-600">
                © {new Date().getFullYear()} HNU Clinic – Patient Panel
            </footer>
        </div>
    );
}
