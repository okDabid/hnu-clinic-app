"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
    Menu,
    X,
    Home,
    User,
    Loader2,
    Eye,
    EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
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
    DialogTrigger,
} from "@/components/ui/dialog";

// Types
type Profile = {
    user_id: string;
    username: string;
    role: string;
    status: "Active" | "Inactive";
    fname: string;
    mname?: string | null;
    lname: string;
    date_of_birth?: string;
    contactno?: string | null;
    address?: string | null;
    bloodtype?: string | null;
    allergies?: string | null;
    medical_cond?: string | null;
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

export default function DoctorAccountPage() {
    const { data: session } = useSession();
    const [menuOpen] = useState(false);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Load profile
    async function loadProfile() {
        try {
            setLoading(true);
            const res = await fetch("/api/doctor/account/me", { cache: "no-store" });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setProfile(data.profile);
            }
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    }

    // Save profile
    async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await fetch("/api/doctor/account/me", {
                method: "PUT",
                body: JSON.stringify({ profile }),
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                toast.success("Profile updated!");
                loadProfile();
            }
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link href="/doctor" className="flex items-center gap-2 hover:text-green-600">
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link href="/doctor/account" className="flex items-center gap-2 text-green-600 font-semibold">
                        <User className="h-5 w-5" /> Account
                    </Link>
                </nav>
                <Separator className="my-6" />
                <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    onClick={() => signOut({ callbackUrl: "/login?logout=success" })}
                >
                    Logout
                </Button>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col">
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">My Account</h2>

                    {/* Mobile menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/doctor/account">Account</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Content */}
                <section className="px-6 py-8 max-w-4xl mx-auto w-full">
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-green-600">Edit Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <p className="text-gray-500">Loading profile...</p>
                            ) : profile ? (
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    {/* Read-only */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>User ID</Label>
                                            <Input value={profile.username} disabled />
                                        </div>
                                        <div>
                                            <Label>Role</Label>
                                            <Input value={profile.role} disabled />
                                        </div>
                                    </div>

                                    {/* Editable fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label>First Name</Label>
                                            <Input
                                                value={profile.fname}
                                                onChange={(e) => setProfile({ ...profile, fname: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Middle Name</Label>
                                            <Input
                                                value={profile.mname || ""}
                                                onChange={(e) => setProfile({ ...profile, mname: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Last Name</Label>
                                            <Input
                                                value={profile.lname}
                                                onChange={(e) => setProfile({ ...profile, lname: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Contact No</Label>
                                            <Input
                                                value={profile.contactno || ""}
                                                onChange={(e) => setProfile({ ...profile, contactno: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Address</Label>
                                            <Input
                                                value={profile.address || ""}
                                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                        disabled={saving}
                                    >
                                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </form>
                            ) : (
                                <p className="text-red-500">Profile not found</p>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    );
}
