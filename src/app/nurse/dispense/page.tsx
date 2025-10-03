"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    Menu, X, Users, Package, Home, ClipboardList, Pill
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

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
    const [menuOpen] = useState(false);
    const [dispenses, setDispenses] = useState<Dispense[]>([]);

    // Load dispenses
    async function loadDispenses() {
        const res = await fetch("/api/nurse/dispense", { cache: "no-store" });
        const data = await res.json();
        setDispenses(data);
    }

    useEffect(() => {
        loadDispenses();
    }, []);

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link href="/nurse" className="flex items-center gap-2 hover:text-green-600">
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link href="/nurse/accounts" className="flex items-center gap-2 hover:text-green-600">
                        <Users className="h-5 w-5" /> Accounts
                    </Link>
                    <Link href="/nurse/inventory" className="flex items-center gap-2 hover:text-green-600">
                        <Package className="h-5 w-5" /> Inventory
                    </Link>
                    <Link href="/nurse/clinic" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Clinic
                    </Link>
                    <Link href="/nurse/dispense" className="flex items-center gap-2 text-green-600 font-semibold">
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
                    <h2 className="text-xl font-bold text-green-600">Dispense Records</h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
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
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Dispense Records Table */}
                <section className="px-6 pt-6 pb-12 flex-1 flex flex-col">
                    <Card className="flex-1 flex flex-col">

                        <CardContent className="flex-1 flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <Table>
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
                                                <TableRow key={d.dispense_id} className="hover:bg-green-50">
                                                    <TableCell>{d.med.clinic.clinic_name}</TableCell>
                                                    <TableCell>{d.consultation.appointment.patient.username}</TableCell>
                                                    <TableCell>{d.med.item_name}</TableCell>
                                                    <TableCell>{d.quantity}</TableCell>
                                                    <TableCell>{d.consultation.doctor?.username || "—"}</TableCell>
                                                    <TableCell>{d.consultation.nurse?.username || "—"}</TableCell>
                                                    <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        {d.dispenseBatches.length > 0 ? (
                                                            <ul className="text-sm text-gray-700 space-y-1">
                                                                {d.dispenseBatches.map((batch, i) => (
                                                                    <li key={i}>
                                                                        <span className="font-medium">{batch.quantity_used}</span> used from batch
                                                                        (Expiry: {new Date(batch.replenishment.expiry_date).toLocaleDateString()},
                                                                        Received: {new Date(batch.replenishment.date_received).toLocaleDateString()})
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
                                                <TableCell colSpan={8} className="text-center text-gray-500 py-6">
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
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
