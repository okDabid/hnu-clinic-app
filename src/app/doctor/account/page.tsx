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
    Cog,
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

    // Password states
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

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
                <section className="px-6 py-8 max-w-4xl mx-auto w-full space-y-10">
                    {/* Profile */}
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle className="text-2xl font-bold text-green-600">Edit Profile</CardTitle>

                            {/* Password update dialog */}
                            <Dialog
                                onOpenChange={(open) => {
                                    if (!open) {
                                        setPasswordErrors([]);
                                        setPasswordMessage(null);
                                        setPasswordLoading(false);
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="hover:bg-green-50">
                                        <Cog className="h-5 w-5 text-green-600" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[95%] max-w-md rounded-xl">
                                    <DialogHeader>
                                        <DialogTitle>Update Password</DialogTitle>
                                        <DialogDescription>
                                            Change your account password securely.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const form = e.currentTarget as HTMLFormElement;
                                            const oldPassword = (form.elements.namedItem("oldPassword") as HTMLInputElement).value;
                                            const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
                                            const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

                                            const errors: string[] = [];
                                            if (newPassword.length < 8) errors.push("Password must be at least 8 characters.");
                                            if (!/[a-z]/.test(newPassword)) errors.push("Must contain a lowercase letter.");
                                            if (!/[A-Z]/.test(newPassword)) errors.push("Must contain an uppercase letter.");
                                            if (!/\d/.test(newPassword)) errors.push("Must contain a number.");
                                            if (!/[^\w\s]/.test(newPassword)) errors.push("Must contain a symbol.");
                                            if (newPassword !== confirmPassword) errors.push("Passwords do not match.");

                                            if (errors.length > 0) {
                                                setPasswordErrors(errors);
                                                return;
                                            }

                                            try {
                                                setPasswordLoading(true);
                                                const res = await fetch("/api/doctor/account/password", {
                                                    method: "PUT",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ oldPassword, newPassword }),
                                                });
                                                const data = await res.json();
                                                if (data.error) {
                                                    setPasswordErrors([data.error]);
                                                } else {
                                                    setPasswordMessage("Password updated successfully!");
                                                    toast.success("Password updated successfully!");
                                                    form.reset();
                                                }
                                            } catch {
                                                setPasswordErrors(["Failed to update password. Please try again."]);
                                            } finally {
                                                setPasswordLoading(false);
                                            }
                                        }}
                                        className="space-y-4"
                                    >
                                        {/* Current password */}
                                        <div className="relative">
                                            <Label>Current Password</Label>
                                            <Input type={showCurrent ? "text" : "password"} name="oldPassword" required className="pr-10" />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowCurrent(!showCurrent)}
                                                className="absolute right-1 top-7 hover:bg-transparent"
                                            >
                                                {showCurrent ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                            </Button>
                                        </div>

                                        {/* New password */}
                                        <div className="relative">
                                            <Label>New Password</Label>
                                            <Input type={showNew ? "text" : "password"} name="newPassword" required className="pr-10" />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowNew(!showNew)}
                                                className="absolute right-1 top-7 hover:bg-transparent"
                                            >
                                                {showNew ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                            </Button>
                                        </div>

                                        {/* Confirm password */}
                                        <div className="relative">
                                            <Label>Confirm Password</Label>
                                            <Input type={showConfirm ? "text" : "password"} name="confirmPassword" required className="pr-10" />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-1 top-7 hover:bg-transparent"
                                            >
                                                {showConfirm ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                            </Button>
                                        </div>

                                        {/* Validation errors */}
                                        {passwordErrors.length > 0 && (
                                            <ul className="text-sm text-red-600 space-y-1">
                                                {passwordErrors.map((err, idx) => (
                                                    <li key={idx}>• {err}</li>
                                                ))}
                                            </ul>
                                        )}

                                        {/* Success */}
                                        {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}

                                        <DialogFooter>
                                            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white flex gap-2" disabled={passwordLoading}>
                                                {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                                {passwordLoading ? "Updating..." : "Update Password"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>

                        {/* Profile form */}
                        <CardContent className="pt-6">
                            {loading ? (
                                <p className="text-gray-500">Loading profile...</p>
                            ) : profile ? (
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
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

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label>First Name</Label>
                                            <Input value={profile.fname} onChange={(e) => setProfile({ ...profile, fname: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>Middle Name</Label>
                                            <Input value={profile.mname || ""} onChange={(e) => setProfile({ ...profile, mname: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>Last Name</Label>
                                            <Input value={profile.lname} onChange={(e) => setProfile({ ...profile, lname: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Contact No</Label>
                                            <Input value={profile.contactno || ""} onChange={(e) => setProfile({ ...profile, contactno: e.target.value })} />
                                        </div>
                                        <div>
                                            <Label>Address</Label>
                                            <Input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
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

                {/* Footer */}
                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}
