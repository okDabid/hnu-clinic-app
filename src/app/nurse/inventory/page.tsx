"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    Menu, X, Package, Users, Home, Plus,
    AlertTriangle, Clock, Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type InventoryItem = {
    med_id: string;
    item_name: string;
    quantity: number;
    replenishments: { expiry_date: string }[];
};

export default function NurseInventoryPage() {
    const [menuOpen] = useState(false);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = 6;

    // Load from API
    async function load() {
        const res = await fetch("/api/nurse/inventory", { cache: "no-store" });
        const data = await res.json();
        setItems(data);
    }

    useEffect(() => {
        load();
    }, []);

    const filteredItems = items.filter(
        (i) =>
            i.item_name.toLowerCase().includes(search.toLowerCase()) ||
            i.med_id.includes(search)
    );

    const paginated = filteredItems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

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
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Quick Stats */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-8">
                    <Card>
                        <CardContent className="flex flex-col items-center p-6">
                            <Package className="h-8 w-8 text-green-600 mb-2" />
                            <h3 className="font-semibold">Total Items</h3>
                            <p className="text-2xl font-bold">{items.length}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-6">
                            <AlertTriangle className="h-8 w-8 text-yellow-600 mb-2" />
                            <h3 className="font-semibold">Low Stock</h3>
                            <p className="text-2xl font-bold">{items.filter(i => i.quantity < 20).length}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-6">
                            <Clock className="h-8 w-8 text-red-600 mb-2" />
                            <h3 className="font-semibold">Expired</h3>
                            <p className="text-2xl font-bold">
                                {items.filter(i => i.replenishments[0] && new Date(i.replenishments[0].expiry_date) < new Date()).length}
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Inventory Table */}
                <section className="px-6 pb-12 flex-1 flex flex-col">
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
                                                const body = {
                                                    clinic_id: "your-clinic-id", // replace with actual clinic_id
                                                    name: (form.elements.namedItem("name") as HTMLInputElement).value,
                                                    quantity: (form.elements.namedItem("quantity") as HTMLInputElement).value,
                                                    expiry: (form.elements.namedItem("expiry") as HTMLInputElement).value,
                                                };

                                                const res = await fetch("/api/nurse/inventory", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify(body),
                                                });

                                                if (res.ok) {
                                                    await load();
                                                    form.reset();
                                                }
                                            }}
                                        >
                                            <div>
                                                <Label>Name</Label>
                                                <Input name="name" required />
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
                                                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Save</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Expiry</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginated.length > 0 ? (
                                            paginated.map((item) => {
                                                const expiry = item.replenishments[0]?.expiry_date;
                                                const status = getStatus(expiry);
                                                return (
                                                    <TableRow key={item.med_id} className="hover:bg-green-50">
                                                        <TableCell>{item.med_id}</TableCell>
                                                        <TableCell>{item.item_name}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>{expiry ? new Date(expiry).toLocaleDateString() : "—"}</TableCell>
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

                            {/* Pagination */}
                            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-600">
                                    Page {currentPage} of {Math.ceil(filteredItems.length / pageSize) || 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(prev + 1, Math.ceil(filteredItems.length / pageSize))
                                        )
                                    }
                                    disabled={currentPage === Math.ceil(filteredItems.length / pageSize) || filteredItems.length === 0}
                                >
                                    Next
                                </Button>
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
