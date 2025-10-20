"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Search } from "lucide-react";

import { NurseLayout } from "@/components/nurse/nurse-layout";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";


import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

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

// Types
type ArchivedReplenishment = {
    replenishment_id: string;
    med_id: string;
    item_name: string;
    category: string | null;
    item_type?: string | null;
    strength?: number | null;
    unit?: string | null;
    clinic: { clinic_name: string; clinic_location?: string } | null;
    quantity_archived: number;
    expiry_date: string;
    archivedAt: string;
};

type InventoryItem = {
    med_id: string;
    item_name: string;
    quantity: number;
    category: string;
    item_type?: string;
    strength?: number;
    unit?: string;
    clinic: { clinic_name: string; clinic_location?: string };
    replenishments: { expiry_date: string; remaining_qty: number; status: string; daysLeft: number }[];
    archivedReplenishments: ArchivedReplenishment[];
};

type Clinic = {
    clinic_id: string;
    clinic_name: string;
};

export default function NurseInventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [archivedBatches, setArchivedBatches] = useState<ArchivedReplenishment[]>([]);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [units, setUnits] = useState<string[]>([]);
    const [medTypes, setMedTypes] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [clinicFilter, setClinicFilter] = useState("All");

    // Separate loading states
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [savingStock, setSavingStock] = useState(false);
    // no menu state needed; navigation handled by NurseLayout

    // Load inventory
    async function loadInventory() {
        try {
            setLoadingInventory(true);
            const res = await fetch("/api/nurse/inventory", { cache: "no-store" });
            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
                return;
            }

            setItems(data.inventory);
            setArchivedBatches(data.archived ?? []);

            if (data.expiredDeducted > 0) {
                toast.warning(`Auto-deducted ${data.expiredDeducted} expired units from stock.`, {
                    duration: 5000,
                });
            }
        } catch {
            toast.error("Failed to load inventory.");
        } finally {
            setLoadingInventory(false);
        }
    }

    // Load clinics
    async function loadClinics() {
        try {
            const res = await fetch("/api/nurse/clinic", { cache: "no-store" });
            const data = await res.json();
            setClinics(data);
        } catch {
            toast.error("Failed to load clinics.");
        }
    }

    // Load enums
    async function loadEnums() {
        try {
            const res = await fetch("/api/enums", { cache: "no-store" });
            const data = await res.json();
            setCategories(data.categories);
            setUnits(data.units);
            setMedTypes(data.medTypes);
        } catch {
            toast.error("Failed to load enums.");
        }
    }

    useEffect(() => {
        loadInventory();
        loadClinics();
        loadEnums();
    }, []);

    // Status checker
    const getBadgeStyles = (status: string) => {
        switch (status) {
            case "Expired":
                return "bg-red-100 text-red-700 border-red-200";
            case "Expiring Very Soon":
                return "bg-orange-100 text-orange-700 border-orange-200";
            case "Expiring Soon":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Valid":
            default:
                return "bg-green-100 text-green-700 border-green-200";
        }
    };

    // Apply filters
    const filteredItems = items.filter((i) => {
        const matchesSearch =
            i.item_name.toLowerCase().includes(search.toLowerCase()) ||
            i.clinic.clinic_name.toLowerCase().includes(search.toLowerCase());

        const matchesClinic =
            clinicFilter === "All" || i.clinic.clinic_name === clinicFilter;

        const matchesStatus =
            statusFilter === "All" ||
            (statusFilter === "Expired" && i.archivedReplenishments.length > 0) ||
            (statusFilter === "Expiring Very Soon" &&
                i.replenishments.some((r) => r.status === "Expiring Very Soon")) ||
            (statusFilter === "Expiring Soon" &&
                i.replenishments.some((r) => r.status === "Expiring Soon")) ||
            (statusFilter === "Valid" &&
                i.replenishments.some((r) => r.status === "Valid"));

        return matchesSearch && matchesClinic && matchesStatus;
    });



    return (
        <NurseLayout
            title="Inventory Management"
            description="Monitor clinic stocks, update batch details, and keep replenishments on track."
        >
            <section className="px-4 sm:px-6 pt-6 sm:pt-8 pb-12 space-y-10 w-full max-w-7xl mx-auto flex-1 flex flex-col">
                <Card className="flex-1 flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">Stock List</CardTitle>

                        {/* Controls: responsive like accounts page */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search items or clinics..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full sm:w-44 border rounded p-2"
                            >
                                <option value="All">All</option>
                                <option value="Valid">Valid</option>
                                <option value="Expiring Soon">Expiring Soon</option>
                                <option value="Expiring Very Soon">Expiring Very Soon</option>
                                <option value="Expired">Expired</option>
                            </select>

                            {/* Clinic Filter */}
                            <select
                                value={clinicFilter}
                                onChange={(e) => setClinicFilter(e.target.value)}
                                className="w-full sm:w-48 border rounded p-2"
                            >
                                <option value="All">All Clinics</option>
                                {clinics.map((clinic) => (
                                    <option key={clinic.clinic_id} value={clinic.clinic_name}>
                                        {clinic.clinic_name}
                                    </option>
                                ))}
                            </select>

                            {/* Add Stock */}
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                                        <Plus className="h-4 w-4 mr-1" /> Add Stock
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[95%] max-w-lg rounded-xl">
                                    <DialogHeader>
                                        <DialogTitle>Add New Stock</DialogTitle>
                                        <DialogDescription>Fill in the details of the stock item.</DialogDescription>
                                    </DialogHeader>

                                    <form
                                        className="space-y-4"
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget as HTMLFormElement;
                                            setSavingStock(true);

                                            const body = {
                                                clinic_id: (form.elements.namedItem("clinic_id") as HTMLSelectElement).value,
                                                item_name: (form.elements.namedItem("item_name") as HTMLInputElement).value,
                                                quantity: Number((form.elements.namedItem("quantity") as HTMLInputElement).value),
                                                expiry: (form.elements.namedItem("expiry") as HTMLInputElement).value,
                                                category: (form.elements.namedItem("category") as HTMLSelectElement).value,
                                                item_type: (form.elements.namedItem("item_type") as HTMLSelectElement).value,
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

                                            setSavingStock(false);
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
                                            <Label className="block mb-1">Category</Label>
                                            <select name="category" required className="w-full border rounded p-2">
                                                <option value="">Select category</option>
                                                {categories.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="block mb-1">Item Type</Label>
                                            <select name="item_type" required className="w-full border rounded p-2">
                                                <option value="">Select type</option>
                                                {medTypes.map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="block mb-1">Strength</Label>
                                            <Input type="number" step="0.01" name="strength" placeholder="e.g., 500" />
                                        </div>

                                        <div>
                                            <Label className="block mb-1">Unit</Label>
                                            <select name="unit" className="w-full border rounded p-2">
                                                <option value="">Select unit</option>
                                                {units.map((u) => (
                                                    <option key={u} value={u}>{u}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <Label className="block mb-1">Expiry Date</Label>
                                            <Input type="date" name="expiry" required />
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                                disabled={savingStock}
                                            >
                                                {savingStock ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Saving...
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

                    <CardContent className="flex-1 flex flex-col">
                        {loadingInventory ? (
                            <div className="flex items-center justify-center py-10 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Loading inventory...
                            </div>
                        ) : (
                            <div className="overflow-x-auto flex-1">
                                <Table className="min-w-[860px]">
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
                                                            {item.replenishments.length > 0 ? (
                                                                item.replenishments.map((rep, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm"
                                                                    >
                                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                                            <div className="flex flex-col">
                                                                                <span className="font-medium text-gray-800">
                                                                                    {new Date(rep.expiry_date).toLocaleDateString()}
                                                                                </span>
                                                                                <span className="text-xs text-gray-500">
                                                                                    Qty left: {rep.remaining_qty}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className={getBadgeStyles(rep.status)}>
                                                                                    {rep.status}
                                                                                </Badge>
                                                                                <span className="text-sm text-gray-600">
                                                                                    {rep.daysLeft >= 0
                                                                                        ? `(${rep.daysLeft} day${rep.daysLeft === 1 ? "" : "s"} left)`
                                                                                        : "Expired"}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-500">
                                                                    All batches for this item are archived or expired.
                                                                </div>
                                                            )}

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

                    <Card className="rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                            Archived (Expired) Batches
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col">
                        <div className="overflow-x-auto">
                            <Table className="min-w-[860px]">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Clinic</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Item Type</TableHead>
                                        <TableHead>Strength</TableHead>
                                        <TableHead>Quantity Archived</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Archived On</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {archivedBatches.length > 0 ? (
                                        archivedBatches.map((batch) => (
                                            <TableRow key={batch.replenishment_id} className="hover:bg-green-50">
                                                <TableCell>{batch.clinic?.clinic_name ?? "-"}</TableCell>
                                                <TableCell>{batch.item_name}</TableCell>
                                                <TableCell>{batch.category ?? "-"}</TableCell>
                                                <TableCell>{batch.item_type ?? "-"}</TableCell>
                                                <TableCell>
                                                    {batch.strength ? `${batch.strength} ${batch.unit ?? ""}` : "-"}
                                                </TableCell>
                                                <TableCell>{batch.quantity_archived}</TableCell>
                                                <TableCell>
                                                    {new Date(batch.expiry_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>{new Date(batch.archivedAt).toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-gray-500 py-6">
                                                No archived batches yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
