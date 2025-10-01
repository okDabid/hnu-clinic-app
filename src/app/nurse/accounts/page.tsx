"use client";

import { useEffect, useState } from "react";
import orderBy from "lodash/orderBy";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

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

// 🔹 Types aligned with API
type User = {
    user_id: string;
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
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [role, setRole] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "">("");
    const [patientType, setPatientType] = useState<"student" | "employee" | "">("");

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [menuOpen, setMenuOpen] = useState(false);

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
    async function handleToggle(userId: string, current: "Active" | "Inactive") {
        const newStatus = current === "Active" ? "Inactive" : "Active";
        try {
            await fetch("/api/nurse/accounts", {
                method: "PUT",
                body: JSON.stringify({ userId, newStatus }),
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
                            <CardHeader className="border-b">
                                <CardTitle className="text-2xl font-bold text-green-600">My Account</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    {/* System info (read-only) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label>User ID</Label><Input value={profile.user_id} disabled /></div>
                                        <div><Label>Username</Label><Input value={profile.username} disabled /></div>
                                        <div><Label>Role</Label><Input value={profile.role} disabled /></div>
                                        <div><Label>Status</Label><Input value={profile.status} disabled /></div>
                                        <div><Label>Date of Birth</Label><Input value={profile.date_of_birth?.slice(0, 10) || ""} disabled /></div>
                                    </div>

                                    {/* Editable fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><Label>First Name</Label><Input value={profile.fname} onChange={(e) => setProfile({ ...profile, fname: e.target.value })} /></div>
                                        <div><Label>Middle Name</Label><Input value={profile.mname || ""} onChange={(e) => setProfile({ ...profile, mname: e.target.value })} /></div>
                                        <div><Label>Last Name</Label><Input value={profile.lname} onChange={(e) => setProfile({ ...profile, lname: e.target.value })} /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label>Contact No</Label><Input value={profile.contactno || ""} onChange={(e) => setProfile({ ...profile, contactno: e.target.value })} /></div>
                                        <div><Label>Address</Label><Input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><Label>Blood Type</Label><Input value={profile.bloodtype || ""} onChange={(e) => setProfile({ ...profile, bloodtype: e.target.value })} /></div>
                                        <div><Label>Allergies</Label><Input value={profile.allergies || ""} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} /></div>
                                    </div>

                                    <div><Label>Medical Conditions</Label><Input value={profile.medical_cond || ""} onChange={(e) => setProfile({ ...profile, medical_cond: e.target.value })} /></div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><Label>Emergency Contact Name</Label><Input value={profile.emergencyco_name || ""} onChange={(e) => setProfile({ ...profile, emergencyco_name: e.target.value })} /></div>
                                        <div><Label>Emergency Contact Number</Label><Input value={profile.emergencyco_num || ""} onChange={(e) => setProfile({ ...profile, emergencyco_num: e.target.value })} /></div>
                                        <div><Label>Emergency Contact Relation</Label><Input value={profile.emergencyco_relation || ""} onChange={(e) => setProfile({ ...profile, emergencyco_relation: e.target.value })} /></div>
                                    </div>

                                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2" disabled={profileLoading}>
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
                                    <Label>Role</Label>
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
                                {role === "SCHOLAR" && (<div className="space-y-2"><Label>School ID</Label><Input name="school_id" required /></div>)}
                                {(role === "NURSE" || role === "DOCTOR") && (<div className="space-y-2"><Label>Employee ID</Label><Input name="employee_id" required /></div>)}

                                {role === "PATIENT" && (
                                    <div className="space-y-2">
                                        <Label>Patient Type</Label>
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
                                    <div className="space-y-2"><Label>First Name</Label><Input name="fname" required /></div>
                                    <div className="space-y-2"><Label>Middle Name</Label><Input name="mname" /></div>
                                    <div className="space-y-2"><Label>Last Name</Label><Input name="lname" required /></div>
                                </div>

                                {/* DOB */}
                                <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" name="date_of_birth" required /></div>

                                {/* Gender */}
                                <div className="space-y-2">
                                    <Label>Gender</Label>
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
                    <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-2xl font-bold text-green-600">Manage Existing Users</CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input placeholder="Search by ID, role, or name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="overflow-x-auto">
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
                                            filteredUsers.map((user) => (
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
                                                                        onClick={() => handleToggle(user.user_id, user.status)}
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
