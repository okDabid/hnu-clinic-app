"use client";

import { useEffect, useState } from "react";
import orderBy from "lodash/orderBy";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import {
    Menu,
    X,
    Users,
    Package,
    Home,
    Loader2,
    Ban,
    CheckCircle2,
    Search,
    ClipboardList,
    Pill,
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

import { Cog } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// 🔹 Types aligned with API
type User = {
    user_id: string;
    accountId: string;
    role: string;
    status: "Active" | "Inactive";
    fullName: string;
};

type CreateUserPayload = {
    role: string;
    fname: string;
    mname?: string | null;
    lname: string;
    date_of_birth: string;
    gender: "Male" | "Female";
    employee_id?: string | null;
    student_id?: string | null;
    school_id?: string | null;
    patientType?: "student" | "employee" | null;
};

type CreateUserResponse = {
    id?: string;
    password?: string;
    error?: string;
};

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

export default function NurseAccountsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [role, setRole] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "">("");
    const [patientType, setPatientType] = useState<"student" | "employee" | "">("");

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [menuOpen] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    // 🔹 Fetch users
    async function loadUsers() {
        try {
            const res = await fetch("/api/nurse/accounts", { cache: "no-store" });
            const data = await res.json();

            const sorted = orderBy(
                data,
                [
                    (u) => u.role,
                    (u) => {
                        const n = parseInt(u.user_id, 10);
                        return isNaN(n) ? u.user_id : n;
                    },
                ],
                ["asc", "asc"]
            );

            setUsers(sorted);
        } catch {
            toast.error("Failed to load users", { position: "top-center" });
        }
    }

    // 🔹 Fetch own profile
    async function loadProfile() {
        try {
            const res = await fetch("/api/nurse/accounts/me", { cache: "no-store" });
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
        loadUsers();
        loadProfile();
    }, []);

    const filteredUsers = users.filter(
        (u) =>
            u.user_id.toLowerCase().includes(search.toLowerCase()) ||
            u.role.toLowerCase().includes(search.toLowerCase()) ||
            u.fullName.toLowerCase().includes(search.toLowerCase())
    );

    // 🔹 Create user
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const payload: CreateUserPayload = {
            role,
            fname: formData.get("fname") as string,
            mname: formData.get("mname") as string,
            lname: formData.get("lname") as string,
            date_of_birth: formData.get("date_of_birth") as string,
            gender: gender as "Male" | "Female",
            employee_id:
                role === "NURSE" ||
                    role === "DOCTOR" ||
                    (role === "PATIENT" && patientType === "employee")
                    ? (formData.get("employee_id") as string)
                    : null,
            student_id:
                role === "PATIENT" && patientType === "student"
                    ? (formData.get("student_id") as string)
                    : null,
            school_id: role === "SCHOLAR" ? (formData.get("school_id") as string) : null,
            patientType: patientType || null,
        };

        try {
            setLoading(true);
            const res = await fetch("/api/nurse/accounts", {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });
            const data: CreateUserResponse = await res.json();

            if (data.error) {
                toast.error(data.error, { position: "top-center" });
            } else {
                toast.success(
                    <div className="text-left space-y-1">
                        <p className="font-semibold text-green-700">Account Created!</p>
                        <p>
                            <span className="font-medium">ID:</span>{" "}
                            <span className="text-green-800">{data.id}</span>
                        </p>
                        <p>
                            <span className="font-medium">Password:</span>{" "}
                            <span className="text-green-800">{data.password}</span>
                        </p>
                    </div>,
                    { position: "top-center", duration: 6000 }
                );
                loadUsers();
            }
        } catch {
            toast.error("Something went wrong. Please try again.", {
                position: "top-center",
            });
        } finally {
            setLoading(false);
        }
    }

    // 🔹 Update own profile
    async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            setProfileLoading(true);
            const res = await fetch("/api/nurse/accounts/me", {
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

    // 🔹 Toggle status
    async function handleToggle(user_id: string, current: "Active" | "Inactive") {
        const newStatus = current === "Active" ? "Inactive" : "Active";
        try {
            await fetch("/api/nurse/accounts", {
                method: "PUT",
                body: JSON.stringify({ user_id, newStatus }),
                headers: { "Content-Type": "application/json" },
            });
            toast.success(`User ${newStatus}`, { position: "top-center" });
            loadUsers();
        } catch {
            toast.error("Failed to update user status", { position: "top-center" });
        }
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
                    <Link href="/nurse/accounts" className="flex items-center gap-2 text-green-600 font-semibold">
                        <Users className="h-5 w-5" /> Accounts
                    </Link>
                    <Link href="/nurse/inventory" className="flex items-center gap-2 hover:text-green-600">
                        <Package className="h-5 w-5" /> Inventory
                    </Link>
                    <Link href="/nurse/clinic" className="flex items-center gap-2 hover:text-green-600">
                        <ClipboardList className="h-5 w-5" /> Clinic
                    </Link>
                    <Link href="/nurse/dispense" className="flex items-center gap-2 hover:text-green-600">
                        <Pill className="h-5 w-5" /> Dispense
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
                    <h2 className="text-xl font-bold text-green-600">Accounts Management</h2>

                    {/* Mobile Menu */}
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
                                <DropdownMenuItem asChild><Link href="/nurse/dispense">Dispensed</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Sections */}
                <section className="px-6 py-8 space-y-10 max-w-6xl mx-auto w-full">
                    {/* My Account */}
                    {profile && (
                        <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                            <CardHeader className="border-b flex sm:items-center sm:justify-between gap-3">
                                <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                    My Account
                                </CardTitle>

                                {/* Password Update Dialog */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="hover:bg-green-50"
                                        >
                                            <Cog className="h-5 w-5 text-green-600" />
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent className="w-[95%] max-w-sm sm:max-w-md lg:max-w-lg rounded-xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-lg sm:text-xl">Update Password</DialogTitle>
                                            <DialogDescription className="text-sm sm:text-base">
                                                Change your account password securely. Enter your current password and set a new one.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                setPasswordLoading(true);

                                                const form = e.currentTarget as HTMLFormElement;
                                                const oldPassword = (form.elements.namedItem("oldPassword") as HTMLInputElement).value;
                                                const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
                                                const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;

                                                if (newPassword !== confirmPassword) {
                                                    toast.error("New passwords do not match.", { duration: 3000 });
                                                    setPasswordLoading(false);
                                                    return;
                                                }

                                                try {
                                                    const res = await fetch("/api/nurse/accounts/password", {
                                                        method: "PUT",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ oldPassword, newPassword }),
                                                    });

                                                    const data = await res.json();
                                                    if (data.error) {
                                                        toast.error(data.error, { duration: 3000 });
                                                    } else {
                                                        toast.success("Password updated successfully!", { duration: 3000 });
                                                        form.reset();
                                                    }
                                                } catch {
                                                    toast.error("Failed to update password. Please try again.", { duration: 3000 });
                                                } finally {
                                                    setPasswordLoading(false);
                                                }
                                            }}
                                            className="space-y-4"
                                        >
                                            {/* Current Password */}
                                            <div className="flex flex-col space-y-2">
                                                <Label className="block mb-1 font-medium">Current Password</Label>
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
                                            <div className="flex flex-col space-y-2">
                                                <Label className="block mb-1 font-medium">New Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        type={showNew ? "text" : "password"}
                                                        name="newPassword"
                                                        required
                                                        className="pr-10"
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            const errors: string[] = [];
                                                            if (value.length < 8) errors.push("At least 8 characters");
                                                            if (!/[a-z]/.test(value)) errors.push("Must contain lowercase");
                                                            if (!/[A-Z]/.test(value)) errors.push("Must contain uppercase");
                                                            if (!/\d/.test(value)) errors.push("Must contain a number");
                                                            if (!/[^\w\s]/.test(value)) errors.push("Must contain a symbol");
                                                            setPasswordErrors(errors);
                                                            setPasswordMessage(errors.length === 0 ? "Strong password ✅" : null);
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setShowNew(!showNew)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                                                    >
                                                        {showNew ? (
                                                            <EyeOff className="h-5 w-5 text-gray-500" />
                                                        ) : (
                                                            <Eye className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* Show validation feedback */}
                                                <div className="text-xs text-red-600 space-y-1">
                                                    {passwordErrors.map((err, i) => (
                                                        <p key={i}>• {err}</p>
                                                    ))}
                                                </div>
                                                {passwordMessage && <p className="text-xs text-green-600">{passwordMessage}</p>}
                                            </div>


                                            {/* Confirm Password */}
                                            <div className="flex flex-col space-y-2">
                                                <Label className="block mb-1 font-medium">Confirm New Password</Label>
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

                                            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
                                                <Button
                                                    type="submit"
                                                    disabled={passwordLoading}
                                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                                >
                                                    {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                                    {passwordLoading ? "Updating..." : "Update Password"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                            </CardHeader>

                            {/* Profile Form */}
                            <CardContent className="pt-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    {/* System info (read-only) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Username</Label>
                                            <Input value={profile.user_id} disabled className="w-full" />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">User ID</Label>
                                            <Input value={profile.username} disabled className="w-full" />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Role</Label>
                                            <Input value={profile.role} disabled className="w-full" />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Status</Label>
                                            <Input value={profile.status} disabled className="w-full" />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Date of Birth</Label>
                                            <Input value={profile.date_of_birth?.slice(0, 10) || ""} disabled className="w-full" />
                                        </div>
                                    </div>

                                    {/* Editable fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">First Name</Label>
                                            <Input
                                                value={profile.fname}
                                                onChange={(e) => setProfile({ ...profile, fname: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Middle Name</Label>
                                            <Input
                                                value={profile.mname || ""}
                                                onChange={(e) => setProfile({ ...profile, mname: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Last Name</Label>
                                            <Input
                                                value={profile.lname}
                                                onChange={(e) => setProfile({ ...profile, lname: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Contact No</Label>
                                            <Input
                                                value={profile.contactno || ""}
                                                onChange={(e) => setProfile({ ...profile, contactno: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Address</Label>
                                            <Input
                                                value={profile.address || ""}
                                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Blood Type</Label>
                                            <Input
                                                value={profile.bloodtype || ""}
                                                onChange={(e) => setProfile({ ...profile, bloodtype: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Allergies</Label>
                                            <Input
                                                value={profile.allergies || ""}
                                                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="block mb-1 font-medium">Medical Conditions</Label>
                                        <Input
                                            value={profile.medical_cond || ""}
                                            onChange={(e) => setProfile({ ...profile, medical_cond: e.target.value })}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Emergency Contact Name</Label>
                                            <Input
                                                value={profile.emergencyco_name || ""}
                                                onChange={(e) => setProfile({ ...profile, emergencyco_name: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Emergency Contact Number</Label>
                                            <Input
                                                value={profile.emergencyco_num || ""}
                                                onChange={(e) => setProfile({ ...profile, emergencyco_num: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Emergency Contact Relation</Label>
                                            <Input
                                                value={profile.emergencyco_relation || ""}
                                                onChange={(e) => setProfile({ ...profile, emergencyco_relation: e.target.value })}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                        disabled={profileLoading}
                                    >
                                        {profileLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                                        {profileLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}



                    {/* Create User */}
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                        <CardHeader className="border-b">
                            <CardTitle className="text-2xl font-bold text-green-600">Create New User</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Role */}
                                <div className="space-y-2">
                                    <Label className="block mb-1">Role</Label>
                                    <Select value={role} onValueChange={setRole}>
                                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SCHOLAR">Working Scholar</SelectItem>
                                            <SelectItem value="NURSE">Nurse</SelectItem>
                                            <SelectItem value="DOCTOR">Doctor</SelectItem>
                                            <SelectItem value="PATIENT">Patient</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Conditional IDs */}
                                {role === "SCHOLAR" && (<div className="space-y-2"><Label className="block mb-1">School ID</Label><Input name="school_id" required /></div>)}
                                {(role === "NURSE" || role === "DOCTOR") && (<div className="space-y-2"><Label className="block mb-1">Employee ID</Label><Input name="employee_id" required /></div>)}

                                {role === "PATIENT" && (
                                    <div className="space-y-2">
                                        <Label className="block mb-1">Patient Type</Label>
                                        <Select value={patientType} onValueChange={(val: "student" | "employee") => setPatientType(val)}>
                                            <SelectTrigger><SelectValue placeholder="Select patient type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="student">Student</SelectItem>
                                                <SelectItem value="employee">Employee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {role === "PATIENT" && patientType === "student" && (<div className="space-y-2"><Label>Student ID</Label><Input name="student_id" required /></div>)}
                                {role === "PATIENT" && patientType === "employee" && (<div className="space-y-2"><Label>Employee ID</Label><Input name="employee_id" required /></div>)}

                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label className="block mb-1 font-medium">First Name</Label><Input name="fname" required /></div>
                                    <div className="space-y-2"><Label className="block mb-1 font-medium">Middle Name</Label><Input name="mname" /></div>
                                    <div className="space-y-2"><Label className="block mb-1 font-medium">Last Name</Label><Input name="lname" required /></div>
                                </div>

                                {/* DOB */}
                                <div className="space-y-2"><Label className="block mb-1">Date of Birth</Label><Input type="date" name="date_of_birth" required /></div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <Label className="block mb-1">Gender</Label>
                                    <Select value={gender} onValueChange={(val) => setGender(val as "Male" | "Female")}>
                                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2" disabled={loading}>
                                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                                    {loading ? "Creating..." : "Create User"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Manage Users */}
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition flex flex-col">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-2xl font-bold text-green-600">Manage Existing Users</CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by ID, role, or name..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1); // reset to page 1 when searching
                                    }}
                                    className="pl-8"
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User ID</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers
                                                .slice((currentPage - 1) * 8, currentPage * 8) // ✅ show 8 users per page
                                                .map((user) => (
                                                    <TableRow key={user.user_id} className="hover:bg-green-50 transition">
                                                        <TableCell className="font-medium">{user.user_id}</TableCell>
                                                        <TableCell>{user.role}</TableCell>
                                                        <TableCell>{user.fullName}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    user.status === "Active"
                                                                        ? "bg-green-100 text-green-700 border-green-200 px-4 py-1"
                                                                        : "bg-red-100 text-red-700 border-red-200 px-4 py-1"
                                                                }
                                                            >
                                                                {user.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant={user.status === "Active" ? "destructive" : "default"}
                                                                        className="gap-2"
                                                                    >
                                                                        {user.status === "Active" ? (
                                                                            <>
                                                                                <Ban className="h-4 w-4" /> Deactivate
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle2 className="h-4 w-4" /> Activate
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>
                                                                            {user.status === "Active" ? "Deactivate user?" : "Activate user?"}
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            {user.status === "Active"
                                                                                ? "This will prevent the user from signing in until reactivated."
                                                                                : "This will allow the user to sign in and use the system."}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            className={
                                                                                user.status === "Active"
                                                                                    ? "bg-red-600 hover:bg-red-700"
                                                                                    : "bg-green-600 hover:bg-green-700"
                                                                            }
                                                                            onClick={() => handleToggle(user.accountId, user.status)}
                                                                        >
                                                                            {user.status === "Active" ? "Confirm Deactivate" : "Confirm Activate"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                                                    No users found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* ✅ Pagination Controls fixed at bottom */}
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
                                    Page {currentPage} of {Math.ceil(filteredUsers.length / 8) || 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(prev + 1, Math.ceil(filteredUsers.length / 8))
                                        )
                                    }
                                    disabled={currentPage === Math.ceil(filteredUsers.length / 8) || filteredUsers.length === 0}
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
