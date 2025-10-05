"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
    Menu,
    X,
    Home,
    User,
    Loader2,
    ClipboardList,
    CalendarDays,
    Bell,
    Eye,
    EyeOff,
    Cog,
} from "lucide-react";

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
    gender?: string | null;
    department?: string | null;
    program?: string | null;
    specialization?: string | null;
    year_level?: string | null;
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

export default function PatientAccountPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [menuOpen] = useState(false);

    // Password state
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
            const res = await fetch("/api/patient/account/me", { cache: "no-store" });
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
                    gender: data.profile?.gender || "",
                    department: data.profile?.department || "",
                    program: data.profile?.program || "",
                    specialization: data.profile?.specialization || "",
                    year_level: data.profile?.year_level || "",
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
            const res = await fetch("/api/patient/account/me", {
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
                    <Link href="/patient" className="flex items-center gap-2 hover:text-green-600">
                        <Home className="h-5 w-5" /> Dashboard
                    </Link>
                    <Link href="/patient/account" className="flex items-center gap-2 text-green-600 font-semibold">
                        <User className="h-5 w-5" /> Account
                    </Link>
                    <Link href="/patient/appointments" className="flex items-center gap-2 hover:text-green-600">
                        <CalendarDays className="h-5 w-5" /> Appointments
                    </Link>
                    <Link href="/patient/services" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Services
                    </Link>
                    <Link href="/patient/notifications" className="flex items-center gap-2 hover:text-green-600">
                        <Bell className="h-5 w-5" /> Notifications
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
                    <h2 className="text-xl font-bold text-green-600">Edit Profile</h2>

                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href="/patient">Dashboard</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/patient/account">Account</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/patient/appointments">Appointments</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/patient/services">Services</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/patient/notifications">Notifications</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Account Section */}
                <section className="px-6 py-8 max-w-4xl mx-auto w-full">
                    {profile && (
                        <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                            <CardHeader className="border-b flex sm:items-center sm:justify-between gap-3">
                                <CardTitle className="text-2xl font-bold text-green-600">My Account</CardTitle>

                                {/* ✅ Password Dialog with Full Validation */}
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
                                                Change your account password securely. Enter your current password and set a new one.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                const form = e.currentTarget;
                                                const oldPassword = (form.elements.namedItem("oldPassword") as HTMLInputElement).value;
                                                const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
                                                const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

                                                const errors: string[] = [];
                                                if (newPassword.length < 8) errors.push("Password must be at least 8 characters.");
                                                if (!/[A-Z]/.test(newPassword)) errors.push("Must contain an uppercase letter.");
                                                if (!/[a-z]/.test(newPassword)) errors.push("Must contain a lowercase letter.");
                                                if (!/\d/.test(newPassword)) errors.push("Must contain a number.");
                                                if (!/[^\w\s]/.test(newPassword)) errors.push("Must contain a symbol.");
                                                if (newPassword !== confirmPassword) errors.push("Passwords do not match.");

                                                if (errors.length > 0) {
                                                    setPasswordErrors(errors);
                                                    return;
                                                }

                                                try {
                                                    setPasswordLoading(true);
                                                    const res = await fetch("/api/patient/account/password", {
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
                                                    <Input
                                                        type={showCurrent ? "text" : "password"}
                                                        name="oldPassword"
                                                        required
                                                        className="pr-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowCurrent(!showCurrent)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                                                    >
                                                        {showCurrent ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* New Password */}
                                            <div>
                                                <Label>New Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showNew ? "text" : "password"}
                                                        name="newPassword"
                                                        required
                                                        className="pr-10"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const errs: string[] = [];
                                                            if (val.length < 8) errs.push("Password must be at least 8 characters.");
                                                            if (!/[A-Z]/.test(val)) errs.push("Must contain an uppercase letter.");
                                                            if (!/[a-z]/.test(val)) errs.push("Must contain a lowercase letter.");
                                                            if (!/\d/.test(val)) errs.push("Must contain a number.");
                                                            if (!/[^\w\s]/.test(val)) errs.push("Must contain a symbol.");
                                                            setPasswordErrors(errs);
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowNew(!showNew)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                                                    >
                                                        {showNew ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <Label>Confirm New Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showConfirm ? "text" : "password"}
                                                        name="confirmPassword"
                                                        required
                                                        className="pr-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowConfirm(!showConfirm)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                                                    >
                                                        {showConfirm ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Validation Errors */}
                                            {passwordErrors.length > 0 && (
                                                <ul className="text-sm text-red-600 space-y-1">
                                                    {passwordErrors.map((err, idx) => (
                                                        <li key={idx}>• {err}</li>
                                                    ))}
                                                </ul>
                                            )}

                                            {passwordMessage && (
                                                <p className="text-sm text-green-600">{passwordMessage}</p>
                                            )}

                                            <DialogFooter className="pt-2">
                                                <Button
                                                    type="submit"
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                    disabled={passwordLoading}
                                                >
                                                    {passwordLoading ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                                                        </>
                                                    ) : (
                                                        "Update Password"
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>

                            {/* Profile Form */}
                            <CardContent className="pt-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    {/* System Info (read-only) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>User ID</Label>
                                            <Input value={profile.user_id} disabled />
                                        </div>
                                        <div>
                                            <Label>Username</Label>
                                            <Input value={profile.username} disabled />
                                        </div>
                                        <div>
                                            <Label>Role</Label>
                                            <Input value={profile.role} disabled />
                                        </div>
                                        <div>
                                            <Label>Status</Label>
                                            <Input value={profile.status} disabled />
                                        </div>
                                        <div>
                                            <Label>Date of Birth</Label>
                                            <Input value={profile.date_of_birth?.slice(0, 10) || ""} disabled />
                                        </div>
                                        <div>
                                            <Label>Gender</Label>
                                            <Input value={profile.gender || ""} disabled />
                                        </div>
                                    </div>

                                    {/* Academic Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Department</Label>
                                            <Input value={profile.department || ""} disabled />
                                        </div>
                                        <div>
                                            <Label>Program</Label>
                                            <Input value={profile.program || ""} disabled />
                                        </div>
                                        <div>
                                            <Label>Specialization</Label>
                                            <Input value={profile.specialization || ""} disabled />
                                        </div>
                                        <div>
                                            <Label>Year Level</Label>
                                            <Input value={profile.year_level || ""} disabled />
                                        </div>
                                    </div>

                                    {/* Editable Fields */}
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
                                            <Label>Contact No.</Label>
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

                                    {/* Medical Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Blood Type</Label>
                                            <Input
                                                value={profile.bloodtype || ""}
                                                onChange={(e) => setProfile({ ...profile, bloodtype: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label>Allergies</Label>
                                            <Input
                                                value={profile.allergies || ""}
                                                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Medical Conditions</Label>
                                        <Input
                                            value={profile.medical_cond || ""}
                                            onChange={(e) => setProfile({ ...profile, medical_cond: e.target.value })}
                                        />
                                    </div>

                                    {/* Emergency Contact Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label>Emergency Contact Name</Label>
                                            <Input
                                                value={profile.emergencyco_name || ""}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, emergencyco_name: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Emergency Contact Number</Label>
                                            <Input
                                                value={profile.emergencyco_num || ""}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, emergencyco_num: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Relation</Label>
                                            <Input
                                                value={profile.emergencyco_relation || ""}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, emergencyco_relation: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                        disabled={profileLoading}
                                    >
                                        {profileLoading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </section>

                <footer className="bg-white py-6 text-center text-gray-600 mt-auto">
                    © {new Date().getFullYear()} HNU Clinic – Patient Panel
                </footer>
            </main>
        </div>
    );
}

