"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    Menu,
    X,
    CalendarDays,
    ClipboardList,
    Bell,
    Home,
    Loader2,
    User,
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

import Image from "next/image";

export default function PatientDashboardPage() {
    const { data: session } = useSession();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [menuOpen] = useState(false);

    const fullName = session?.user?.name || "Patient";

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
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-xl border-r p-6">
                {/* Logo Section */}
                <div className="flex items-center mb-12">
                    <Image
                        src="/clinic-illustration.svg"
                        alt="clinic-logo"
                        width={40}
                        height={40}
                        className="object-contain drop-shadow-sm"
                    />
                    <h1 className="text-2xl font-extrabold text-green-600 tracking-tight leading-none">
                        HNU Clinic
                    </h1>
                </div>
                <nav className="flex flex-col gap-2 text-gray-700">
                    <Link href="/patient" className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200">
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link href="/patient/account" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                        <User className="h-5 w-5" />
                        Account
                    </Link>
                    <Link href="/patient/appointments" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                        <CalendarDays className="h-5 w-5" />
                        Appointments
                    </Link>
                    <Link href="/patient/notification" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </Link>
                </nav>

                <Separator className="my-8" />

                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 py-2"
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
                        Patient Dashboard
                    </h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/patient">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/patient/account">Account</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/patient/appointments">Appointments</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/patient/notification">Notifications</Link>
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

                {/* Welcome Section */}
                <section className="px-6 py-8 bg-white shadow-sm">
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-green-600">
                            Welcome, {fullName}
                        </h2>
                        <p className="text-gray-700 mt-2">
                            Manage your account, appointments, and stay updated with clinic
                            notifications.
                        </p>
                    </div>
                </section>

                {/* Dashboard Cards */}
                <section className="px-6 py-12 grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                    {/* Account Management */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <User className="w-6 h-6" /> Account Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>View or update your account information</li>
                                <li>Change password or personal details</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Appointments */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CalendarDays className="w-6 h-6" /> Appointments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Schedule and manage your appointments</li>
                                <li>View appointment history</li>
                                <li>Reschedule or cancel existing bookings</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Services */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <ClipboardList className="w-6 h-6" /> Clinic Services
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Explore available clinic services</li>
                                <li>View doctor availability</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <Bell className="w-6 h-6" /> Notifications
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Receive appointment reminders via SMS</li>
                                <li>Stay updated with clinic announcements</li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Patient Panel
                </footer>
            </main>
        </div>
    );
}
