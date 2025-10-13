"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    Menu,
    X,
    Users,
    ClipboardList,
    Pill,
    Package,
    BarChart3,
    Home,
    Loader2
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

import Image from "next/image";

export default function NurseDashboardPage() {
    const { data: session } = useSession();
    const [menuOpen] = useState(false);

    const fullName = session?.user?.name || "Nurse";

    const [isLoggingOut, setIsLoggingOut] = useState(false);

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

                {/* Navigation */}
                <nav className="flex flex-col gap-2 text-gray-700">
                    <Link
                        href="/nurse"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200"
                    >
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>

                    <Link
                        href="/nurse/accounts"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Users className="h-5 w-5" />
                        Accounts
                    </Link>

                    <Link
                        href="/nurse/inventory"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Package className="h-5 w-5" />
                        Inventory
                    </Link>

                    <Link
                        href="/nurse/clinic"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <ClipboardList className="h-5 w-5" />
                        Clinic
                    </Link>

                    <Link
                        href="/nurse/dispense"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <Pill className="h-5 w-5" />
                        Dispense
                    </Link>

                    <Link
                        href="/nurse/records"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
                    >
                        <ClipboardList className="h-5 w-5" />
                        Records
                    </Link>
                </nav>

                {/* Spacer pushes logout to bottom */}
                <div className="mt-8" />

                {/* Logout Button */}
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
                        Nurse Panel Dashboard
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
                                    <Link href="/nurse">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/nurse/accounts">Accounts</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/nurse/inventory">Inventory</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/nurse/clinic">Clinic</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/nurse/dispense">Dispense</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/nurse/records">Records</Link>
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

                {/* Welcome + KPI Section */}
                <section className="px-6 py-8 bg-white shadow-sm">
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-green-600">
                            Welcome, {fullName}
                        </h2>
                        <p className="text-gray-700 mt-2">
                            Manage clinic operations, accounts, appointments, records, and inventory.
                        </p>
                    </div>
                </section>

                {/* Functionality Cards */}
                <section className="px-6 py-12 grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <Users className="w-6 h-6" /> Accounts Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Create Scholar/Doctor/Admin accounts</li>
                                <li>Edit/update account info</li>
                                <li>Activate/deactivate accounts</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <ClipboardList className="w-6 h-6" /> Patient Records
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Search and view patient records</li>
                                <li>Update health data</li>
                                <li>Record consultation notes</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <Pill className="w-6 h-6" /> Medicine Dispensing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Record medicines dispensed</li>
                                <li>Maintain medicine history</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <Package className="w-6 h-6" /> Inventory Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Add stocks & replenishments</li>
                                <li>Expiry date monitoring (FIFO)</li>
                                <li>Track stock levels</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="shadow-lg rounded-2xl hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <BarChart3 className="w-6 h-6" /> Reports
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                                <li>Generate inventory reports</li>
                                <li>Generate quarterly clinic reports</li>
                            </ul>
                        </CardContent>
                    </Card>
                </section>

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
