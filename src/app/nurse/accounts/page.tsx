"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import orderBy from "lodash/orderBy";
import { toast } from "sonner";
import { Ban, CheckCircle2, Loader2, Search } from "lucide-react";

import { NurseLayout } from "@/components/nurse/nurse-layout";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AccountCard } from "@/components/account/account-card";
import { AccountPasswordResult } from "@/components/account/account-password-dialog";
import { validateAndNormalizeContacts } from "@/lib/validation";
import { cn } from "@/lib/utils";

import NurseAccountsLoading from "./loading";

// Types aligned with API
type User = {
    user_id: string;
    accountId: string;
    role: string;
    status: "Active" | "Inactive";
    fullName: string;
    specialization: "Physician" | "Dentist" | null;
};

type RoleFilterValue = "ALL" | "SCHOLAR" | "NURSE" | "DOCTOR" | "PATIENT";
type StatusFilterValue = "ALL" | "Active" | "Inactive";

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
    const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [profileLoaded, setProfileLoaded] = useState(false);
    const [usersLoaded, setUsersLoaded] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    const [originalProfile, setOriginalProfile] = useState<Profile | null>(null);

    const [tempDOB, setTempDOB] = useState(""); // temporary holding value
    const [showDOBConfirm, setShowDOBConfirm] = useState(false);

    const [specialization, setSpecialization] = useState<"Physician" | "Dentist" | null>(null);
    const [pendingPayload, setPendingPayload] = useState<CreateUserPayload | null>(null);
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ id: string; password: string } | null>(null);
    const [showCreateSuccess, setShowCreateSuccess] = useState(false);

    const formRef = useRef<HTMLFormElement | null>(null);

    const initializing = !(profileLoaded && usersLoaded);


    // Fetch users (deduplicated but allows same visible ID across different roles)
    async function loadUsers() {
        try {
            const res = await fetch("/api/nurse/accounts", { cache: "no-store" });
            const data = await res.json();

            if (!Array.isArray(data)) {
                setUsers([]);
                return;
            }

            // Deduplicate by combo of accountId + role (unique user in DB)
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
                        specialization: u.specialization ?? null,
                    });
                }
            }

            // Sort by role then ID
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
        } finally {
            setUsersLoaded(true);
        }
    }


    // Fetch own profile
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

            // Normalize blood type no matter what format the backend sends
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

            // Save to both profile states
            setProfile(newProfile);
            setOriginalProfile(newProfile); // store the original snapshot for DOB lock
        } catch (err) {
            console.error("Failed to load profile:", err);
            toast.error("Failed to load profile");
        } finally {
            setProfileLoaded(true);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (role !== "PATIENT") {
            setPatientType("");
        }
        if (role !== "DOCTOR") {
            setSpecialization(null);
        }
    }, [role]);

    useEffect(() => {
        setCurrentPage(1);
    }, [roleFilter, statusFilter]);

    const filteredUsers = useMemo(
        () =>
            users.filter((u) => {
                const normalizedQuery = search.toLowerCase();
                const matchesQuery =
                    u.user_id.toLowerCase().includes(normalizedQuery) ||
                    u.role.toLowerCase().includes(normalizedQuery) ||
                    u.fullName.toLowerCase().includes(normalizedQuery);

                const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
                const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;

                return matchesQuery && matchesRole && matchesStatus;
            }),
        [users, search, roleFilter, statusFilter]
    );

    // Create user
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!role) {
            toast.error("Please select a role for the new account.", { position: "top-center" });
            return;
        }

        if (!gender) {
            toast.error("Please choose a gender for the new account.", { position: "top-center" });
            return;
        }

        if (role === "PATIENT" && !patientType) {
            toast.error("Please specify whether the patient is a student or employee.", {
                position: "top-center",
            });
            return;
        }

        if (role === "DOCTOR" && !specialization) {
            toast.error("Please select a specialization for the doctor.", { position: "top-center" });
            return;
        }

        const formElement = e.currentTarget;
        formRef.current = formElement;
        const formData = new FormData(formElement);

        const getTrimmedValue = (key: string) => {
            const value = formData.get(key);
            return typeof value === "string" ? value.trim() : "";
        };

        const fname = getTrimmedValue("fname");
        const mnameRaw = getTrimmedValue("mname");
        const lname = getTrimmedValue("lname");
        const date_of_birth = getTrimmedValue("date_of_birth");
        const employeeId = getTrimmedValue("employee_id");
        const studentId = getTrimmedValue("student_id");
        const schoolId = getTrimmedValue("school_id");

        const payload: CreateUserPayload = {
            role,
            fname,
            mname: mnameRaw || null,
            lname,
            date_of_birth,
            gender: gender as "Male" | "Female",
            employee_id:
                role === "NURSE" ||
                    role === "DOCTOR" ||
                    (role === "PATIENT" && patientType === "employee")
                    ? employeeId || null
                    : null,
            student_id:
                role === "PATIENT" && patientType === "student" ? (studentId || null) : null,
            school_id: role === "SCHOLAR" ? (schoolId || null) : null,
            patientType: patientType || null,
            specialization: role === "DOCTOR" ? specialization : null,
        };

        setPendingPayload(payload);
        setShowCreateConfirm(true);
    }

    const handleCreateDialogChange = (open: boolean) => {
        if (!open && !loading) {
            setPendingPayload(null);
        }
        setShowCreateConfirm(open);
    };

    const handleCreateSuccessChange = (open: boolean) => {
        if (!open) {
            setShowCreateSuccess(false);
            setCreatedCredentials(null);
            return;
        }

        setShowCreateSuccess(true);
    };

    async function handleConfirmCreate() {
        if (!pendingPayload) return;

        try {
            setLoading(true);
            const res = await fetch("/api/nurse/accounts", {
                method: "POST",
                body: JSON.stringify(pendingPayload),
                headers: { "Content-Type": "application/json" },
            });
            const data: CreateUserResponse = await res.json();

            if (data.error) {
                toast.error(data.error, { position: "top-center" });
                return;
            }

            if (data.id || data.password) {
                setCreatedCredentials({
                    id: data.id ?? "Unavailable",
                    password: data.password ?? "Unavailable",
                });
            } else {
                setCreatedCredentials(null);
            }

            setShowCreateSuccess(true);

            formRef.current?.reset();
            setRole("");
            setGender("");
            setPatientType("");
            setSpecialization(null);
            setPendingPayload(null);
            setShowCreateConfirm(false);
            await loadUsers();
        } catch {
            toast.error("Something went wrong. Please try again.", {
                position: "top-center",
            });
        } finally {
            setLoading(false);
        }
    }

    // Update own profile
    async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!profile) {
            toast.error("Profile not loaded yet");
            return;
        }

        const contactValidation = validateAndNormalizeContacts({
            email: profile.email,
            contactNumber: profile.contactno,
            emergencyNumber: profile.emergencyco_num,
        });

        if (!contactValidation.success) {
            toast.error(contactValidation.error);
            return;
        }

        const updatedProfile = {
            ...profile,
            email: contactValidation.email,
            contactno: contactValidation.contactNumber,
            emergencyco_num: contactValidation.emergencyNumber,
        };

        setProfile(updatedProfile);

        // If user is trying to set DOB for the first time but hasn't confirmed yet
        if (!updatedProfile.date_of_birth && tempDOB) {
            setShowDOBConfirm(true);
            return;
        }

        try {
            setProfileLoading(true);

            const payload = {
                ...updatedProfile,
                bloodtype: reverseBloodTypeEnumMap[updatedProfile?.bloodtype || ""] || null,
            };

            // Prevent DOB modification if it was already set
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

    const handlePasswordSubmit = useCallback(
        async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }): Promise<AccountPasswordResult> => {
            try {
                const res = await fetch("/api/nurse/accounts/password", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ oldPassword, newPassword }),
                });

                const data = await res.json();
                if (data.error) {
                    return { error: data.error };
                }

                const message = "Password updated successfully!";
                toast.success(message);
                return { success: message };
            } catch (error) {
                console.error("Failed to update password", error);
                return { error: "Failed to update password. Please try again." };
            }
        },
        []
    );


    // Toggle status
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
                // Backend returned an error (e.g., 403)
                toast.error(data.error || "Failed to update user status", { position: "top-center" });
                return;
            }

            // Successful update
            toast.success(data.message || `User ${newStatus}`, { position: "top-center" });
            loadUsers();
        } catch (err) {
            console.error("Error toggling user:", err);
            toast.error("Failed to update user status", { position: "top-center" });
        }
    }


    const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const roleLabelMap: Record<string, string> = {
        SCHOLAR: "Working Scholar",
        NURSE: "Nurse",
        DOCTOR: "Doctor",
        PATIENT: "Patient",
    };

    const pendingFullName = pendingPayload
        ? [pendingPayload.fname, pendingPayload.mname, pendingPayload.lname].filter(Boolean).join(" ")
        : "";

    const pendingIdentifier = pendingPayload
        ? (() => {
            if (pendingPayload.role === "SCHOLAR") {
                return { label: "School ID", value: pendingPayload.school_id ?? "—" };
            }
            if (pendingPayload.role === "NURSE" || pendingPayload.role === "DOCTOR") {
                return { label: "Employee ID", value: pendingPayload.employee_id ?? "—" };
            }
            if (pendingPayload.role === "PATIENT") {
                if (pendingPayload.patientType === "student") {
                    return { label: "Student ID", value: pendingPayload.student_id ?? "—" };
                }
                if (pendingPayload.patientType === "employee") {
                    return { label: "Employee ID", value: pendingPayload.employee_id ?? "—" };
                }
                return { label: "Patient Type", value: "Not specified" };
            }
            return null;
        })()
        : null;

    const pendingDOBLabel = pendingPayload?.date_of_birth
        ? (() => {
            const parsed = new Date(pendingPayload.date_of_birth);
            if (Number.isNaN(parsed.getTime())) {
                return pendingPayload.date_of_birth;
            }
            return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(parsed);
        })()
        : "—";

    const pendingPatientTypeLabel = pendingPayload?.patientType
        ? pendingPayload.patientType === "student"
            ? "Student"
            : "Employee"
        : null;

    if (initializing) {
        return <NurseAccountsLoading />;
    }

    return (
        <NurseLayout
            title="Accounts Management"
            description="Create and manage user accounts, update your profile, and control access from one workspace."
        >
            <section className="px-4 sm:px-6 py-6 sm:py-8 space-y-10 w-full max-w-6xl mx-auto">
                {/* My Account */}
                {profile && (
                    <AccountCard
                        title="My Account"
                        description="Review and update your clinic profile details, emergency contacts, and credentials."
                        onPasswordSubmit={handlePasswordSubmit}
                        contentClassName="pt-6"
                    >
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

                                            {/* Confirmation Dialog (shown only when user saves) */}
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
                                                                const contactValidation = validateAndNormalizeContacts({
                                                                    email: profile.email,
                                                                    contactNumber: profile.contactno,
                                                                    emergencyNumber: profile.emergencyco_num,
                                                                });

                                                                if (!contactValidation.success) {
                                                                    toast.error(contactValidation.error);
                                                                    return;
                                                                }

                                                                const updatedProfile = {
                                                                    ...profile,
                                                                    email: contactValidation.email,
                                                                    contactno: contactValidation.contactNumber,
                                                                    emergencyco_num: contactValidation.emergencyNumber,
                                                                    date_of_birth: tempDOB,
                                                                };

                                                                setProfile(updatedProfile);
                                                                setShowDOBConfirm(false);

                                                                // Immediately save to the DB
                                                                try {
                                                                    setProfileLoading(true);
                                                                    const payload = {
                                                                        ...updatedProfile,
                                                                        bloodtype: reverseBloodTypeEnumMap[updatedProfile?.bloodtype || ""] || null,
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
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                                disabled={profileLoading}
                            >
                                {profileLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                                {profileLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </form>
                    </AccountCard>
                )}

                {/* Create User */}
                <Card className="rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-px hover:shadow-md">
                    <CardHeader className="border-b">
                        <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                            Create New User
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                                {loading ? "Creating..." : "Create User"}
                            </Button>
                        </form>
                        <AlertDialog open={showCreateConfirm} onOpenChange={handleCreateDialogChange}>
                            <AlertDialogContent className="max-w-lg">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm new user account</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Review the details below. Creating this account will immediately generate login credentials.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                {pendingPayload ? (
                                    <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4 text-sm text-gray-700">
                                        <dl className="space-y-2">
                                            <div className="flex items-center justify-between gap-4">
                                                <dt className="text-gray-500">Role</dt>
                                                <dd className="font-semibold text-gray-900">
                                                    {roleLabelMap[pendingPayload.role] ?? pendingPayload.role}
                                                </dd>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <dt className="text-gray-500">Full Name</dt>
                                                <dd className="text-right font-medium text-gray-900">
                                                    {pendingFullName || "—"}
                                                </dd>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <dt className="text-gray-500">Gender</dt>
                                                <dd className="font-medium text-gray-900">{pendingPayload.gender}</dd>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <dt className="text-gray-500">Date of Birth</dt>
                                                <dd className="font-medium text-gray-900">{pendingDOBLabel}</dd>
                                            </div>
                                            {pendingPatientTypeLabel && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <dt className="text-gray-500">Patient Type</dt>
                                                    <dd className="font-medium text-gray-900">{pendingPatientTypeLabel}</dd>
                                                </div>
                                            )}
                                            {pendingPayload.role === "DOCTOR" && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <dt className="text-gray-500">Specialization</dt>
                                                    <dd className="font-medium text-gray-900">
                                                        {pendingPayload.specialization ?? "—"}
                                                    </dd>
                                                </div>
                                            )}
                                            {pendingIdentifier && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <dt className="text-gray-500">{pendingIdentifier.label}</dt>
                                                    <dd className="font-medium text-gray-900">
                                                        {pendingIdentifier.value || "—"}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                        <p className="mt-4 text-xs text-gray-500">
                                            A one-time password will be shown after confirming. Share it securely with the user.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600">
                                        Provide the new user details first to review them here.
                                    </p>
                                )}
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={loading}>Go back</AlertDialogCancel>
                                    <AlertDialogAction
                                        disabled={loading || !pendingPayload}
                                        onClick={handleConfirmCreate}
                                        className={cn(
                                            "bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-200 focus:ring-offset-2",
                                            loading && "pointer-events-none opacity-80"
                                        )}
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                                            </span>
                                        ) : (
                                            "Confirm & Create"
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Dialog open={showCreateSuccess} onOpenChange={handleCreateSuccessChange}>
                            <DialogContent className="max-w-sm rounded-3xl border border-green-100/80 bg-white/95">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="h-5 w-5" /> Account created
                                    </DialogTitle>
                                    <DialogDescription>
                                        Share the temporary password securely. The password will not be shown again after
                                        closing this dialog.
                                    </DialogDescription>
                                </DialogHeader>
                                {createdCredentials ? (
                                    <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm text-gray-700">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-gray-500">User ID</span>
                                            <span className="font-semibold text-gray-900">
                                                {createdCredentials.id}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between gap-4">
                                            <span className="text-gray-500">Password</span>
                                            <span className="font-semibold text-gray-900">
                                                {createdCredentials.password}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-yellow-100 bg-yellow-50/80 p-4 text-sm text-gray-700">
                                        <p className="font-medium text-yellow-900">Account created successfully.</p>
                                        <p className="mt-2 text-xs text-yellow-800">
                                            The account is ready to use, but no credentials were returned by the server.
                                        </p>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        className="rounded-xl bg-green-600 text-white hover:bg-green-700"
                                        onClick={() => handleCreateSuccessChange(false)}
                                    >
                                        Done
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>


                {/* Manage Users */}
                <Card className="flex flex-col rounded-3xl border border-green-100/70 bg-white/80 shadow-sm transition hover:-translate-y-px hover:shadow-md">
                    <CardHeader className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                Manage Existing Users
                            </CardTitle>
                            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:justify-end">
                                <div className="relative w-full md:w-60 lg:w-72">
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
                                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end md:w-auto">
                                    <Select
                                        value={roleFilter}
                                        onValueChange={(val) => setRoleFilter(val as RoleFilterValue)}
                                    >
                                        <SelectTrigger className="h-10 border-green-200">
                                            <SelectValue placeholder="All roles" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All roles</SelectItem>
                                            <SelectItem value="DOCTOR">Doctor</SelectItem>
                                            <SelectItem value="NURSE">Nurse</SelectItem>
                                            <SelectItem value="PATIENT">Patient</SelectItem>
                                            <SelectItem value="SCHOLAR">Working Scholar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(val) => setStatusFilter(val as StatusFilterValue)}
                                    >
                                        <SelectTrigger className="h-10 border-green-200">
                                            <SelectValue placeholder="All statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All statuses</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
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
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900">{user.role}</span>
                                                            {user.role === "DOCTOR" && (
                                                                user.specialization ? (
                                                                    <span className="text-xs font-medium text-green-700">
                                                                        {user.specialization}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs italic text-gray-500">
                                                                        No specialization
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </TableCell>
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
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "gap-2 rounded-full border-2 px-4 text-sm font-semibold transition-colors",
                                                                        user.status === "Active"
                                                                            ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                                                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                                                                    )}
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
                                                                            ? "The account will be signed out and unable to access the system until reactivated."
                                                                            : "The account will regain access to the clinic system."}
                                                                    </AlertDialogDescription>
                                                                    {user.role === "DOCTOR" && (
                                                                        <p className="mt-3 rounded-lg bg-emerald-50/80 p-3 text-sm font-medium text-emerald-700">
                                                                            {user.status === "Active"
                                                                                ? "Deactivated doctors will no longer appear as options when patients book appointments."
                                                                                : "Reactivated doctors will once again be available for patient appointment scheduling."}
                                                                        </p>
                                                                    )}
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        className={cn(
                                                                            "text-white focus:outline-none focus:ring-2 focus:ring-offset-2",
                                                                            user.status === "Active"
                                                                                ? "bg-red-600 hover:bg-red-700 focus:ring-red-200"
                                                                                : "bg-green-600 hover:bg-green-700 focus:ring-green-200"
                                                                        )}
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
                                            <TableCell colSpan={6} className="text-center text-gray-500 py-6">
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
