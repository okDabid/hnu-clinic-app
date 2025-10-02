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

// ✅ Types
type InventoryItem = {
    med_id: string;
    item_name: string;
    quantity: number;
    clinic: { clinic_name: string };
    replenishments: { expiry_date: string; remaining_qty: number }[];
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
    const [statusFilter, setStatusFilter] = useState("All");
    const [clinicFilter, setClinicFilter] = useState("All");
    const [loading, setLoading] = useState(false);

    // 🔹 Load inventory
    async function loadInventory() {
        const res = await fetch("/api/nurse/inventory", { cache: "no-store" });
        const data = await res.json();

        if (data.error) {
            toast.error(data.error);
            return;
        }

        setItems(data.inventory);

        if (data.expiredDeducted > 0) {
            toast.warning(`Auto-deducted ${data.expiredDeducted} expired units from stock.`, {
                duration: 5000,
            });
        }
    }

    // 🔹 Load clinics
    async function loadClinics() {
        const res = await fetch("/api/nurse/clinic", { cache: "no-store" });
        const data = await res.json();
        setClinics(data);
    }

    useEffect(() => {
        loadInventory();
        loadClinics();
    }, []);

    // ✅ Status checker
    const getStatus = (expiry: string | undefined) => {
        if (!expiry) return { text: "No expiry", color: "bg-gray-100 text-gray-600 border-gray-200" };
        const today = new Date();
        const expDate = new Date(expiry);
        const diff = expDate.getTime() - today.getTime();
        const daysLeft = diff / (1000 * 60 * 60 * 24);

        if (daysLeft < 0) return { text: "Expired", color: "bg-red-100 text-red-700 border-red-200" };
        if (daysLeft <= 7) return { text: "Expiring Very Soon", color: "bg-orange-100 text-orange-700 border-orange-200" };
        if (daysLeft < 30) return { text: "Expiring Soon", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
        return { text: "Valid", color: "bg-green-100 text-green-700 border-green-200" };
    };

    // ✅ Apply filters
    const filteredItems = items.filter((i) => {
        const matchesSearch =
            i.item_name.toLowerCase().includes(search.toLowerCase()) ||
            i.clinic.clinic_name.toLowerCase().includes(search.toLowerCase());

        const matchesClinic =
            clinicFilter === "All" || i.clinic.clinic_name === clinicFilter;

        const matchesStatus =
            statusFilter === "All" ||
            (statusFilter === "Expired" &&
                i.replenishments.some((r) => getStatus(r.expiry_date).text === "Expired")) ||
            (statusFilter === "Expiring Soon" &&
                i.replenishments.some((r) => getStatus(r.expiry_date).text === "Expiring Soon")) ||
            (statusFilter === "Valid" &&
                i.replenishments.some((r) => getStatus(r.expiry_date).text === "Valid"));

        return matchesSearch && matchesClinic && matchesStatus;
    });

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
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                {/* Search */}
                                <div className="relative flex-1 md:flex-initial">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search items..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="border rounded p-2"
                                >
                                    <option value="All">All</option>
                                    <option value="Valid">Valid</option>
                                    <option value="Expiring Soon">Expiring Soon</option>
                                    <option value="Expired">Expired</option>
                                </select>
                                {/* Clinic Filter */}
                                <select
                                    value={clinicFilter}
                                    onChange={(e) => setClinicFilter(e.target.value)}
                                    className="border rounded p-2"
                                >
                                    <option value="All">All Clinics</option>
                                    <option value="College Clinic">College Clinic</option>
                                    <option value="High School Clinic">High School Clinic</option>
                                    <option value="Grade School Clinic">Grade School Clinic</option>
                                </select>
                                {/* Add Stock */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                                            <Plus className="h-4 w-4 mr-1" /> Add Stock
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Stock</DialogTitle>
                                            <DialogDescription>Fill in the details of the stock item.</DialogDescription>
                                        </DialogHeader>
                                        <form
                                            className="space-y-4"
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                const form = e.currentTarget as HTMLFormElement;
                                                setLoading(true);

                                                const body = {
                                                    clinic_id: (form.elements.namedItem("clinic_id") as HTMLSelectElement).value,
                                                    item_name: (form.elements.namedItem("item_name") as HTMLInputElement).value,
                                                    quantity: (form.elements.namedItem("quantity") as HTMLInputElement).value,
                                                    expiry: (form.elements.namedItem("expiry") as HTMLInputElement).value,
                                                };

                                                const res = await fetch("/api/nurse/inventory", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify(body),
                                                });

                                                if (res.ok) {
                                                    await loadInventory();
                                                    form.reset();
                                                    toast.success("Stock added!");
                                                } else {
                                                    toast.error("Failed to add stock");
                                                }

                                                setLoading(false);
                                            }}
                                        >
                                            <div>
                                                <Label className="block mb-1">Clinic</Label>
                                                <select name="clinic_id" required className="w-full border rounded p-2">
                                                    <option value="">Select clinic</option>
                                                    {clinics.map((clinic) => (
                                                        <option key={clinic.clinic_id} value={clinic.clinic_id}>
                                                            {clinic.clinic_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="block mb-1">Name</Label>
                                                <Input name="item_name" required />
                                            </div>
                                            <div>
                                                <Label className="block mb-1">Quantity</Label>
                                                <Input type="number" name="quantity" required />
                                            </div>
                                            <div>
                                                <Label className="block mb-1">Expiry Date</Label>
                                                <Input type="date" name="expiry" required />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    disabled={loading}
                                                >
                                                    {loading ? "Saving..." : "Save"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>

                        {/* Table */}
                        <CardContent className="flex-1 flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Clinic</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Total Quantity</TableHead>
                                            <TableHead>Expiry Batches</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.length > 0 ? (
                                            filteredItems.map((item) => (
                                                <TableRow key={item.med_id} className="hover:bg-green-50">
                                                    <TableCell>{item.clinic.clinic_name}</TableCell>
                                                    <TableCell>{item.item_name}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {item.replenishments.map((rep, idx) => {
                                                                const status = getStatus(rep.expiry_date);
                                                                const daysLeft = Math.ceil(
                                                                    (new Date(rep.expiry_date).getTime() - new Date().getTime()) /
                                                                    (1000 * 60 * 60 * 24)
                                                                );
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm"
                                                                    >
                                                                        {/* Expiry Date */}
                                                                        <span className="font-medium text-gray-800">
                                                                            {new Date(rep.expiry_date).toLocaleDateString()}
                                                                        </span>

                                                                        {/* Status + Days Left */}
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline" className={status.color}>
                                                                                {status.text}
                                                                            </Badge>
                                                                            <span className="text-sm text-gray-600">
                                                                                ({daysLeft} days left)
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-gray-500 py-6">
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
