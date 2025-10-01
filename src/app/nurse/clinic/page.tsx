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
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Clinic = {
    clinic_id: string;
    clinic_name: string;
    clinic_location: string;
    clinic_contactno: string;
};

export default function NurseClinicPage() {
    const [menuOpen] = useState(false);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);

    // Load clinics
    async function loadClinics() {
        const res = await fetch("/api/nurse/clinic");
        const data = await res.json();
        setClinics(data);
    }

    useEffect(() => {
        loadClinics();
    }, []);

    // Add new clinic
    async function handleAddClinic(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const payload = {
            clinic_name: formData.get("clinic_name"),
            clinic_location: formData.get("clinic_location"),
            clinic_contactno: formData.get("clinic_contactno"),
        };
        const res = await fetch("/api/nurse/clinic", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
            toast.success("Clinic added!");
            loadClinics();
        } else toast.error("Failed to add clinic");
    }

    // Update clinic
    async function handleUpdateClinic(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedClinic) return;
        const formData = new FormData(e.currentTarget);
        const payload = {
            clinic_name: selectedClinic.clinic_name, // keep original name
            clinic_location: formData.get("clinic_location"),
            clinic_contactno: formData.get("clinic_contactno"),
        };

        const res = await fetch(`/api/nurse/clinic/${selectedClinic.clinic_id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
            toast.success("Clinic updated!");
            loadClinics();
        } else toast.error("Failed to update clinic");
    }

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
                    <Link href="/nurse/clinic" className="flex items-center gap-2 text-green-600 font-semibold">
                        <ClipboardList className="h-5 w-5" /> Clinic
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
                    <h2 className="text-xl font-bold text-green-600">Clinic Management</h2>
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
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Clinics Section */}
                <section className="px-6 py-10 space-y-6 max-w-6xl mx-auto w-full flex-1">
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl text-green-600">Clinics</CardTitle>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700">+ Add Clinic</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Clinic</DialogTitle>
                                        <DialogDescription>Fill in the clinic details.</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddClinic} className="space-y-4">
                                        <div>
                                            <Label>Clinic Name</Label>
                                            <Input name="clinic_name" required />
                                        </div>
                                        <div>
                                            <Label>Location</Label>
                                            <Input name="clinic_location" required />
                                        </div>
                                        <div>
                                            <Label>Contact No</Label>
                                            <Input name="clinic_contactno" required />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" className="bg-green-600 hover:bg-green-700">Save</Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>

                        <CardContent>
                            <table className="w-full border-collapse border border-gray-200">
                                <thead className="bg-green-50">
                                    <tr>
                                        <th className="border p-2">Name</th>
                                        <th className="border p-2">Location</th>
                                        <th className="border p-2">Contact</th>
                                        <th className="border p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clinics.map((clinic) => (
                                        <tr key={clinic.clinic_id} className="hover:bg-green-50">
                                            <td className="border p-2">{clinic.clinic_name}</td>
                                            <td className="border p-2">{clinic.clinic_location}</td>
                                            <td className="border p-2">{clinic.clinic_contactno}</td>
                                            <td className="border p-2">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelectedClinic(clinic)}
                                                        >
                                                            Update
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Update Clinic</DialogTitle>
                                                            <DialogDescription>Update location or contact number.</DialogDescription>
                                                        </DialogHeader>
                                                        <form onSubmit={handleUpdateClinic} className="space-y-4">
                                                            <div>
                                                                <Label>Location</Label>
                                                                <Input
                                                                    name="clinic_location"
                                                                    defaultValue={clinic.clinic_location}
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Contact No</Label>
                                                                <Input
                                                                    name="clinic_contactno"
                                                                    defaultValue={clinic.clinic_contactno}
                                                                    required
                                                                />
                                                            </div>
                                                            <DialogFooter>
                                                                <Button type="submit" className="bg-green-600 hover:bg-green-700">Save Changes</Button>
                                                            </DialogFooter>
                                                        </form>
                                                    </DialogContent>
                                                </Dialog>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
