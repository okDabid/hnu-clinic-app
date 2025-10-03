"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
    Menu,
    X,
    Users,
    CalendarDays,
    ClipboardList,
    Pill,
    Package,
    BarChart3,
    Home,
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

export default function NurseDashboardPage() {
    const { data: session } = useSession();
    const [menuOpen] = useState(false);

    const fullName = session?.user?.name || "Nurse";

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">
                    HNU Clinic
                </h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link href="/nurse" className="flex items-center gap-2 text-green-600 font-semibold">
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link href="/nurse/accounts" className="flex items-center gap-2 hover:text-green-600">
                        <Users className="h-5 w-5" />
                        Accounts
                    </Link>
                    <Link href="/nurse/inventory" className="flex items-center gap-2 hover:text-green-600">
                        <Package className="h-5 w-5" />
                        Inventory
                    </Link>
                    <Link href="/nurse/clinic" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Clinic
                    </Link>
                    <Link href="/nurse/dispense" className="flex items-center gap-2 hover:text-green-600">
                        <Pill className="h-5 w-5" /> Dispense
                    </Link>
                    <Link href="/nurse/records" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Records
                    </Link>
                </nav>
                <Separator className="my-6" />
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => signOut({ callbackUrl: "/login?logout=success" })}
                >
                    Logout
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

                    {/* KPI Metric Blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-5xl mx-auto">
                        <Card className="shadow rounded-xl border border-green-100">
                            <CardContent className="flex flex-col items-center p-6">
                                <Users className="w-8 h-8 text-green-600 mb-2" />
                                <h3 className="text-lg font-semibold text-green-600">Accounts</h3>
                                <p className="text-sm text-gray-600">Manage user accounts</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow rounded-xl border border-green-100">
                            <CardContent className="flex flex-col items-center p-6">
                                <CalendarDays className="w-8 h-8 text-green-600 mb-2" />
                                <h3 className="text-lg font-semibold text-green-600">Appointments</h3>
                                <p className="text-sm text-gray-600">Track schedules</p>
                            </CardContent>
                        </Card>

                        <Card className="shadow rounded-xl border border-green-100">
                            <CardContent className="flex flex-col items-center p-6">
                                <Package className="w-8 h-8 text-green-600 mb-2" />
                                <h3 className="text-lg font-semibold text-green-600">Inventory</h3>
                                <p className="text-sm text-gray-600">Monitor stock levels</p>
                            </CardContent>
                        </Card>
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
