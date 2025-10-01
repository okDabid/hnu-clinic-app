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

export default function NurseDashboardPage() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);

    const fullName = session?.user?.name || "Nurse";

    return (
        <div className="flex min-h-screen bg-neutral-950 text-gray-100">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-neutral-900 border-r border-neutral-800 p-6">
                <h1 className="text-2xl font-bold text-green-500 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-300">
                    <Link
                        href="/nurse"
                        className="flex items-center gap-2 text-green-500 font-semibold"
                    >
                        <Home className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/nurse/accounts"
                        className="flex items-center gap-2 hover:text-green-500"
                    >
                        <Users className="h-5 w-5" />
                        Accounts
                    </Link>
                    <Link
                        href="/nurse/inventory"
                        className="flex items-center gap-2 hover:text-green-500"
                    >
                        <Package className="h-5 w-5" />
                        Inventory
                    </Link>
                </nav>
                <div className="mt-auto">
                    <Button
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => signOut({ callbackUrl: "/login?logout=success" })}
                    >
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-500">
                        Nurse Panel Dashboard
                    </h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="text-gray-200">
                                    {menuOpen ? (
                                        <X className="w-5 h-5" />
                                    ) : (
                                        <Menu className="w-5 h-5" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-neutral-800 text-gray-100"
                            >
                                <DropdownMenuItem asChild>
                                    <Link href="/nurse">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/nurse/accounts">Accounts</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/nurse/inventory">Inventory</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        signOut({ callbackUrl: "/login?logout=success" })
                                    }
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Welcome + KPI Section */}
                <section className="px-6 py-8">
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-green-500">
                            Welcome, {fullName}
                        </h2>
                        <p className="text-gray-400 mt-2">
                            Manage clinic operations, accounts, appointments, records, and
                            inventory.
                        </p>
                    </div>

                    {/* KPI Metric Blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 max-w-6xl mx-auto">
                        <Card className="bg-neutral-900 border border-neutral-800 shadow-md">
                            <CardContent className="flex flex-col items-center p-6">
                                <Users className="w-8 h-8 text-green-500 mb-2" />
                                <p className="text-sm text-gray-400">Accounts</p>
                                <p className="text-2xl font-bold text-green-400">245</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-neutral-900 border border-neutral-800 shadow-md">
                            <CardContent className="flex flex-col items-center p-6">
                                <CalendarDays className="w-8 h-8 text-green-500 mb-2" />
                                <p className="text-sm text-gray-400">Appointments</p>
                                <p className="text-2xl font-bold text-green-400">89</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-neutral-900 border border-neutral-800 shadow-md">
                            <CardContent className="flex flex-col items-center p-6">
                                <Package className="w-8 h-8 text-green-500 mb-2" />
                                <p className="text-sm text-gray-400">Inventory Items</p>
                                <p className="text-2xl font-bold text-green-400">530</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-neutral-900 border border-neutral-800 shadow-md">
                            <CardContent className="flex flex-col items-center p-6">
                                <BarChart3 className="w-8 h-8 text-green-500 mb-2" />
                                <p className="text-sm text-gray-400">Reports Generated</p>
                                <p className="text-2xl font-bold text-green-400">12</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Chart Section (Placeholder) */}
                <section className="px-6 py-8 max-w-6xl mx-auto">
                    <Card className="bg-neutral-900 border border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-green-500">Total Visitors</CardTitle>
                            <p className="text-gray-400 text-sm">
                                Visitors trend for the last 7 days
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 flex items-center justify-center text-gray-500">
                                {/* Replace with chart.js or custom SVG */}
                                Chart Placeholder
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Table Section (Placeholder) */}
                <section className="px-6 py-8 max-w-6xl mx-auto">
                    <Card className="bg-neutral-900 border border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-green-500">
                                Recent Activities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-neutral-800 text-gray-400">
                                            <th className="p-3">User</th>
                                            <th className="p-3">Action</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-neutral-800 hover:bg-neutral-800/50">
                                            <td className="p-3">John Doe</td>
                                            <td className="p-3">Created Account</td>
                                            <td className="p-3 text-green-400">Success</td>
                                            <td className="p-3">2025-09-25</td>
                                        </tr>
                                        <tr className="border-b border-neutral-800 hover:bg-neutral-800/50">
                                            <td className="p-3">Jane Smith</td>
                                            <td className="p-3">Updated Record</td>
                                            <td className="p-3 text-yellow-400">Pending</td>
                                            <td className="p-3">2025-09-26</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Footer */}
                <footer className="bg-neutral-900 border-t border-neutral-800 py-6 text-center text-gray-500 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
