"use client";

import { useCallback, useEffect, useState } from "react";
import orderBy from "lodash/orderBy";
import { toast } from "sonner";
import { Ban, CheckCircle2, Eye, EyeOff, Loader2, Search, Cog } from "lucide-react";

import { NurseLayout } from "@/components/nurse/nurse-layout";

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
    specialization?: "Physician" | "Dentist" | null;
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
    email?: string;
    address?: string | null;
    bloodtype?: string | null;
    allergies?: string | null;
    medical_cond?: string | null;
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

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

export default function NurseAccountsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [role, setRole] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "">("");
    const [patientType, setPatientType] = useState<"student" | "employee" | "">("");

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    const [originalProfile, setOriginalProfile] = useState<Profile | null>(null);

    const [tempDOB, setTempDOB] = useState(""); // temporary holding value
    const [showDOBConfirm, setShowDOBConfirm] = useState(false);

    const [specialization, setSpecialization] = useState<"Physician" | "Dentist" | null>(null);


    // 🔹 Fetch users (deduplicated but allows same visible ID across different roles)
    async function loadUsers() {
        try {
            const res = await fetch("/api/nurse/accounts", { cache: "no-store" });
            const data = await res.json();

            if (!Array.isArray(data)) {
                setUsers([]);
                return;
            }

            // ✅ Deduplicate by combo of accountId + role (unique user in DB)
            const seen = new Set<string>();
            const usersData: User[] = [];

            for (const u of data) {
                const accountId = u.accountId || u.user_id || "N/A";
                const role = u.role || "Unknown";
                const dedupKey = `${accountId}-${role}`; // 👈 ensures same ID but diff role are unique

                if (!seen.has(dedupKey)) {
                    seen.add(dedupKey);

                    usersData.push({
                        user_id: u.user_id || u.accountId || u.id || "N/A", // displayable ID (may be same across roles)
                        accountId,
                        role,
                        status: u.status || "Inactive",
                        fullName:
                            u.fullName ||
                            [u.fname, u.mname, u.lname].filter(Boolean).join(" ") ||
                            "Unnamed",
                    });
                }
            }

            // ✅ Sort by role then ID
            const sorted = orderBy(
                usersData,
                [
                    (u) => u.role.toLowerCase(),
                    (u) => {
                        const n = parseInt(u.user_id, 10);
                        return isNaN(n) ? u.user_id : n;
                    },
                ],
                ["asc", "asc"]
            );

            setUsers(sorted);
        } catch (err) {
            console.error("Failed to load users:", err);
            toast.error("Failed to load users", { position: "top-center" });
        }
    }


    // 🔹 Fetch own profile
    const loadProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/nurse/accounts/me", {
                cache: "no-store",
                next: { revalidate: 0 }, // ensures it always re-fetches
            });

            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
                return;
            }

            // 🩸 Normalize blood type no matter what format the backend sends
            const bloodTypeValue =
                typeof data.profile?.bloodtype === "string"
                    ? bloodTypeEnumMap[data.profile.bloodtype] || data.profile.bloodtype
                    : "";

            const newProfile = {
                user_id: data.accountId,
                username: data.username,
                role: data.role,
                status: data.status,
                fname: data.profile?.fname || "",
                mname: data.profile?.mname || "",
                lname: data.profile?.lname || "",
                date_of_birth: data.profile?.date_of_birth || "",
                contactno: data.profile?.contactno || "",
                email: data.profile?.email || "",
                address: data.profile?.address || "",
                bloodtype: bloodTypeValue,
                allergies: data.profile?.allergies || "",
                medical_cond: data.profile?.medical_cond || "",
                emergencyco_name: data.profile?.emergencyco_name || "",
                emergencyco_num: data.profile?.emergencyco_num || "",
                emergencyco_relation: data.profile?.emergencyco_relation || "",
            };

            // ✅ Save to both profile states
            setProfile(newProfile);
            setOriginalProfile(newProfile); // store the original snapshot for DOB lock
        } catch (err) {
            console.error("Failed to load profile:", err);
            toast.error("Failed to load profile");
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        loadUsers();
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
            specialization: role === "DOCTOR" ? specialization : null,
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

        if (!profile) {
            toast.error("Profile not loaded yet");
            return;
        }

        // 🧩 If user is trying to set DOB for the first time but hasn't confirmed yet
        if (!profile.date_of_birth && tempDOB) {
            setShowDOBConfirm(true);
            return;
        }

        try {
            setProfileLoading(true);

            const payload = {
                ...profile,
                bloodtype: reverseBloodTypeEnumMap[profile?.bloodtype || ""] || null,
            };

            // 🔒 Prevent DOB modification if it was already set
            if (originalProfile?.date_of_birth) {
                payload.date_of_birth = originalProfile.date_of_birth;
            }

            const res = await fetch("/api/nurse/accounts/me", {
                method: "PUT",
                body: JSON.stringify({ profile: payload }),
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();
            if (data.error) {
                toast.error(data.error);
            } else {
                toast.success("Profile updated!");
                await loadProfile(); // reload with fresh data
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
            const res = await fetch("/api/nurse/accounts", {
                method: "PUT",
                body: JSON.stringify({ user_id, newStatus }),
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (!res.ok) {
                // ❌ Backend returned an error (e.g., 403)
                toast.error(data.error || "Failed to update user status", { position: "top-center" });
                return;
            }

            // ✅ Successful update
            toast.success(data.message || `User ${newStatus}`, { position: "top-center" });
            loadUsers();
        } catch (err) {
            console.error("Error toggling user:", err);
            toast.error("Failed to update user status", { position: "top-center" });
        }
    }


    const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    return (
        <NurseLayout
            title="Accounts Management"
            description="Create and manage user accounts, update your profile, and control access from one workspace."
        >
            <section className="px-4 sm:px-6 py-6 sm:py-8 space-y-10 w-full max-w-6xl mx-auto">
                    {/* My Account */}
                    {profile && (
                        <Card className="rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                            <CardHeader className="border-b flex items-center justify-between flex-wrap gap-3">
                                <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                    My Account
                                </CardTitle>

                                {/* Password Update Dialog */}
                                <Dialog
                                    onOpenChange={(open) => {
                                        if (!open) {
                                            setPasswordErrors([]);
                                            setPasswordMessage(null);
                                            setPasswordLoading(false);
                                            document
                                                .querySelectorAll<HTMLInputElement>(
                                                    'input[name="oldPassword"], input[name="newPassword"], input[name="confirmPassword"]'
                                                )
                                                .forEach((input) => (input.value = ""));
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
                                            <DialogTitle className="text-lg sm:text-xl">Update Password</DialogTitle>
                                            <DialogDescription className="text-sm sm:text-base">
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
                                                    const res = await fetch("/api/nurse/accounts/password", {
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
                                            <div className="flex flex-col space-y-2">
                                                <Label className="block mb-1 font-medium">Current Password</Label>
                                                <div className="relative">
                                                    <Input type={showCurrent ? "text" : "password"} name="oldPassword" required className="pr-10" />
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
                                                            const val = e.target.value;
                                                            const errors: string[] = [];
                                                            if (val.length < 8) errors.push("Password must be at least 8 characters.");
                                                            if (!/[a-z]/.test(val)) errors.push("Must contain a lowercase letter.");
                                                            if (!/[A-Z]/.test(val)) errors.push("Must contain an uppercase letter.");
                                                            if (!/\d/.test(val)) errors.push("Must contain a number.");
                                                            if (!/[^\w\s]/.test(val)) errors.push("Must contain a symbol.");
                                                            setPasswordErrors(errors);
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
                                            <div className="flex flex-col space-y-2">
                                                <Label className="block mb-1 font-medium">Confirm New Password</Label>
                                                <div className="relative">
                                                    <Input type={showConfirm ? "text" : "password"} name="confirmPassword" required className="pr-10" />
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

                                            {/* Success Message */}
                                            {passwordMessage && <p className="text-sm text-green-600">{passwordMessage}</p>}

                                            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
                                                <Button
                                                    type="submit"
                                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
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

                            {/* Profile Form */}
                            <CardContent className="pt-6">
                                <form onSubmit={handleProfileUpdate} className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">User ID</Label>
                                            <Input value={profile.user_id} disabled />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Employee ID</Label>
                                            <Input value={profile.username} disabled />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Role</Label>
                                            <Input value={profile.role} disabled />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Status</Label>
                                            <Input value={profile.status} disabled />
                                        </div>
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

                                                    {/* 🔒 Confirmation Dialog (shown only when user saves) */}
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

                                                                            const res = await fetch("/api/nurse/accounts/me", {
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

                                    </div>

                                    {/* Personal Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">First Name</Label>
                                            <Input
                                                value={profile.fname}
                                                onChange={(e) => setProfile({ ...profile, fname: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Middle Name</Label>
                                            <Input
                                                value={profile.mname || ""}
                                                onChange={(e) => setProfile({ ...profile, mname: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Last Name</Label>
                                            <Input
                                                value={profile.lname}
                                                onChange={(e) => setProfile({ ...profile, lname: e.target.value })}
                                            />
                                        </div>
                                    </div>

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
                                            <Label className="block mb-1 font-medium">Contact No</Label>
                                            <Input
                                                type="tel"
                                                placeholder="09XXXXXXXXX"
                                                value={profile.contactno || ""}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, contactno: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Address & Medical */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Address</Label>
                                            <Input
                                                value={profile.address || ""}
                                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">Allergies</Label>
                                            <Input
                                                value={profile.allergies || ""}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, allergies: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="block mb-1 font-medium">Medical Conditions</Label>
                                        <Input
                                            value={profile.medical_cond || ""}
                                            onChange={(e) =>
                                                setProfile({ ...profile, medical_cond: e.target.value })
                                            }
                                        />
                                    </div>

                                    {/* Blood Type */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Blood Type</Label>
                                            <Select
                                                value={profile.bloodtype || ""}
                                                onValueChange={(val) =>
                                                    setProfile({ ...profile, bloodtype: val })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Blood Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {bloodTypeOptions.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="block mb-1 font-medium">Emergency Contact Name</Label>
                                            <Input
                                                value={profile.emergencyco_name || ""}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, emergencyco_name: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">
                                                Emergency Contact Number
                                            </Label>
                                            <Input
                                                value={profile.emergencyco_num || ""}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, emergencyco_num: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label className="block mb-1 font-medium">
                                                Emergency Contact Relation
                                            </Label>
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
                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
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
                    <Card className="rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                        <CardHeader className="border-b">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                Create New User
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <Label className="block mb-1 font-medium">Role</Label>
                                    <Select
                                        value={role}
                                        onValueChange={(val) => setRole(val)}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SCHOLAR">Working Scholar</SelectItem>
                                            <SelectItem value="NURSE">Nurse</SelectItem>
                                            <SelectItem value="DOCTOR">Doctor</SelectItem>
                                            <SelectItem value="PATIENT">Patient</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Doctor Specialization (Visible ONLY if role is DOCTOR) */}
                                {role === "DOCTOR" && (
                                    <div className="space-y-2">
                                        <Label className="block mb-1 font-medium">Specialization</Label>
                                        <Select
                                            value={specialization ?? ""}
                                            onValueChange={(val) =>
                                                setSpecialization(val as "Physician" | "Dentist")
                                            }
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Physician">Physician</SelectItem>
                                                <SelectItem value="Dentist">Dentist</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* School / Employee IDs */}
                                {role === "SCHOLAR" && (
                                    <div className="space-y-2">
                                        <Label>School ID</Label>
                                        <Input name="school_id" required />
                                    </div>
                                )}

                                {(role === "NURSE" || role === "DOCTOR") && (
                                    <div className="space-y-2">
                                        <Label>Employee ID</Label>
                                        <Input name="employee_id" required />
                                    </div>
                                )}

                                {/* Patient type (student or employee) */}
                                {role === "PATIENT" && (
                                    <div className="space-y-2">
                                        <Label className="block mb-1 font-medium">Patient Type</Label>
                                        <Select
                                            value={patientType}
                                            onValueChange={(val) =>
                                                setPatientType(val as "student" | "employee" | "")
                                            }
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select patient type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="student">Student</SelectItem>
                                                <SelectItem value="employee">Employee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Student/Employee ID for patient */}
                                {role === "PATIENT" && patientType === "student" && (
                                    <div className="space-y-2">
                                        <Label>Student ID</Label>
                                        <Input name="student_id" required />
                                    </div>
                                )}
                                {role === "PATIENT" && patientType === "employee" && (
                                    <div className="space-y-2">
                                        <Label>Employee ID</Label>
                                        <Input name="employee_id" required />
                                    </div>
                                )}

                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label className="block mb-1 font-medium">First Name</Label>
                                        <Input name="fname" required />
                                    </div>
                                    <div>
                                        <Label className="block mb-1 font-medium">Middle Name</Label>
                                        <Input name="mname" />
                                    </div>
                                    <div>
                                        <Label className="block mb-1 font-medium">Last Name</Label>
                                        <Input name="lname" required />
                                    </div>
                                </div>

                                {/* DOB + Gender */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="block mb-1 font-medium">Date of Birth</Label>
                                        <Input type="date" name="date_of_birth" />
                                    </div>
                                    <div>
                                        <Label className="block mb-1 font-medium">Gender</Label>
                                        <Select
                                            value={gender}
                                            onValueChange={(val) => setGender(val as "Male" | "Female")}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                                    {loading ? "Creating..." : "Create User"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>


                    {/* Manage Users */}
                    <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
                        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">Manage Existing Users</CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by ID, role, or name..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="pl-8"
                                />
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                            <div className="overflow-x-auto w-full">
                                <Table className="min-w-full text-sm">
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
                                                .slice((currentPage - 1) * 8, currentPage * 8)
                                                .map((user) => (
                                                    <TableRow key={`${user.accountId}-${user.role}`} className="hover:bg-green-50 transition">
                                                        <TableCell className="whitespace-nowrap text-xs sm:text-sm">{user.user_id}</TableCell>
                                                        <TableCell>{user.role}</TableCell>
                                                        <TableCell>{user.fullName}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={`px-3 py-1 ${user.status === "Active"
                                                                    ? "bg-green-100 text-green-700 border-green-200"
                                                                    : "bg-red-100 text-red-700 border-red-200"
                                                                    }`}
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

                            {/* Pagination */}
                            <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm sm:text-base">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-gray-600">
                                    Page {currentPage} of {Math.ceil(filteredUsers.length / 8) || 1}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredUsers.length / 8)))}
                                    disabled={currentPage === Math.ceil(filteredUsers.length / 8) || filteredUsers.length === 0}
                                >
                                    Next
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </section>
        </NurseLayout>
    );

}
