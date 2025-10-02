"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    Menu, X,
    Package,
    Users,
    Home,
    Plus,
    Search,
    ClipboardList,
    Pill,
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

import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ✅ InventoryItem now uses all replenishments
type InventoryItem = {
    med_id: string;
    item_name: string;
    quantity: number;
    clinic: { clinic_name: string };
    replenishments: { expiry_date: string }[];
};

type Clinic = {
    clinic_id: string;
    clinic_name: string;
};

export default function NurseInventoryPage() {
    const [menuOpen] = useState(false);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const pageSize = 6;

    // Load inventory
    async function loadInventory() {
        const res = await fetch("/api/nurse/inventory", { cache: "no-store" });
        const data = await res.json();
        setItems(data);
    }

    // Load clinics
    async function loadClinics() {
        const res = await fetch("/api/nurse/clinic", { cache: "no-store" });
        const data = await res.json();
        setClinics(data);
    }

    useEffect(() => {
        loadInventory();
        loadClinics();
    }, []);

    const filteredItems = items.filter(
        (i) =>
            i.item_name.toLowerCase().includes(search.toLowerCase()) ||
            i.clinic.clinic_name.toLowerCase().includes(search.toLowerCase())
    );

    const paginated = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // ✅ Status is based on SOONEST expiry only
    const getStatus = (expiry: string | undefined) => {
        if (!expiry) return { text: "No expiry", color: "bg-gray-100 text-gray-600 border-gray-200" };
        const today = new Date();
        const expDate = new Date(expiry);
        const diff = expDate.getTime() - today.getTime();
        const daysLeft = diff / (1000 * 60 * 60 * 24);

        if (daysLeft < 0) return { text: "Expired", color: "bg-red-100 text-red-700 border-red-200" };
        if (daysLeft < 30) return { text: "Expiring Soon", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
        return { text: "Valid", color: "bg-green-100 text-green-700 border-green-200" };
    };

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
                    <Link href="/nurse/inventory" className="flex items-center gap-2 text-green-600 font-semibold">
                        <Package className="h-5 w-5" /> Inventory
                    </Link>
                    <Link href="/nurse/clinic" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Clinic
                    </Link>
                    <Link href="/nurse/dispense" className="flex items-center gap-2 hover:text-green-600">
                        <Pill className="h-5 w-5" /> Dispense
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

            {/* Main */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">Inventory Management</h2>
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
                                <DropdownMenuItem asChild><Link href="/nurse/dispense">Dispensed</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Inventory Table */}
                <section className="px-6 pt-4 pb-12 flex-1 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-2xl font-bold text-green-600">Stock List</CardTitle>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-initial">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search items..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-8"
                                    />
                                </div>
                                {/* Add stock dialog left unchanged */}
                            </div>
                        </CardHeader>

                        {/* Table content */}
                        <CardContent className="flex-1 flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Clinic</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Expiries</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.length > 0 ? (
                                            paginated.map((item) => {
                                                const soonestExpiry = item.replenishments[0]?.expiry_date;
                                                const status = getStatus(soonestExpiry);
                                                return (
                                                    <TableRow key={item.med_id} className="hover:bg-green-50">
                                                        <TableCell>{item.clinic.clinic_name}</TableCell>
                                                        <TableCell>{item.item_name}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>
                                                            {item.replenishments.map((r, i) => (
                                                                <div key={i} className="text-sm text-gray-700">
                                                                    {new Date(r.expiry_date).toLocaleDateString()}
                                                                </div>
                                                            ))}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={status.color}>
                                                                {status.text}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                                                    No items found
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
