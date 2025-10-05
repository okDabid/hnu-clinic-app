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
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

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
    year_level?: string | null;
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

const DEPARTMENTS = [
    "College of Education",
    "College of Arts and Sciences",
    "College of Business and Accountancy",
    "College of Engineering and Computer Studies",
    "College of Health Sciences",
    "College of Law",
    "Basic Education Department",
];

const BLOODTYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const YEAR_LEVELS: Record<string, string[]> = {
    College: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
    Kindergarten: ["Kindergarten 1", "Kindergarten 2"],
    Elementary: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
    JuniorHigh: ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
    SeniorHigh: ["Grade 11", "Grade 12"],
};

const PROGRAMS: Record<string, string[]> = {
    "College of Education": ["BSEd English", "BSEd Math", "BEEd", "BPEd"],
    "College of Arts and Sciences": ["BA Communication", "BA Political Science", "BS Psychology"],
    "College of Business and Accountancy": [
        "BS Accountancy",
        "BSBA Marketing",
        "BSBA Finance",
        "BSBA Management",
    ],
    "College of Engineering and Computer Studies": [
        "BS Civil Engineering",
        "BS Computer Science",
        "BS Information Technology",
    ],
    "College of Health Sciences": ["BS Nursing", "BS Pharmacy", "BS Medical Technology"],
    "College of Law": ["Juris Doctor"],
    "Basic Education Department": [
        "Kindergarten",
        "Elementary",
        "Junior High School",
        "Senior High School",
    ],
};

export default function PatientAccountPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [menuOpen] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    const [availablePrograms, setAvailablePrograms] = useState<string[]>([]);
    const [availableYears, setAvailableYears] = useState<string[]>([]);

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
            if (data.error) toast.error(data.error);
            else
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
        } catch {
            toast.error("Failed to load profile");
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        if (!profile?.department) return;
        const dept = profile.department;
        setAvailablePrograms(PROGRAMS[dept] || []);
        if (dept === "Basic Education Department") {
            if (profile.program === "Kindergarten") setAvailableYears(YEAR_LEVELS.Kindergarten);
            else if (profile.program === "Elementary") setAvailableYears(YEAR_LEVELS.Elementary);
            else if (profile.program === "Junior High School") setAvailableYears(YEAR_LEVELS.JuniorHigh);
            else if (profile.program === "Senior High School") setAvailableYears(YEAR_LEVELS.SeniorHigh);
            else setAvailableYears([]);
        } else {
            setAvailableYears(YEAR_LEVELS.College);
        }
    }, [profile?.department, profile?.program]);

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
            if (data.error) toast.error(data.error);
            else toast.success("Profile updated!");
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
                            <CardHeader className="border-b">
                                <CardTitle className="text-2xl font-bold text-green-600">My Account</CardTitle>
                            </CardHeader>

                            <CardContent className="pt-6 space-y-6">
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

                                {/* Editable Academic Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <Label>Department</Label>
                                        <Select
                                            value={profile.department || ""}
                                            onValueChange={(val) =>
                                                setProfile({ ...profile, department: val, program: "", year_level: "" })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DEPARTMENTS.map((d) => (
                                                    <SelectItem key={d} value={d}>
                                                        {d}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Program</Label>
                                        <Select
                                            value={profile.program || ""}
                                            onValueChange={(val) =>
                                                setProfile({ ...profile, program: val, year_level: "" })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availablePrograms.map((p) => (
                                                    <SelectItem key={p} value={p}>
                                                        {p}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Year Level</Label>
                                        <Select
                                            value={profile.year_level || ""}
                                            onValueChange={(val) => setProfile({ ...profile, year_level: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Year Level" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableYears.map((y) => (
                                                    <SelectItem key={y} value={y}>
                                                        {y}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Editable Info */}
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
                                        <Select
                                            value={profile.bloodtype || ""}
                                            onValueChange={(val) => setProfile({ ...profile, bloodtype: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Blood Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BLOODTYPES.map((b) => (
                                                    <SelectItem key={b} value={b}>
                                                        {b}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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

                                {/* Emergency Contact */}
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
