"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import {
    Bell,
    CalendarCheck,
    CalendarDays,
    Home,
    Info,
    Loader2,
    Mail,
    Menu,
    User,
    X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const notificationHighlights = [
    {
        icon: Mail,
        title: "Email Alerts",
        description:
            "We will send an email every time a doctor moves your appointment so you have a written record of the new schedule.",
    },
    {
        icon: CalendarCheck,
        title: "Portal Reminders",
        description:
            "Review upcoming visits from the patient portal. Double-check the rescheduled date, time, and clinic in one glance.",
    },
    {
        icon: Info,
        title: "Doctor Notes",
        description:
            "Moved appointments include a short note from the doctor explaining the change, helping you prepare ahead of time.",
    },
];

const followUpTips = [
    "Confirm that the new schedule fits your availability and plan to arrive 10 minutes early.",
    "Update personal reminders on your phone or calendar with the revised appointment details.",
    "Contact the clinic if you need additional adjustments or medical assistance before your visit.",
];

export default function PatientNotificationPage() {
    const { data: session } = useSession();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const fullName = session?.user?.name ?? "Patient";

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
                <div className="flex items-center mb-12">
                    <Image
                        src="/clinic-illustration.svg"
                        alt="clinic-logo"
                        width={40}
                        height={40}
                        className="object-contain drop-shadow-sm"
                    />
                    <h1 className="text-2xl font-extrabold text-green-600 tracking-tight leading-none">HNU Clinic</h1>
                </div>

                <nav className="flex flex-col gap-2 text-gray-700">
                    <Link
                        href="/patient"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link
                        href="/patient/account"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <User className="h-5 w-5" /> Account
                    </Link>
                    <Link
                        href="/patient/appointments"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <CalendarDays className="h-5 w-5" /> Appointments
                    </Link>
                    <Link
                        href="/patient/notification"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200"
                    >
                        <Bell className="h-5 w-5" /> Notifications
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

            {/* Main */}
            <main className="flex-1 flex flex-col">
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Notification Center</h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen(prev => !prev)}>
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
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <section className="px-6 py-10 bg-white shadow-sm">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-green-600">Stay Informed, Stay Prepared</h2>
                        <p className="text-gray-700 mt-3 leading-relaxed">
                            Hello <span className="font-semibold">{fullName}</span>! Each time your doctor moves an appointment,
                            we notify you through email and highlight the change here in the portal. Keep an eye on this
                            page for quick summaries and helpful tips after every update.
                        </p>
                    </div>
                </section>

                <section className="px-6 py-12 bg-green-50">
                    <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                        {notificationHighlights.map(({ icon: Icon, title, description }) => (
                            <Card key={title} className="shadow-lg rounded-2xl border-green-100">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-green-600">
                                        <Icon className="w-6 h-6" /> {title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 text-sm leading-relaxed">{description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                <section className="px-6 py-12 bg-white">
                    <div className="max-w-3xl mx-auto">
                        <Card className="shadow-lg rounded-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-green-600">
                                    <Bell className="w-6 h-6" /> After You Receive a Notification
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-gray-700 space-y-3">
                                    {followUpTips.map(tip => (
                                        <li key={tip}>{tip}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto text-sm sm:text-base">
                    © {new Date().getFullYear()} HNU Clinic – Patient Notifications
                </footer>
            </main>
        </div>
    );
}
