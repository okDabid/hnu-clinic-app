"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
    Ban,
    CheckCircle2,
    Loader2,
    Search,
    ShieldCheck,
    ShieldAlert,
    BarChart3,
    ClipboardList,
    UserRound,
    Phone,
    KeyRound,
    HeartPulse,
    LifeBuoy,
} from "lucide-react";

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
import { AccountRefreshButton } from "@/components/account/account-refresh-button";
import { AccountSection } from "@/components/account/account-section";
import { AccountSummaryGrid } from "@/components/account/account-summary";
import type { AccountSummaryItem } from "@/components/account/account-summary";
import type { AccountPasswordResult } from "@/components/account/account-password-dialog";
import { validateAndNormalizeContacts } from "@/lib/validation";
import { handleRateLimitError } from "@/lib/rate-limit-toast";
import { cn } from "@/lib/utils";

import NurseAccountsLoading from "./loading";
import {
    normalizeNurseAccountProfile,
    normalizeNurseAccountUsers,
    nurseReverseBloodTypeEnumMap,
    type NurseAccountProfile,
    type NurseAccountProfileApi,
    type NurseAccountUser,
    type NurseAccountsUserApi,
} from "./types";

// Types aligned with API
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

export type NurseAccountsPageClientProps = {
    initialUsers: NurseAccountUser[];
    initialProfile: NurseAccountProfile | null;
    initialUsersLoaded: boolean;
    initialProfileLoaded: boolean;
};

export function NurseAccountsPageClient({
    initialUsers,
    initialProfile,
    initialUsersLoaded,
    initialProfileLoaded,
}: NurseAccountsPageClientProps) {
    const [users, setUsers] = useState<NurseAccountUser[]>(() => [...initialUsers]);
    const [pendingStatusIds, setPendingStatusIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const [role, setRole] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | "">("");
    const [patientType, setPatientType] = useState<"student" | "employee" | "">("");
    const [roleFilter, setRoleFilter] = useState<RoleFilterValue>("ALL");
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL");

    const [profile, setProfile] = useState<NurseAccountProfile | null>(initialProfile);
    const [profileLoading, setProfileLoading] = useState(false);
    const [refreshingProfile, setRefreshingProfile] = useState(false);

    const [profileLoaded, setProfileLoaded] = useState(initialProfileLoaded);
    const [usersLoaded, setUsersLoaded] = useState(initialUsersLoaded);

    const [currentPage, setCurrentPage] = useState(1);

    const [originalProfile, setOriginalProfile] = useState<NurseAccountProfile | null>(initialProfile);

    const [tempDOB, setTempDOB] = useState(""); // temporary holding value
    const [showDOBConfirm, setShowDOBConfirm] = useState(false);

    const [specialization, setSpecialization] = useState<"Physician" | "Dentist" | null>(null);
    const [pendingPayload, setPendingPayload] = useState<CreateUserPayload | null>(null);
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);
    const [createdCredentials, setCreatedCredentials] = useState<{ id: string; password: string } | null>(null);
    const [showCreateSuccess, setShowCreateSuccess] = useState(false);

    const formRef = useRef<HTMLFormElement | null>(null);

    const [isRefreshingUsers, startUsersTransition] = useTransition();
    const deferredSearch = useDeferredValue(search.trim().toLowerCase());

    const initializing = !(profileLoaded && usersLoaded);

    const statusBadge = profile?.status ?? null;

    const completionFields = profile
        ? [
            profile.email,
            profile.contactno,
            profile.address,
            profile.bloodtype,
            profile.emergencyco_name,
            profile.emergencyco_num,
            profile.emergencyco_relation,
        ]
        : [];

    const completionCount = completionFields.filter((value) => {
        if (typeof value === "string") {
            return value.trim().length > 0;
        }
        return Boolean(value);
    }).length;

    const completionPercent = completionFields.length
        ? Math.round((completionCount / completionFields.length) * 100)
        : 0;

    const managedAccounts = users.length;
    const inactiveAccounts = useMemo(
        () => users.filter((user) => user.status === "Inactive").length,
        [users]
    );

    const summaryItems: AccountSummaryItem[] = profile
        ? [
            {
                icon: profile.status === "Active" ? ShieldCheck : ShieldAlert,
                label: "Account status",
                value: profile.status,
                helper:
                    profile.status === "Active"
                        ? "You can manage accounts."
                        : "Contact an administrator to restore your access.",
                accent: profile.status === "Active" ? "emerald" : "rose",
            },
            {
                icon: BarChart3,
                label: "Profile completeness",
                value: `${completionPercent}% complete`,
                helper:
                    completionPercent >= 100
                        ? "All key contact details are filled."
                        : "Add missing contact or emergency information.",
                progress: completionPercent,
                accent:
                    completionPercent >= 80
                        ? "emerald"
                        : completionPercent >= 50
                            ? "amber"
                            : "rose",
            },
            {
                icon: ClipboardList,
                label: "Accounts overseen",
                value: `${managedAccounts} accounts`,
                helper:
                    inactiveAccounts > 0
                        ? `${inactiveAccounts} inactive accounts need attention.`
                        : "All accounts are currently active.",
                accent: inactiveAccounts > 0 ? "amber" : "teal",
            },
        ]
        : [];


    // Fetch users (deduplicated but allows same visible ID across different roles)
    const fetchUsers = useCallback(async () => {
        const res = await fetch("/api/nurse/accounts", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
            const errorMessage =
                data && typeof data === "object" && "error" in data
                    ? (data as { error?: string }).error
                    : "Failed to load users";
            throw new Error(errorMessage || "Failed to load users");
        }

        return normalizeNurseAccountUsers(data as NurseAccountsUserApi[]);
    }, []);

    const loadUsers = useCallback(async (options?: { silent?: boolean }) => {
        try {
            const normalized = await fetchUsers();
            if (options?.silent) {
                setUsers(normalized);
            } else {
                startUsersTransition(() => setUsers(normalized));
            }
        } catch (err) {
            console.error("Failed to load users:", err);
            const message = err instanceof Error ? err.message : "Failed to load users";
            toast.error(message, { position: "top-center" });
        } finally {
            setUsersLoaded(true);
        }
    }, [fetchUsers, startUsersTransition]);


    // Fetch own profile
    const loadProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/nurse/accounts/me", {
                cache: "no-store",
                next: { revalidate: 0 }, // ensures it always re-fetches
            });

            const data = await res.json();
            if (!res.ok) {
                if (handleRateLimitError(res, data, "Too many profile requests. Please wait before trying again.")) {
                    return;
                }
                if (data?.error) {
                    toast.error(data.error);
                } else {
                    toast.error("Failed to load profile");
                }
                return;
            }
            const normalized = normalizeNurseAccountProfile(data as NurseAccountProfileApi);
            if (!normalized) {
                if (data?.error) {
                    toast.error(data.error);
                }
                return;
            }

            setProfile(normalized);
            setOriginalProfile(normalized);
        } catch (err) {
            console.error("Failed to load profile:", err);
            toast.error("Failed to load profile");
        } finally {
            setProfileLoaded(true);
        }
    }, []);

    const handleRefreshProfile = useCallback(async () => {
        try {
            setRefreshingProfile(true);
            await loadProfile();
        } finally {
            setRefreshingProfile(false);
        }
    }, [loadProfile]);

    useEffect(() => {
        if (!profileLoaded) {
            loadProfile();
        }
    }, [profileLoaded, loadProfile]);

    useEffect(() => {
        if (!usersLoaded) {
            loadUsers();
        }
    }, [usersLoaded, loadUsers]);

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

    const filteredUsers = useMemo(() => {
        if (roleFilter === "ALL" && statusFilter === "ALL" && !deferredSearch) {
            return users;
        }

        return users.filter((u) => {
            const matchesQuery =
                !deferredSearch ||
                u.user_id.toLowerCase().includes(deferredSearch) ||
                u.role.toLowerCase().includes(deferredSearch) ||
                u.fullName.toLowerCase().includes(deferredSearch);

            const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
            const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;

            return matchesQuery && matchesRole && matchesStatus;
        });
    }, [deferredSearch, roleFilter, statusFilter, users]);

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
                bloodtype: nurseReverseBloodTypeEnumMap[updatedProfile?.bloodtype || ""] || null,
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
            if (!res.ok) {
                if (handleRateLimitError(res, data, "Too many profile updates. Please wait before trying again.")) {
                    return;
                }
                toast.error(data.error ?? "Failed to update profile");
                return;
            }
            if (data.error) {
                toast.error(data.error);
            } else {
                toast.success("Profile updated!");
                if (data.verificationEmailSent) {
                    const targetEmail = data.profile?.email?.trim();
                    toast.success(
                        targetEmail
                            ? `A verification email was sent to ${targetEmail}. Please confirm it to receive clinic notifications.`
                            : "A verification email was sent. Please check your inbox to confirm the address."
                    );
                }
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
        setPendingStatusIds((prev) => (prev.includes(user_id) ? prev : [...prev, user_id]));
        try {
            const res = await fetch("/api/nurse/accounts", {
                method: "PUT",
                body: JSON.stringify({ user_id, newStatus }),
                headers: { "Content-Type": "application/json" },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error((data && data.error) || "Failed to update user status");
            }

            // Successful update
            toast.success(data.message || `User ${newStatus}`, { position: "top-center" });
            await loadUsers({ silent: true });
        } catch (err) {
            console.error("Error toggling user:", err);
            const message = err instanceof Error ? err.message : "Failed to update user status";
            toast.error(message, { position: "top-center" });
        } finally {
            setPendingStatusIds((prev) => prev.filter((id) => id !== user_id));
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
            actions={
                statusBadge ? (
                    <span
                        className={`hidden items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-sm md:inline-flex ${statusBadge === "Active"
                            ? "border-emerald-200 bg-emerald-50/80 text-emerald-700"
                            : "border-rose-200 bg-rose-50/80 text-rose-600"
                            }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${statusBadge === "Active" ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                        />
                        Status: {statusBadge}
                    </span>
                ) : null
            }
        >
            <section className="px-4 sm:px-6 py-6 sm:py-8 space-y-10 w-full max-w-6xl mx-auto">
                {/* My Account */}
                {profile ? (
                    <div className="space-y-8">
                        <AccountSummaryGrid items={summaryItems} />
                        <AccountCard
                            title="My Account"
                            description="Review and update your clinic profile details, emergency contacts, and credentials."
                            onPasswordSubmit={handlePasswordSubmit}
                        >
                            <form onSubmit={handleProfileUpdate} className="space-y-10">
                                <AccountSection
                                    icon={KeyRound}
                                    title="Account credentials"
                                    description="Reference identifiers and access status."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">User ID</Label>
                                            <Input value={profile.user_id} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Employee ID</Label>
                                            <Input value={profile.username} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Role</Label>
                                            <Input value={profile.role} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Status</Label>
                                            <Input value={profile.status} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Date of birth</Label>
                                            {profile.date_of_birth ? (
                                                <Input type="date" value={profile.date_of_birth?.slice(0, 10) || ""} disabled />
                                            ) : (
                                                <>
                                                    <Input
                                                        type="date"
                                                        value={tempDOB}
                                                        onChange={(event) => setTempDOB(event.target.value)}
                                                    />
                                                    {tempDOB ? (
                                                        <Button
                                                            type="button"
                                                            className="mt-2 w-max rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                                            onClick={() => setShowDOBConfirm(true)}
                                                        >
                                                            Confirm date
                                                        </Button>
                                                    ) : null}
                                                    <p className="text-xs text-muted-foreground">
                                                        This can only be saved once. Double-check before confirming.
                                                    </p>
                                                    <AlertDialog open={showDOBConfirm} onOpenChange={setShowDOBConfirm}>
                                                        <AlertDialogContent className="max-w-sm sm:max-w-md rounded-3xl border border-emerald-100/80 bg-white/95">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Confirm Date of Birth</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    You are about to set your Date of Birth to{' '}
                                                                    <span className="font-semibold text-emerald-700">{tempDOB}</span>.
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
                                                                    className="bg-emerald-600 hover:bg-emerald-700"
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

                                                                        try {
                                                                            setProfileLoading(true);
                                                                            const payload = {
                                                                                ...updatedProfile,
                                                                                bloodtype:
                                                                                    nurseReverseBloodTypeEnumMap[updatedProfile?.bloodtype || ""] || null,
                                                                            };

                                                                            const res = await fetch("/api/nurse/accounts/me", {
                                                                                method: "PUT",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({ profile: payload }),
                                                                            });

                                                                            const data = await res.json();
                                                                            if (!res.ok) {
                                                                                if (
                                                                                    handleRateLimitError(
                                                                                        res,
                                                                                        data,
                                                                                        "Too many profile updates. Please wait before trying again."
                                                                                    )
                                                                                ) {
                                                                                    return;
                                                                                }
                                                                                toast.error(data.error ?? "Failed to save Date of Birth");
                                                                            } else if (data.error) {
                                                                                toast.error(data.error);
                                                                            } else {
                                                                                toast.success("Date of Birth saved!");
                                                                                if (data.verificationEmailSent) {
                                                                                    const targetEmail =
                                                                                        data.profile?.email?.trim();
                                                                                    toast.success(
                                                                                        targetEmail
                                                                                            ? `A verification email was sent to ${targetEmail}. Please confirm it to receive clinic notifications.`
                                                                                            : "A verification email was sent. Please check your inbox to confirm the address."
                                                                                    );
                                                                                }
                                                                                await loadProfile();
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
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Gender</Label>
                                            <Input value={profile.gender || ""} disabled />
                                        </div>
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={UserRound}
                                    title="Personal information"
                                    description="Keep your name details up to date."
                                >
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">First name</Label>
                                            <Input value={profile.fname} onChange={(event) => setProfile({ ...profile, fname: event.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Middle name</Label>
                                            <Input value={profile.mname || ""} onChange={(event) => setProfile({ ...profile, mname: event.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Last name</Label>
                                            <Input value={profile.lname} onChange={(event) => setProfile({ ...profile, lname: event.target.value })} />
                                        </div>
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={Phone}
                                    title="Contact & address"
                                    description="Make sure the clinic can reach you quickly."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="example@hnu.edu.ph"
                                                value={profile.email || ""}
                                                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                                            />
                                            <p className="text-xs text-emerald-700">
                                                Adding a new email will trigger a verification link before the clinic sends notifications there.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Contact number</Label>
                                            <Input
                                                type="tel"
                                                placeholder="09XXXXXXXXX"
                                                value={profile.contactno || ""}
                                                onChange={(event) => setProfile({ ...profile, contactno: event.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-emerald-900">Address</Label>
                                        <Input
                                            value={profile.address || ""}
                                            onChange={(event) => setProfile({ ...profile, address: event.target.value })}
                                        />
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={HeartPulse}
                                    title="Medical background"
                                    description="Supports emergency preparedness."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Blood type</Label>
                                            <Select
                                                value={profile.bloodtype || ""}
                                                onValueChange={(value) => setProfile({ ...profile, bloodtype: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select blood type" />
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
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Allergies</Label>
                                            <Input
                                                value={profile.allergies || ""}
                                                onChange={(event) => setProfile({ ...profile, allergies: event.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-emerald-900">Medical conditions</Label>
                                        <Input
                                            value={profile.medical_cond || ""}
                                            onChange={(event) => setProfile({ ...profile, medical_cond: event.target.value })}
                                        />
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={LifeBuoy}
                                    title="Emergency contact"
                                    description="Provide someone we can reach when urgent coordination is needed."
                                >
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Contact name</Label>
                                            <Input
                                                value={profile.emergencyco_name || ""}
                                                onChange={(event) => setProfile({ ...profile, emergencyco_name: event.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Contact number</Label>
                                            <Input
                                                value={profile.emergencyco_num || ""}
                                                onChange={(event) => setProfile({ ...profile, emergencyco_num: event.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Relationship</Label>
                                            <Input
                                                value={profile.emergencyco_relation || ""}
                                                onChange={(event) => setProfile({ ...profile, emergencyco_relation: event.target.value })}
                                            />
                                        </div>
                                    </div>
                                </AccountSection>

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <AccountRefreshButton
                                        onClick={() => void handleRefreshProfile()}
                                        disabled={profileLoading || refreshingProfile}
                                        isRefreshing={refreshingProfile}
                                    />
                                    <Button
                                        type="submit"
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                                        disabled={profileLoading}
                                    >
                                        {profileLoading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                                            </>
                                        ) : (
                                            "Save changes"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </AccountCard>
                    </div>
                ) : null}


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
                            <AlertDialogContent className="w-[95%] max-w-md rounded-3xl border">
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
                            <DialogContent className="w-[95%] max-w-md rounded-3xl border border-green-100/80 bg-white/95">
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
                        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <CardTitle className="text-xl sm:text-2xl font-bold text-green-600">
                                Manage Existing Users
                            </CardTitle>
                            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:justify-end ml-auto">
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
                                        disabled={loading || isRefreshingUsers}
                                    />
                                </div>
                                <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
                                    {isRefreshingUsers ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Refreshing users...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers
                                            .slice((currentPage - 1) * 8, currentPage * 8)
                                            .map((user) => {
                                                const isStatusUpdating = pendingStatusIds.includes(user.accountId);
                                                return (
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
                                                                        disabled={isStatusUpdating}
                                                                    >
                                                                        {isStatusUpdating ? (
                                                                            <>
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                                Updating...
                                                                            </>
                                                                        ) : user.status === "Active" ? (
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
                                                                            disabled={isStatusUpdating}
                                                                            onClick={() => handleToggle(user.accountId, user.status)}
                                                                        >
                                                                            {user.status === "Active" ? "Confirm Deactivate" : "Confirm Activate"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
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

export default NurseAccountsPageClient;
