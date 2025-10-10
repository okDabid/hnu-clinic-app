"use client";

import { useEffect, useState, useCallback } from "react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ✅ Enum ↔ Label Mappings
const departmentEnumMap: Record<string, string> = {
    EDUCATION: "College of Education",
    ARTS_AND_SCIENCES: "College of Arts and Sciences",
    BUSINESS_AND_ACCOUNTANCY: "College of Business and Accountancy",
    ENGINEERING_AND_COMPUTER_STUDIES: "College of Engineering and Computer Studies",
    HEALTH_SCIENCES: "College of Health Sciences",
    LAW: "College of Law",
    BASIC_EDUCATION: "Basic Education Department",
};

const reverseDepartmentEnumMap = Object.fromEntries(
    Object.entries(departmentEnumMap).map(([key, val]) => [val, key])
);

const yearLevelEnumMap: Record<string, string> = {
    FIRST_YEAR: "1st Year",
    SECOND_YEAR: "2nd Year",
    THIRD_YEAR: "3rd Year",
    FOURTH_YEAR: "4th Year",
    FIFTH_YEAR: "5th Year",
    KINDERGARTEN: "Kindergarten",
    ELEMENTARY: "Elementary",
    JUNIOR_HIGH: "Junior High School",
    SENIOR_HIGH: "Senior High School",
};

const reverseYearLevelEnumMap = Object.fromEntries(
    Object.entries(yearLevelEnumMap).map(([key, val]) => [val, key])
);

const bloodTypeEnumMap: Record<string, string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
};

const reverseBloodTypeEnumMap = Object.fromEntries(
    Object.entries(bloodTypeEnumMap).map(([key, val]) => [val, key])
);

// ✅ Type Definition
type Profile = {
    user_id: string;
    username: string;
    role: string;
    status: "Active" | "Inactive";
    fname: string;
    mname?: string | null;
    lname: string;
    date_of_birth?: string;
    email?: string;
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

// ✅ Options
const departmentOptions = [
    "College of Education",
    "College of Arts and Sciences",
    "College of Business and Accountancy",
    "College of Engineering and Computer Studies",
    "College of Health Sciences",
    "College of Law",
    "Basic Education Department",
];

const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const programOptions: Record<string, string[]> = {
    "College of Education": [
        "BSED English",
        "BSED Mathematics",
        "BSED Filipino",
        "BSED Science",
        "BSE Qualifying",
        "BSED Social Studies",
        "BEED",
        "PE ED",
        "TLED HE",
        "SNED",
    ],
    "College of Arts and Sciences": [
        "BS Psychology",
        "BS Biology",
        "BS Criminology",
        "BA Communication",
        "BA Political Science",
    ],
    "College of Business and Accountancy": [
        "BS Accountancy",
        "BSMA Management Accounting",
        "BSBA Marketing Management",
        "BSBA Financial Management",
        "BSBA Human Resource Management",
        "BSTM Tourism Management",
        "BSHM Hospitality Management",
    ],
    "College of Engineering and Computer Studies": [
        "BS Electronics Engineering",
        "BS Civil Engineering",
        "BS Information Technology",
    ],
    "College of Health Sciences": [
        "BS Nursing",
        "BS Medical Technology",
        "BS Radiologic Technology",
    ],
    "College of Law": ["JD Juris Doctor"],
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
    const [menuOpen, setMenuOpen] = useState(false);

    const [profileType, setProfileType] = useState<"student" | "employee" | null>(null);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    const [tempDOB, setTempDOB] = useState("");
    const [showDOBConfirm, setShowDOBConfirm] = useState(false);


    const getYearLevelOptions = (dept: string, program?: string) => {
        if (dept === "Basic Education Department") {
            switch (program) {
                case "Kindergarten":
                    return ["Kindergarten 1", "Kindergarten 2"];
                case "Elementary":
                    return ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
                case "Junior High School":
                    return ["Grade 7", "Grade 8", "Grade 9", "Grade 10"];
                case "Senior High School":
                    return ["Grade 11", "Grade 12"];
                default:
                    return [];
            }
        } else {
            return ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
        }
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut({ callbackUrl: "/login?logout=success" });
        } finally {
            setIsLoggingOut(false);
        }
    };

    const loadProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/patient/account/me", { cache: "no-store" });
            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
                return;
            }
            setProfileType(data.type || null);
            const p = data.profile || {};
            setProfile({
                user_id: data.accountId,
                username: data.username,
                role: data.role,
                status: data.status,
                ...p,
                department: p.department ? departmentEnumMap[p.department] : "",
                year_level: p.year_level ? yearLevelEnumMap[p.year_level] : "",
                bloodtype: p.bloodtype ? bloodTypeEnumMap[p.bloodtype] : "",
            });
        } catch {
            toast.error("Failed to load profile");
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!profile) return;
        if (!profile.fname.trim() || !profile.lname.trim()) {
            toast.error("First and Last Name are required.");
            return;
        }
        try {
            setProfileLoading(true);
            const payload = {
                ...profile,
                department:
                    profileType === "student"
                        ? reverseDepartmentEnumMap[profile.department || ""] || null
                        : profile.department || null,
                year_level:
                    profileType === "student"
                        ? reverseYearLevelEnumMap[profile.year_level || ""] || null
                        : null,
                bloodtype: reverseBloodTypeEnumMap[profile.bloodtype || ""] || null,
            };

            const res = await fetch("/api/patient/account/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile: payload }),
            });

            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
            } else {
                toast.success(
                    profileType === "employee"
                        ? "Employee profile updated successfully!"
                        : "Profile updated successfully!"
                );
                setProfile((prev) => ({
                    ...prev!,
                    ...data.profile,
                    department: data.profile.department
                        ? departmentEnumMap[data.profile.department]
                        : prev?.department,
                    year_level: data.profile.year_level
                        ? yearLevelEnumMap[data.profile.year_level]
                        : prev?.year_level,
                    bloodtype: data.profile.bloodtype
                        ? bloodTypeEnumMap[data.profile.bloodtype]
                        : prev?.bloodtype,
                }));
            }
        } catch (err) {
            console.error("Profile update failed:", err);
            toast.error("Failed to update profile");
        } finally {
            setProfileLoading(false);
        }
    };

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
                    <h2 className="text-xl font-bold text-green-600">
                        {profileLoading || !profileType ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                                <span>Loading Profile</span>
                            </div>
                        ) : profileType === "employee" ? (
                            "Employee Profile"
                        ) : (
                            "Student Profile"
                        )}
                    </h2>
                    {/* Mobile Menu */}
                    <div className="md:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setMenuOpen(!menuOpen)}>
                                    {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href="/patient">Dashboard</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/patient/account">Account</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/patient/appointments">Appointments</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/patient/services">Services</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/patient/notifications">Notifications</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login?logout=success" })}>Logout</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Account Section */}
                <section className="px-6 py-8 max-w-4xl mx-auto w-full">
                    {profile && (
                        <Card className="rounded-2xl shadow-lg hover:shadow-xl transition">
                            <CardHeader className="border-b flex items-center justify-between gap-3">
                                <CardTitle className="text-2xl font-bold text-green-600">My Account</CardTitle>

                                {/* Password Dialog */}
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
                                                    if (data.error) setPasswordErrors([data.error]);
                                                    else {
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
                                                        {showCurrent ? (
                                                            <EyeOff className="h-5 w-5 text-gray-500" />
                                                        ) : (
                                                            <Eye className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* New Password with live validation */}
                                            <div>
                                                <Label className="block mb-1 font-medium">New Password</Label>
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
                                                        {showNew ? (
                                                            <EyeOff className="h-5 w-5 text-gray-500" />
                                                        ) : (
                                                            <Eye className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Confirm Password */}
                                            <div>
                                                <Label className="block mb-1 font-medium">Confirm Password</Label>
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
                                                        {showConfirm ? (
                                                            <EyeOff className="h-5 w-5 text-gray-500" />
                                                        ) : (
                                                            <Eye className="h-5 w-5 text-gray-500" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Validation Feedback */}
                                            {passwordErrors.length > 0 && (
                                                <ul className="text-sm text-red-600 space-y-1">
                                                    {passwordErrors.map((err, idx) => (
                                                        <li key={idx}>• {err}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}

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

                            <CardContent className="pt-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    {/* Uneditable Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><Label className="block mb-1 font-medium">User ID</Label><Input value={profile.user_id} disabled /></div>
                                        <div>
                                            <Label className="block mb-1 font-medium">
                                                {profileType === "student" ? "School ID" : profileType === "employee" ? "Employee ID" : "ID"}
                                            </Label>
                                            <Input value={profile.username} disabled />
                                        </div>
                                        <div><Label className="block mb-1 font-medium">Role</Label><Input value={profile.role} disabled /></div>
                                        <div><Label className="block mb-1 font-medium">Status</Label><Input value={profile.status} disabled /></div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Date of Birth</Label>

                                            {/* If already set → disable input */}
                                            {profile.date_of_birth ? (
                                                <Input
                                                    type="date"
                                                    value={profile.date_of_birth?.slice(0, 10) || ""}
                                                    disabled
                                                />
                                            ) : (
                                                <>
                                                    <Input
                                                        type="date"
                                                        value={tempDOB}
                                                        onChange={(e) => setTempDOB(e.target.value)}
                                                    />
                                                    {tempDOB && (
                                                        <Button
                                                            type="button"
                                                            className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm"
                                                            onClick={() => setShowDOBConfirm(true)}
                                                        >
                                                            Confirm Date
                                                        </Button>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        You can only set this once. Once saved, it cannot be changed.
                                                    </p>

                                                    {/* 🔒 Confirmation Dialog (only shows when user confirms) */}
                                                    <AlertDialog open={showDOBConfirm} onOpenChange={setShowDOBConfirm}>
                                                        <AlertDialogContent className="max-w-sm sm:max-w-md">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirm Date of Birth</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    You are about to set your Date of Birth to{" "}
                                                                    <span className="font-semibold text-green-700">{tempDOB}</span>.
                                                                    <br />
                                                                    This action can only be done once and cannot be changed later.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter className="mt-4">
                                                                <AlertDialogCancel
                                                                    onClick={() => {
                                                                        setTempDOB("");
                                                                        setShowDOBConfirm(false);
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={async () => {
                                                                        setProfile({ ...profile, date_of_birth: tempDOB });
                                                                        setShowDOBConfirm(false);

                                                                        // ✅ Immediately save to the DB
                                                                        try {
                                                                            setProfileLoading(true);
                                                                            const payload = {
                                                                                ...profile,
                                                                                date_of_birth: tempDOB,
                                                                                bloodtype: reverseBloodTypeEnumMap[profile?.bloodtype || ""] || null,
                                                                            };

                                                                            const res = await fetch("/api/patient/account/me", {
                                                                                method: "PUT",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({ profile: payload }),
                                                                            });

                                                                            const data = await res.json();
                                                                            if (data.error) {
                                                                                toast.error(data.error);
                                                                            } else {
                                                                                toast.success("Date of Birth saved!");
                                                                                await loadProfile(); // Refresh with updated DOB
                                                                            }
                                                                        } catch {
                                                                            toast.error("Failed to save Date of Birth");
                                                                        } finally {
                                                                            setProfileLoading(false);
                                                                        }
                                                                    }}
                                                                >
                                                                    Confirm
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </>
                                            )}
                                        </div>

                                        <div><Label className="block mb-1 font-medium">Gender</Label><Input value={profile.gender || ""} disabled /></div>
                                    </div>

                                    {/* Editable Fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div><Label className="block mb-1 font-medium">First Name</Label><Input value={profile.fname} onChange={(e) => setProfile({ ...profile, fname: e.target.value })} /></div>
                                        <div><Label className="block mb-1 font-medium">Middle Name</Label><Input value={profile.mname || ""} onChange={(e) => setProfile({ ...profile, mname: e.target.value })} /></div>
                                        <div><Label className="block mb-1 font-medium">Last Name</Label><Input value={profile.lname} onChange={(e) => setProfile({ ...profile, lname: e.target.value })} /></div>
                                    </div>

                                    {/* 🎓 Student Academic Info */}
                                    {profileType === "student" && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="block mb-1 font-medium">Department</Label>
                                                <Select
                                                    value={profile.department || ""}
                                                    onValueChange={(val) =>
                                                        setProfile({
                                                            ...profile,
                                                            department: val,
                                                            program: "",
                                                            year_level: "",
                                                        })
                                                    }
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                                                    <SelectContent>
                                                        {departmentOptions.map((dept) => (
                                                            <SelectItem key={dept} value={dept}>
                                                                {dept}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="block mb-1 font-medium">Program</Label>
                                                <Select
                                                    value={profile.program || ""}
                                                    onValueChange={(val) => setProfile({ ...profile, program: val })}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select Program" /></SelectTrigger>
                                                    <SelectContent>
                                                        {(programOptions[profile.department || ""] || []).map((prog) => (
                                                            <SelectItem key={prog} value={prog}>
                                                                {prog}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="block mb-1 font-medium">Year Level</Label>
                                                <Select
                                                    value={profile.year_level || ""}
                                                    onValueChange={(val) => setProfile({ ...profile, year_level: val })}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Select Year Level" /></SelectTrigger>
                                                    <SelectContent>
                                                        {getYearLevelOptions(
                                                            profile.department || "",
                                                            profile.program ?? undefined
                                                        ).map((lvl) => (
                                                            <SelectItem key={lvl} value={lvl}>
                                                                {lvl}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    {/* 💼 Employee Info */}
                                    {profileType === "employee" && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="block mb-1 font-medium">Department / Office</Label>
                                                <Input
                                                    value={profile.department || ""}
                                                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                                    placeholder="e.g. HR, Accounting, Nursing"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="example@hnu.edu.ph"
                                                value={profile.email || ""}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Contact No.</Label>
                                            <Input
                                                type="tel"
                                                placeholder="09XXXXXXXXX"
                                                value={profile.contactno || ""}
                                                onChange={(e) => setProfile({ ...profile, contactno: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="block mb-1 font-medium">Address</Label>
                                        <Input
                                            value={profile.address || ""}
                                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        />
                                    </div>


                                    {/* Medical Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Blood Type</Label>
                                            <Select
                                                value={profile.bloodtype || ""}
                                                onValueChange={(val) => setProfile({ ...profile, bloodtype: val })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Select Blood Type" /></SelectTrigger>
                                                <SelectContent>
                                                    {bloodTypeOptions.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div><Label className="block mb-1 font-medium">Allergies</Label><Input value={profile.allergies || ""} onChange={(e) => setProfile({ ...profile, allergies: e.target.value })} /></div>
                                    </div>

                                    <div>
                                        <Label className="block mb-1 font-medium">Medical Conditions</Label>
                                        <Input value={profile.medical_cond || ""} onChange={(e) => setProfile({ ...profile, medical_cond: e.target.value })} />
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div><Label className="block mb-1 font-medium">Emergency Contact Name</Label><Input value={profile.emergencyco_name || ""} onChange={(e) => setProfile({ ...profile, emergencyco_name: e.target.value })} /></div>
                                        <div><Label className="block mb-1 font-medium">Emergency Contact Number</Label><Input value={profile.emergencyco_num || ""} onChange={(e) => setProfile({ ...profile, emergencyco_num: e.target.value })} /></div>
                                        <div><Label className="block mb-1 font-medium">Emergency Contact Relation</Label><Input value={profile.emergencyco_relation || ""} onChange={(e) => setProfile({ ...profile, emergencyco_relation: e.target.value })} /></div>
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
