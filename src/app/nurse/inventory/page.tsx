"use client";

import { useState, useEffect } from "react";
import { Archive, Loader2, PackageSearch, Plus, ShieldAlert } from "lucide-react";

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

import NurseInventoryLoading from "./loading";

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
    totalDispensed: number;
    walkInDispensed: number;
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
    const [inventoryLoaded, setInventoryLoaded] = useState(false);
    const [clinicsLoaded, setClinicsLoaded] = useState(false);
    const [enumsLoaded, setEnumsLoaded] = useState(false);

    const initializing = !(inventoryLoaded && clinicsLoaded && enumsLoaded);
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
            setInventoryLoaded(true);
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
        } finally {
            setClinicsLoaded(true);
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
        } finally {
            setEnumsLoaded(true);
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
            (statusFilter === "Expired" &&
                (i.archivedReplenishments.length > 0 ||
                    i.replenishments.some((r) => r.status === "Expired"))) ||
            (statusFilter === "Expiring Very Soon" &&
                i.replenishments.some((r) => r.status === "Expiring Very Soon")) ||
            (statusFilter === "Expiring Soon" &&
                i.replenishments.some((r) => r.status === "Expiring Soon")) ||
            (statusFilter === "Valid" &&
                i.replenishments.some((r) => r.status === "Valid"));

        return matchesSearch && matchesClinic && matchesStatus;
    });

    const totalInventoryQuantity = items.reduce((total, item) => total + item.quantity, 0);
    const expiringSoonCount = items.reduce(
        (count, item) =>
            count +
            item.replenishments.filter((rep) =>
                ["Expiring Very Soon", "Expiring Soon"].includes(rep.status)
            ).length,
        0
    );
    const expiredCount = archivedBatches.length;



    if (initializing) {
        return <NurseInventoryLoading />;
    }

    return (
        <NurseLayout
            title="Inventory Management"
            description="Monitor clinic stocks, update batch details, and keep replenishments on track."
        >
            <section className="relative px-4 sm:px-6 pt-6 sm:pt-10 pb-12 space-y-10 w-full max-w-7xl mx-auto flex-1 flex flex-col">
                <div className="absolute inset-x-0 -top-10 -z-10 h-72 bg-gradient-to-br from-green-100 via-white to-white blur-3xl opacity-60" />
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-green-100 bg-white px-5 py-4 shadow-sm shadow-green-100/40">
                        <div className="flex items-center justify-between text-sm text-green-700">
                            <span>Total Items</span>
                            <PackageSearch className="h-4 w-4" />
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-green-900">{items.length}</p>
                        <p className="text-xs text-slate-600">Across all clinics</p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-white px-5 py-4 shadow-sm shadow-amber-100/40">
                        <div className="flex items-center justify-between text-sm text-amber-700">
                            <span>Expiring Soon</span>
                            <ShieldAlert className="h-4 w-4" />
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-amber-900">{expiringSoonCount}</p>
                        <p className="text-xs text-amber-600/80">Batches need attention</p>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-white px-5 py-4 shadow-sm shadow-rose-100/50">
                        <div className="flex items-center justify-between text-sm text-rose-700">
                            <span>Archived Units</span>
                            <Archive className="h-4 w-4" />
                        </div>
                        <p className="mt-2 text-2xl font-semibold text-rose-900">{expiredCount}</p>
                        <p className="text-xs text-rose-600/80">Expired or archived batches</p>
                    </div>
                </div>

                <Card className="flex-1 flex flex-col rounded-3xl border border-green-100/70 bg-white shadow-lg shadow-green-100/40">
                    <CardHeader className="flex flex-col gap-5 border-b border-green-50 bg-gradient-to-br from-white via-green-50 to-white rounded-t-3xl">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                            <div>
                                <CardTitle className="text-xl sm:text-2xl font-bold text-green-900">Stock Overview</CardTitle>
                                <p className="text-sm text-slate-600">{totalInventoryQuantity.toLocaleString()} total units in circulation</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                                <div className="relative w-full sm:w-72">
                                    <Input
                                        placeholder="Search items or clinics"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-10 rounded-xl border border-green-100 bg-white pl-10 text-sm shadow-inner shadow-green-100/60 focus-visible:ring-green-200"
                                    />
                                    <PackageSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-400" />
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="h-10 rounded-xl border border-green-100 bg-white px-3 text-sm font-medium text-green-700 shadow-inner shadow-green-100/60 focus:outline-none focus:ring-2 focus:ring-green-200"
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="Valid">Valid</option>
                                        <option value="Expiring Soon">Expiring Soon</option>
                                        <option value="Expiring Very Soon">Expiring Very Soon</option>
                                        <option value="Expired">Expired</option>
                                    </select>

                                    <select
                                        value={clinicFilter}
                                        onChange={(e) => setClinicFilter(e.target.value)}
                                        className="h-10 rounded-xl border border-green-100 bg-white px-3 text-sm font-medium text-green-700 shadow-inner shadow-green-100/60 focus:outline-none focus:ring-2 focus:ring-green-200"
                                    >
                                        <option value="All">All Clinics</option>
                                        {clinics.map((clinic) => (
                                            <option key={clinic.clinic_id} value={clinic.clinic_name}>
                                                {clinic.clinic_name}
                                            </option>
                                        ))}
                                    </select>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="h-10 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm shadow-green-200 transition hover:-translate-y-[1px] hover:bg-green-700">
                                                <Plus className="h-4 w-4" />
                                                <span className="ml-2">Add Stock</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="w-[95%] max-w-lg rounded-2xl border border-green-100">
                                            <DialogHeader>
                                                <DialogTitle className="text-lg font-semibold text-green-900">Add New Stock</DialogTitle>
                                                <DialogDescription className="text-sm text-slate-600">
                                                    Fill in the details of the stock item.
                                                </DialogDescription>
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
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="sm:col-span-2">
                                                        <Label className="mb-1 block text-sm font-medium text-green-900">Clinic</Label>
                                                        <select
                                                            name="clinic_id"
                                                            required
                                                            className="h-10 w-full rounded-xl border border-green-100 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                                                        >
                                                            <option value="">Select clinic</option>
                                                            {clinics.map((clinic) => (
                                                                <option key={clinic.clinic_id} value={clinic.clinic_id}>
                                                                    {clinic.clinic_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="sm:col-span-2">
                                                        <Label className="mb-1 block text-sm font-medium text-green-900">Name</Label>
                                                        <Input
                                                            name="item_name"
                                                            required
                                                            className="h-10 rounded-xl border border-green-100 bg-white text-sm focus-visible:ring-green-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="mb-1 block text-sm font-medium text-green-900">Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            name="quantity"
                                                            required
                                                            className="h-10 rounded-xl border border-green-100 bg-white text-sm focus-visible:ring-green-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="mb-1 block text-sm font-medium text-green-900">Expiry Date</Label>
                                                        <Input
                                                            type="date"
                                                            name="expiry"
                                                            required
                                                            className="h-10 rounded-xl border border-green-100 bg-white text-sm focus-visible:ring-green-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="mb-1 block text-sm font-medium text-green-900">Category</Label>
                                                        <select
                                                            name="category"
                                                            required
                                                            className="h-10 w-full rounded-xl border border-green-100 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                                                        >
                                                            <option value="">Select category</option>
                                                            {categories.map((c) => (
                                                                <option key={c} value={c}>
                                                                    {c}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <Label className="mb-1 block text-sm font-medium text-green-900">Item Type</Label>
                                                        <select
                                                            name="item_type"
                                                            required
                                                            className="h-10 w-full rounded-xl border border-green-100 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                                                        >
                                                            <option value="">Select type</option>
                                                            {medTypes.map((t) => (
                                                                <option key={t} value={t}>
                                                                    {t}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <Label className="mb-1 block text-sm font-medium text-green-900">Strength</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            name="strength"
                                                            placeholder="e.g., 500"
                                                            className="h-10 rounded-xl border border-green-100 bg-white text-sm focus-visible:ring-green-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label className="mb-1 block text-sm font-medium text-green-900">Unit</Label>
                                                        <select
                                                            name="unit"
                                                            className="h-10 w-full rounded-xl border border-green-100 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                                                        >
                                                            <option value="">Select unit</option>
                                                            {units.map((u) => (
                                                                <option key={u} value={u}>
                                                                    {u}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <DialogFooter>
                                                    <Button
                                                        type="submit"
                                                        className="w-full sm:w-auto rounded-xl bg-green-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
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
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col px-0">
                        {loadingInventory ? (
                            <div className="flex items-center justify-center py-10 text-green-600">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading inventory...
                            </div>
                        ) : (
                            <div className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table className="min-w-[860px]">
                                        <TableHeader className="bg-green-50/70">
                                            <TableRow className="text-slate-900">
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Clinic</TableHead>
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Name</TableHead>
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Category</TableHead>
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Item Type</TableHead>
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Strength</TableHead>
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Total Quantity</TableHead>
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Dispensed (All Time)</TableHead>
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Walk-in Dispensed</TableHead>
                                                <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Expiry Batches</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredItems.length > 0 ? (
                                                filteredItems.map((item) => (
                                                    <TableRow key={item.med_id} className="transition hover:bg-green-50/70">
                                                        <TableCell className="text-sm font-medium text-slate-900">
                                                            {item.clinic.clinic_name}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-800">{item.item_name}</TableCell>
                                                        <TableCell className="text-sm text-slate-800">{item.category}</TableCell>
                                                        <TableCell className="text-sm text-slate-800">{item.item_type || "-"}</TableCell>
                                                        <TableCell className="text-sm text-slate-800">
                                                            {item.strength ? `${item.strength} ${item.unit || ""}` : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-sm font-semibold text-green-800">{item.quantity}</TableCell>
                                                        <TableCell className="text-sm text-slate-800">{item.totalDispensed}</TableCell>
                                                        <TableCell className="text-sm text-slate-800">{item.walkInDispensed}</TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                {item.replenishments.length > 0 ? (
                                                                    item.replenishments.map((rep, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className="flex flex-col gap-2 rounded-xl border border-green-100 bg-green-50/60 px-3 py-2"
                                                                        >
                                                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm font-semibold text-green-900">
                                                                                        {new Date(rep.expiry_date).toLocaleDateString()}
                                                                                    </span>
                                                                                    <span className="text-xs text-green-700/80">Qty left: {rep.remaining_qty}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className={`${getBadgeStyles(rep.status)} rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide`}
                                                                                    >
                                                                                        {rep.status}
                                                                                    </Badge>
                                                                                    <span className="text-xs font-medium text-green-700/80">
                                                                                        {rep.daysLeft >= 0
                                                                                            ? `(${rep.daysLeft} day${rep.daysLeft === 1 ? "" : "s"} left)`
                                                                                            : "Expired"}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="rounded-xl border border-dashed border-green-200 bg-white/70 p-3 text-xs text-green-700/80">
                                                                        All batches for this item are archived or expired.
                                                                    </div>
                                                                )}

                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center text-sm text-slate-500 py-6">
                                                        No items found. Adjust your filters to see inventory.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border border-green-100/70 bg-white shadow-lg shadow-green-100/40">
                    <CardHeader className="flex flex-col gap-2 border-b border-green-50 bg-gradient-to-r from-white via-green-50 to-white rounded-t-3xl">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-green-900">
                            Archived (Expired) Batches
                        </CardTitle>
                        <p className="text-sm text-slate-600">Historical record of expired stocks for traceability</p>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col px-0">
                        <div className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <Table className="min-w-[860px]">
                                    <TableHeader className="bg-green-50/70">
                                        <TableRow className="text-slate-900">
                                            <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Clinic</TableHead>
                                            <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Name</TableHead>
                                            <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Category</TableHead>
                                            <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Item Type</TableHead>
                                            <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Strength</TableHead>
                                            <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Quantity Archived</TableHead>
                                            <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Expiry Date</TableHead>
                                            <TableHead className="sticky top-0 bg-green-50/90 backdrop-blur-sm">Archived On</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {archivedBatches.length > 0 ? (
                                            archivedBatches.map((batch) => (
                                                <TableRow key={batch.replenishment_id} className="transition hover:bg-green-50/70">
                                                    <TableCell className="text-sm font-medium text-slate-900">
                                                        {batch.clinic?.clinic_name ?? "-"}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-800">{batch.item_name}</TableCell>
                                                    <TableCell className="text-sm text-slate-800">{batch.category ?? "-"}</TableCell>
                                                    <TableCell className="text-sm text-slate-800">{batch.item_type ?? "-"}</TableCell>
                                                    <TableCell className="text-sm text-slate-800">
                                                        {batch.strength ? `${batch.strength} ${batch.unit ?? ""}` : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-semibold text-green-800">{batch.quantity_archived}</TableCell>
                                                    <TableCell className="text-sm text-slate-800">
                                                        {new Date(batch.expiry_date).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-slate-800">
                                                        {new Date(batch.archivedAt).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center text-sm text-slate-500 py-6">
                                                    No archived batches yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </NurseLayout>
    );
}
