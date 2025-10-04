"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    Menu,
    X,
    Package,
    Users,
    Home,
    Plus,
    Search,
    ClipboardList,
    Pill,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ✅ Types
type InventoryItem = {
    med_id: string;
    item_name: string;
    quantity: number;
    category: string;
    item_type?: string;
    strength?: number;
    unit?: string;
    clinic: { clinic_name: string };
    replenishments: { expiry_date: string; remaining_qty: number }[];
};

type Clinic = {
    clinic_id: string;
    clinic_name: string;
};

export default function NurseInventoryPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [units, setUnits] = useState<string[]>([]);
    const [medTypes, setMedTypes] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [clinicFilter, setClinicFilter] = useState("All");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

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
            toast.warning(
                `Auto-deducted ${data.expiredDeducted} expired units from stock.`,
                { duration: 5000 }
            );
        }
    }

    // 🔹 Load clinics
    async function loadClinics() {
        const res = await fetch("/api/nurse/clinic", { cache: "no-store" });
        const data = await res.json();
        setClinics(data);
    }

    // 🔹 Load enums
    async function loadEnums() {
        const res = await fetch("/api/enums", { cache: "no-store" });
        const data = await res.json();
        setCategories(data.categories);
        setUnits(data.units);
        setMedTypes(data.medTypes);
    }

    // 🔹 Combined loader
    useEffect(() => {
        async function loadAll() {
            setLoading(true);
            try {
                await Promise.all([loadInventory(), loadClinics(), loadEnums()]);
            } finally {
                setLoading(false);
            }
        }
        loadAll();
    }, []);

    // ✅ Status checker
    const getStatus = (expiry: string | undefined) => {
        if (!expiry)
            return {
                text: "No expiry",
                color: "bg-gray-100 text-gray-600 border-gray-200",
            };
        const today = new Date();
        const expDate = new Date(expiry);
        const diff = expDate.getTime() - today.getTime();
        const daysLeft = diff / (1000 * 60 * 60 * 24);

        if (daysLeft < 0)
            return { text: "Expired", color: "bg-red-100 text-red-700 border-red-200" };
        if (daysLeft < 9)
            return {
                text: "Expiring Very Soon",
                color: "bg-orange-100 text-orange-700 border-orange-200",
            };
        if (daysLeft < 30)
            return {
                text: "Expiring Soon",
                color: "bg-yellow-100 text-yellow-700 border-yellow-200",
            };
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
            (statusFilter === "Expiring Very Soon" &&
                i.replenishments.some(
                    (r) => getStatus(r.expiry_date).text === "Expiring Very Soon"
                )) ||
            (statusFilter === "Expiring Soon" &&
                i.replenishments.some(
                    (r) => getStatus(r.expiry_date).text === "Expiring Soon"
                )) ||
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
                    <Link
                        href="/nurse/accounts"
                        className="flex items-center gap-2 hover:text-green-600"
                    >
                        <Users className="h-5 w-5" /> Accounts
                    </Link>
                    <Link
                        href="/nurse/inventory"
                        className="flex items-center gap-2 text-green-600 font-semibold"
                    >
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

            {/* Main */}
            <main className="flex-1 flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600 flex items-center gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Inventory Management
                    </h2>
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
                                <DropdownMenuItem asChild><Link href="/nurse/dispense">Dispensed</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/nurse/records">Records</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Inventory Table */}
                <section className="px-6 pt-4 pb-12 flex-1 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        {/* Header with Filters + Add Stock */}
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-2xl font-bold text-green-600">
                                Stock List
                            </CardTitle>
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-initial">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search items..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="border rounded p-2"
                                >
                                    <option value="All">All</option>
                                    <option value="Valid">Valid</option>
                                    <option value="Expiring Soon">Expiring Soon</option>
                                    <option value="Expiring Very Soon">Expiring Very Soon</option>
                                    <option value="Expired">Expired</option>
                                </select>
                                <select
                                    value={clinicFilter}
                                    onChange={(e) => setClinicFilter(e.target.value)}
                                    className="border rounded p-2"
                                >
                                    <option value="All">All Clinics</option>
                                    {clinics.map((clinic) => (
                                        <option key={clinic.clinic_id} value={clinic.clinic_name}>
                                            {clinic.clinic_name}
                                        </option>
                                    ))}
                                </select>

                                {/* Add Stock Dialog */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                                            <Plus className="h-4 w-4 mr-1" /> Add Stock
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Stock</DialogTitle>
                                            <DialogDescription>
                                                Fill in the details of the stock item.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form
                                            className="space-y-4"
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                const form = e.currentTarget as HTMLFormElement;
                                                setSaving(true);
                                                const body = {
                                                    clinic_id: (form.elements.namedItem("clinic_id") as HTMLSelectElement).value,
                                                    item_name: (form.elements.namedItem("item_name") as HTMLInputElement).value,
                                                    quantity: Number((form.elements.namedItem("quantity") as HTMLInputElement).value),
                                                    expiry: (form.elements.namedItem("expiry") as HTMLInputElement).value,
                                                    category: (form.elements.namedItem("category") as HTMLSelectElement).value,
                                                    item_type: (form.elements.namedItem("item_type") as HTMLInputElement).value,
                                                    strength: parseFloat((form.elements.namedItem("strength") as HTMLInputElement).value),
                                                    unit: (form.elements.namedItem("unit") as HTMLSelectElement).value,
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
                                                setSaving(false);
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
                                                <Label>Name</Label>
                                                <Input name="item_name" required />
                                            </div>
                                            <div>
                                                <Label>Quantity</Label>
                                                <Input type="number" name="quantity" required />
                                            </div>
                                            <div>
                                                <Label>Expiry Date</Label>
                                                <Input type="date" name="expiry" required />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                                                        </>
                                                    ) : (
                                                        "Save"
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>

                        {/* Card Content */}
                        <CardContent className="flex-1 flex flex-col">
                            {loading ? (
                                <div className="flex items-center justify-center py-10 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Loading inventory...
                                </div>
                            ) : (
                                <div className="overflow-x-auto flex-1">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Clinic</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Item Type</TableHead>
                                                <TableHead>Strength</TableHead>
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
                                                        <TableCell>{item.category}</TableCell>
                                                        <TableCell>{item.item_type || "-"}</TableCell>
                                                        <TableCell>
                                                            {item.strength ? `${item.strength} ${item.unit || ""}` : "-"}
                                                        </TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                {item.replenishments.map((rep, idx) => {
                                                                    const status = getStatus(rep.expiry_date);
                                                                    const daysLeft = Math.ceil(
                                                                        (new Date(rep.expiry_date).getTime() -
                                                                            new Date().getTime()) /
                                                                        (1000 * 60 * 60 * 24)
                                                                    );
                                                                    return (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm"
                                                                        >
                                                                            <span className="font-medium text-gray-800">
                                                                                {new Date(rep.expiry_date).toLocaleDateString()}
                                                                            </span>
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
                                                    <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                                                        No items found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
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
