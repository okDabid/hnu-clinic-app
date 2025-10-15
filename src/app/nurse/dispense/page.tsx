"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    Menu,
    X,
    Users,
    Package,
    Home,
    ClipboardList,
    Pill,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// 🔹 Extend Dispense type to include batch usage
type Dispense = {
    dispense_id: string;
    quantity: number;
    createdAt: string;
    med: {
        item_name: string;
        clinic: { clinic_name: string };
    };
    consultation: {
        appointment: {
            patient: { username: string };
            clinic: { clinic_name: string };
        };
        doctor: { username: string } | null;
        nurse: { username: string } | null;
    };
    dispenseBatches: {
        quantity_used: number;
        replenishment: {
            expiry_date: string;
            date_received: string;
        };
    }[];
};

export default function NurseDispensePage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dispenses, setDispenses] = useState<Dispense[]>([]);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    async function loadDispenses() {
        const res = await fetch("/api/nurse/dispense", { cache: "no-store" });
        const data = await res.json();
        setDispenses(data);
    }

    useEffect(() => {
        loadDispenses();
    }, []);

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-green-50">
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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200"
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
                <Separator className="my-8" />

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

            {/* Main */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-lg sm:text-xl font-bold text-green-600">
                        Dispense Records
                    </h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href="/nurse">Dashboard</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/accounts">Accounts</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/inventory">Inventory</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/clinic">Clinic</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/dispense">Dispense</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/records">Records</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Dispense Records */}
                <section className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-8">
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition flex flex-col">
                        <CardHeader className="border-b">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                Dispense History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col pt-4">
                            <div className="overflow-x-auto w-full">
                                <Table className="min-w-full text-sm">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Clinic</TableHead>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Medicine</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Doctor</TableHead>
                                            <TableHead>Nurse</TableHead>
                                            <TableHead>Dispensed At</TableHead>
                                            <TableHead>Batch Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dispenses.length > 0 ? (
                                            dispenses.map((d) => (
                                                <TableRow
                                                    key={d.dispense_id}
                                                    className="hover:bg-green-50 transition"
                                                >
                                                    <TableCell>{d.med.clinic.clinic_name}</TableCell>
                                                    <TableCell>
                                                        {d.consultation.appointment.patient.username}
                                                    </TableCell>
                                                    <TableCell>{d.med.item_name}</TableCell>
                                                    <TableCell>{d.quantity}</TableCell>
                                                    <TableCell>
                                                        {d.consultation.doctor?.username || "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {d.consultation.nurse?.username || "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(d.createdAt).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {d.dispenseBatches.length > 0 ? (
                                                            <ul className="text-sm text-gray-700 space-y-1">
                                                                {d.dispenseBatches.map((batch, i) => (
                                                                    <li key={i}>
                                                                        <span className="font-medium">
                                                                            {batch.quantity_used}
                                                                        </span>{" "}
                                                                        used from batch (Expiry:{" "}
                                                                        {new Date(
                                                                            batch.replenishment.expiry_date
                                                                        ).toLocaleDateString()}
                                                                        , Received:{" "}
                                                                        {new Date(
                                                                            batch.replenishment.date_received
                                                                        ).toLocaleDateString()}
                                                                        )
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="text-center text-gray-500 py-6"
                                                >
                                                    No dispense records found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto text-sm sm:text-base">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
