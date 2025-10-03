"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    Menu,
    X,
    UserCog,
    CalendarDays,
    ClipboardList,
    FileText,
    Stethoscope,
    Home,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

export default function DoctorDashboardPage() {
    const { data: session } = useSession();
    const [menuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const fullName = session?.user?.name || "School Doctor";

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link
                        href="/doctor"
                        className="flex items-center gap-2 text-green-600 font-semibold"
                    >
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link
                        href="/doctor/appointments"
                        className="flex items-center gap-2 hover:text-green-600"
                    >
                        <CalendarDays className="h-5 w-5" /> Appointments
                    </Link>
                    <Link
                        href="/doctor/patients"
                        className="flex items-center gap-2 hover:text-green-600"
                    >
                        <ClipboardList className="h-5 w-5" /> Patients
                    </Link>
                </nav>
                <Separator className="my-6" />
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Logging out...
                        </>
                    ) : (
                        "Logout"
                    )}
                </Button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">
                        Doctor Panel Dashboard
                    </h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {menuOpen ? (
                                        <X className="w-5 h-5" />
                                    ) : (
                                        <Menu className="w-5 h-5" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/appointments">Appointments</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/patients">Patients</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: "/login?logout=success" })}
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Welcome */}
                <section className="px-6 py-8 bg-white shadow-sm">
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-green-600">
                            Welcome, {fullName}
                        </h2>
                        <p className="text-gray-700 mt-2">
                            Manage your account, consultation slots, appointments, and patient
                            records.
                        </p>
                    </div>
                </section>

                {/* Functionality Cards */}
                <section className="px-6 py-12 grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                    {/* Account Management */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <UserCog className="w-6 h-6" /> Account Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Edit or update own account</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Consultation Slots */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CalendarDays className="w-6 h-6" /> Consultation Slots
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Input duty hours</li>
                                <li>Generate consultation slots</li>
                                <li>Approve or modify schedules</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Appointments */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <ClipboardList className="w-6 h-6" /> Appointments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Approve, move, or cancel requests</li>
                                <li>View all scheduled appointments</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Patient Records */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <Stethoscope className="w-6 h-6" /> Patient Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Search and view health records</li>
                                <li>Update patient information</li>
                                <li>Add consultation records</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Medical Certificates */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition md:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <FileText className="w-6 h-6" /> Medical Certificates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 text-sm">
                                Generate medical certificates based on patient consultation and
                                health records.
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}
