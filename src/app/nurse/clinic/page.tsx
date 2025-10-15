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
    Loader2,
    Pill,
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
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

type Clinic = {
    clinic_id: string;
    clinic_name: string;
    clinic_location: string;
    clinic_contactno: string;
};

export default function NurseClinicPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [loading, setLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    async function loadClinics() {
        const res = await fetch("/api/nurse/clinic");
        const data = await res.json();
        setClinics(data);
    }

    useEffect(() => {
        loadClinics();
    }, []);

    async function handleAddClinic(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
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

        setLoading(false);
        if (res.ok) {
            toast.success("Clinic added!");
            loadClinics();
        } else if (res.status === 409) {
            toast.error("Clinic with this name already exists");
        } else {
            toast.error("Failed to add clinic");
        }
    }

    async function handleUpdateClinic(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selectedClinic) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const payload = {
            clinic_name: selectedClinic.clinic_name,
            clinic_location: formData.get("clinic_location"),
            clinic_contactno: formData.get("clinic_contactno"),
        };

        const res = await fetch(`/api/nurse/clinic/${selectedClinic.clinic_id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
        });

        setLoading(false);
        if (res.ok) {
            toast.success("Clinic updated!");
            loadClinics();
        } else if (res.status === 409) {
            toast.error("Another clinic with this name already exists");
        } else {
            toast.error("Failed to update clinic");
        }
    }

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
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-600 font-semibold bg-green-100 hover:bg-green-200 transition-colors duration-200"
                    >
                        <ClipboardList className="h-5 w-5" />
                        Clinic
                    </Link>

                    <Link
                        href="/nurse/dispense"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 hover:text-green-700 transition-all duration-200"
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

            {/* Main Content */}
            <main className="flex-1 w-full overflow-x-hidden flex flex-col">
                {/* Header */}
                <header className="w-full bg-white shadow px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-lg sm:text-xl font-bold text-green-600">
                        Clinic Management
                    </h2>
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                >
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
                                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Clinics Section */}
                <section className="px-4 sm:px-6 py-6 sm:py-10 space-y-6 max-w-6xl mx-auto w-full flex-1">
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition flex flex-col">
                        <CardHeader className="border-b">
                            <div className="flex justify-between items-center flex-wrap gap-3">
                                <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                    Clinics
                                </CardTitle>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                                            + Add Clinic
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Clinic</DialogTitle>
                                            <DialogDescription>Fill in the clinic details.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAddClinic} className="space-y-4">
                                            <div>
                                                <Label className="block mb-1">Clinic Name</Label>
                                                <Input name="clinic_name" required />
                                            </div>
                                            <div>
                                                <Label className="block mb-1">Location</Label>
                                                <Input name="clinic_location" required />
                                            </div>
                                            <div>
                                                <Label className="block mb-1">Contact No</Label>
                                                <Input name="clinic_contactno" required />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                                                >
                                                    {loading ? (
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


                        <CardContent className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200 text-sm sm:text-base">
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
                                        <tr key={clinic.clinic_id} className="hover:bg-green-50 transition">
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
                                                            <DialogDescription>
                                                                Update location or contact number.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <form onSubmit={handleUpdateClinic} className="space-y-4">
                                                            <div>
                                                                <Label className="block mb-1">Location</Label>
                                                                <Input
                                                                    name="clinic_location"
                                                                    defaultValue={clinic.clinic_location}
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="block mb-1">Contact No</Label>
                                                                <Input
                                                                    name="clinic_contactno"
                                                                    defaultValue={clinic.clinic_contactno}
                                                                    required
                                                                />
                                                            </div>
                                                            <DialogFooter>
                                                                <Button
                                                                    type="submit"
                                                                    disabled={loading}
                                                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                                                >
                                                                    {loading ? (
                                                                        <>
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                            Saving changes...
                                                                        </>
                                                                    ) : (
                                                                        "Save Changes"
                                                                    )}
                                                                </Button>
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
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto text-sm sm:text-base">
                    © {new Date().getFullYear()} HNU Clinic – Nurse Panel
                </footer>
            </main>
        </div>
    );
}
