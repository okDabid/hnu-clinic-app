"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Menu, X, Home, User, Loader2, Cog, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [menuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    async function handleLogout() {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    }

    async function loadProfile() {
        try {
            const res = await fetch("/api/doctor/account/me", { cache: "no-store" });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                setProfile({
                    user_id: data.accountId,
                    username: data.username,
                    role: data.role,
                    status: data.status,
                    fname: data.profile?.fname || "",
                    mname: data.profile?.mname || "",
                    lname: data.profile?.lname || "",
                    date_of_birth: data.profile?.date_of_birth || "",
                    contactno: data.profile?.contactno || "",
                    address: data.profile?.address || "",
                    bloodtype: data.profile?.bloodtype || "",
                    allergies: data.profile?.allergies || "",
                    medical_cond: data.profile?.medical_cond || "",
                    emergencyco_name: data.profile?.emergencyco_name || "",
                    emergencyco_num: data.profile?.emergencyco_num || "",
                    emergencyco_relation: data.profile?.emergencyco_relation || "",
                });
            }
        } catch {
            toast.error("Failed to load profile");
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!profile) return;

        if (!profile.fname.trim() || !profile.lname.trim()) {
            toast.error("First and Last Name are required.");
            return;
        }

        try {
            setProfileLoading(true);
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
            setProfileLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-green-50">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-white shadow-lg p-6">
                <h1 className="text-2xl font-bold text-green-600 mb-8">HNU Clinic</h1>
                <nav className="flex flex-col gap-4 text-gray-700">
                    <Link href="/doctor" className="flex items-center gap-2 hover:text-green-600">
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link
                        href="/doctor/account"
                        className="flex items-center gap-2 text-green-600 font-semibold"
                    >
                        <User className="h-5 w-5" /> Account
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
                <header className="w-full bg-white shadow px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-xl font-bold text-green-600">My Account</h2>

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
                                <DropdownMenuItem
                                    onClick={() => signOut({ callbackUrl: "/login?logout=success" })}
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Account */}
                <section className="px-6 py-8 max-w-4xl mx-auto w-full">
                    {profile && (
                        <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                            <CardHeader className="border-b flex sm:items-center sm:justify-between gap-3">
                                <CardTitle className="text-2xl font-bold text-green-600">My Account</CardTitle>

                                {/* Password Update */}
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

                                    <DialogContent className="w-[95%] max-w-sm sm:max-w-md lg:max-w-lg rounded-xl">
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
                                            {/* Current Password */}
                                            <div>
                                                <Label>Current Password</Label>
                                                <div className="relative">
                                                    <Input type={showCurrent ? "text" : "password"} name="oldPassword" required className="pr-10" />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowCurrent(!showCurrent)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2"
                                                    >
                                                        {showCurrent ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* New Password */}
                                            <div>
                                                <Label>New Password</Label>
                                                <div className="relative">
                                                    <Input type={showNew ? "text" : "password"} name="newPassword" required className="pr-10" />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowNew(!showNew)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2"
                                                    >
                                                        {showNew ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <Label>Confirm Password</Label>
                                                <div className="relative">
                                                    <Input type={showConfirm ? "text" : "password"} name="confirmPassword" required className="pr-10" />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowConfirm(!showConfirm)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2"
                                                    >
                                                        {showConfirm ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {passwordErrors.length > 0 && (
                                                <ul className="text-sm text-red-600 space-y-1">
                                                    {passwordErrors.map((err, idx) => (
                                                        <li key={idx}>• {err}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}

                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                                    disabled={passwordLoading}
                                                >
                                                    {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                                    {passwordLoading ? "Updating..." : "Update Password"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>

                            {/* Profile */}
                            <CardContent className="pt-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    {/* Read-only */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><Label>Username</Label><Input value={profile.username} disabled /></div>
                                        <div><Label>User ID</Label><Input value={profile.user_id} disabled /></div>
                                        <div><Label>Role</Label><Input value={profile.role} disabled /></div>
                                        <div><Label>Status</Label><Input value={profile.status} disabled /></div>
                                        <div><Label>Date of Birth</Label><Input value={profile.date_of_birth?.slice(0, 10) || ""} disabled /></div>
                                    </div>

                                    {/* Editable */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div><Label>First Name</Label><Input value={profile.fname} onChange={(e) => setProfile({ ...profile, fname: e.target.value })} /></div>
                                        <div><Label>Middle Name</Label><Input value={profile.mname || ""} onChange={(e) => setProfile({ ...profile, mname: e.target.value })} /></div>
                                        <div><Label>Last Name</Label><Input value={profile.lname} onChange={(e) => setProfile({ ...profile, lname: e.target.value })} /></div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><Label>Contact No</Label><Input value={profile.contactno || ""} onChange={(e) => setProfile({ ...profile, contactno: e.target.value })} /></div>
                                        <div><Label>Address</Label><Input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><Label>Blood Type</Label><Input value={profile.bloodtype || ""} onChange={(e) => setProfile({ ...profile, bloodtype: e.target.value })} /></div>
                                        <div><Label>Allergies</Label><Input value={profile.allergies || ""} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} /></div>
                                    </div>

                                    <div><Label>Medical Conditions</Label><Input value={profile.medical_cond || ""} onChange={(e) => setProfile({ ...profile, medical_cond: e.target.value })} /></div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div><Label>Emergency Contact Name</Label><Input value={profile.emergencyco_name || ""} onChange={(e) => setProfile({ ...profile, emergencyco_name: e.target.value })} /></div>
                                        <div><Label>Emergency Contact Number</Label><Input value={profile.emergencyco_num || ""} onChange={(e) => setProfile({ ...profile, emergencyco_num: e.target.value })} /></div>
                                        <div><Label>Emergency Contact Relation</Label><Input value={profile.emergencyco_relation || ""} onChange={(e) => setProfile({ ...profile, emergencyco_relation: e.target.value })} /></div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                        disabled={profileLoading}
                                    >
                                        {profileLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {profileLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </section>

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Doctor Panel
                </footer>
            </main>
        </div>
    );
}
