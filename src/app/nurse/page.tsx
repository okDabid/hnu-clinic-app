"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Menu,
    X,
    UserPlus,
    CalendarDays,
    ClipboardList,
    Pill,
    Package,
    BarChart3,
} from "lucide-react";

export default function NurseAccountsPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const { data: session } = useSession();

    // fallback if session.user.name isn’t available yet
    const fullName = session?.user?.name || "Nurse";

    return (
        <div className="min-h-screen bg-green-50 flex flex-col">
            {/* Header */}
            <header className="w-full bg-white shadow px-4 md:px-8 py-4 sticky top-0 z-50">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg md:text-2xl font-bold text-green-600">
                        HNU Clinic – Nurse Panel
                    </h1>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/nurse" className="text-green-600 font-semibold">
                            Dashboard
                        </Link>
                        <Link
                            href="/nurse/accounts"
                            className="text-gray-700 hover:text-green-600"
                        >
                            Accounts
                        </Link>
                        <Link
                            href="/nurse/inventory"
                            className="text-gray-700 hover:text-green-600"
                        >
                            Inventory
                        </Link>
                        <Button
                            onClick={() =>
                                signOut({
                                    callbackUrl: `${window.location.origin}/login?logout=success`,
                                })
                            }
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Logout
                        </Button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
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
                        <Link href="/nurse" className="text-green-600 font-semibold">
                            Dashboard
                        </Link>
                        <Link
                            href="/nurse/accounts"
                            className="text-gray-700 hover:text-green-600"
                        >
                            Accounts
                        </Link>
                        <Link
                            href="/nurse/inventory"
                            className="text-gray-700 hover:text-green-600"
                        >
                            Inventory
                        </Link>
                        <Button
                            onClick={() => signOut({ callbackUrl: "/login?logout=success" })}
                            className="bg-green-600 hover:bg-green-700 w-full"
                        >
                            Logout
                        </Button>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            <section className="px-6 md:px-12 py-12 bg-white shadow-sm">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl md:text-4xl font-bold text-green-600 mb-4">
                        Welcome, {fullName}
                    </h2>
                    <p className="text-gray-700">
                        Manage clinic operations, user accounts, appointments, patient
                        records, and medicine inventory.
                    </p>
                </div>
            </section>

            {/* Nurse Functionalities */}
            <section className="px-6 md:px-12 py-16 flex-1">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Accounts Management */}
                    <Link href="/nurse/accounts">
                        <Card className="rounded-2xl shadow-lg cursor-pointer hover:shadow-xl transition">
                            <CardContent className="p-6 text-center">
                                <UserPlus className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                <h3 className="font-semibold text-lg text-green-600 mb-2">
                                    Accounts Management
                                </h3>
                                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                    <li>Create accounts (Scholars, Doctors, Admins)</li>
                                    <li>Edit or update own account info</li>
                                    <li>Activate / deactivate user accounts</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Appointments */}
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-6 text-center">
                            <CalendarDays className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">
                                Appointments
                            </h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                <li>View doctor availability</li>
                                <li>Access all scheduled appointments</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Patient Records */}
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-6 text-center">
                            <ClipboardList className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">
                                Patient Records
                            </h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                <li>Search and view records</li>
                                <li>Update patient health data</li>
                                <li>Record consultation notes</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Medicine Dispensing */}
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-6 text-center">
                            <Pill className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">
                                Medicine Dispensing
                            </h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                <li>Record medicines dispensed during consultation</li>
                                <li>Maintain patient medicine history</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Inventory Management */}
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-6 text-center">
                            <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">
                                Inventory Management
                            </h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                <li>Add stocks & replenishments</li>
                                <li>Expiry date monitoring (FIFO)</li>
                                <li>Track stock levels</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Reports */}
                    <Card className="rounded-2xl shadow-lg">
                        <CardContent className="p-6 text-center">
                            <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                            <h3 className="font-semibold text-lg text-green-600 mb-2">
                                Reports
                            </h3>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 text-left">
                                <li>Generate inventory reports</li>
                                <li>Generate quarterly clinic reports</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-6 text-center text-gray-600">
                © {new Date().getFullYear()} HNU Clinic – Nurse Panel
            </footer>
        </div>
    );
}
