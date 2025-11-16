"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    Loader2,
    ShieldCheck,
    ShieldAlert,
    BarChart3,
    GraduationCap,
    Phone,
    UserRound,
    KeyRound,
    HeartPulse,
    LifeBuoy,
} from "lucide-react";

import ScholarLayout from "@/components/scholar/scholar-layout";
import { AccountCard } from "@/components/account/account-card";
import { AccountRefreshButton } from "@/components/account/account-refresh-button";
import { AccountSection } from "@/components/account/account-section";
import { AccountSummaryGrid } from "@/components/account/account-summary";
import { MedicalHistoryField } from "@/components/account/medical-history-field";
import type { AccountSummaryItem } from "@/components/account/account-summary";
import type { AccountPasswordResult } from "@/components/account/account-password-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    parseMedicalHistory,
    serializeMedicalHistory,
    type MedicalHistoryValue,
} from "@/lib/medical-history";
import { validateAndNormalizeContacts } from "@/lib/validation";
import { handleRateLimitError } from "@/lib/rate-limit-toast";

import ScholarAccountLoading from "./loading";

const departmentEnumMap: Record<string, string> = {
    EDUCATION: "College of Education",
    ARTS_AND_SCIENCES: "College of Arts and Sciences",
    BUSINESS_AND_ACCOUNTANCY: "College of Business and Accountancy",
    ENGINEERING_AND_COMPUTER_STUDIES: "College of Engineering and Computer Studies",
    HEALTH_SCIENCES: "College of Health Sciences",
    LAW: "College of Law",
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

const departmentOptions = [
    "College of Education",
    "College of Arts and Sciences",
    "College of Business and Accountancy",
    "College of Engineering and Computer Studies",
    "College of Health Sciences",
    "College of Law",
];

const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const programOptions: Record<string, string[]> = {
    "College of Education": [
        "BSED English",
        "BSED Mathematics",
        "BSED Filipino",
        "BSED Science",
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
        "BS Management Accounting",
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
};

const yearLevelOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

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
    medicalHistory: MedicalHistoryValue;
    gender?: string | null;
    department?: string | null;
    program?: string | null;
    year_level?: string | null;
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

function normalizeProfile(
    response: Record<string, unknown>,
    profile: Record<string, unknown> | null
): Profile {
    return {
        user_id: String(response.accountId ?? ""),
        username: String(response.username ?? ""),
        role: String(response.role ?? ""),
        status: (response.status as Profile["status"]) ?? "Active",
        fname: String(profile?.fname ?? ""),
        mname: (profile?.mname as string | null) ?? "",
        lname: String(profile?.lname ?? ""),
        date_of_birth: (profile?.date_of_birth as string | undefined) ?? undefined,
        email: (profile?.email as string | null) ?? "",
        contactno: (profile?.contactno as string | null) ?? "",
        address: (profile?.address as string | null) ?? "",
        bloodtype: profile?.bloodtype
            ? bloodTypeEnumMap[String(profile.bloodtype)] ?? String(profile.bloodtype)
            : "",
        allergies: (profile?.allergies as string | null) ?? "",
        medicalHistory: parseMedicalHistory(profile?.medical_cond as string | null),
        gender: (profile?.gender as string | null) ?? "",
        department: profile?.department
            ? departmentEnumMap[String(profile.department)] ?? String(profile.department)
            : "",
        program: (profile?.program as string | null) ?? "",
        year_level: profile?.year_level
            ? yearLevelEnumMap[String(profile.year_level)] ?? String(profile.year_level)
            : "",
        emergencyco_name: (profile?.emergencyco_name as string | null) ?? "",
        emergencyco_num: (profile?.emergencyco_num as string | null) ?? "",
        emergencyco_relation: (profile?.emergencyco_relation as string | null) ?? "",
    };
}

function mapUpdatedProfile(profile: Record<string, unknown>): Partial<Profile> {
    return {
        fname: String(profile?.fname ?? ""),
        mname: (profile?.mname as string | null) ?? "",
        lname: String(profile?.lname ?? ""),
        date_of_birth: (profile?.date_of_birth as string | undefined) ?? undefined,
        email: (profile?.email as string | null) ?? "",
        contactno: (profile?.contactno as string | null) ?? "",
        address: (profile?.address as string | null) ?? "",
        bloodtype: profile?.bloodtype
            ? bloodTypeEnumMap[String(profile.bloodtype)] ?? String(profile.bloodtype)
            : "",
        allergies: (profile?.allergies as string | null) ?? "",
        medicalHistory: parseMedicalHistory(profile?.medical_cond as string | null),
        department: profile?.department
            ? departmentEnumMap[String(profile.department)] ?? String(profile.department)
            : "",
        program: (profile?.program as string | null) ?? "",
        year_level: profile?.year_level
            ? yearLevelEnumMap[String(profile.year_level)] ?? String(profile.year_level)
            : "",
        emergencyco_name: (profile?.emergencyco_name as string | null) ?? "",
        emergencyco_num: (profile?.emergencyco_num as string | null) ?? "",
        emergencyco_relation: (profile?.emergencyco_relation as string | null) ?? "",
    };
}

function formatRequestPayload(profile: Profile) {
    const { medicalHistory, ...rest } = profile;

    return {
        ...rest,
        mname: profile.mname?.trim() ? profile.mname : null,
        email: profile.email?.trim() ? profile.email : null,
        contactno: profile.contactno?.trim() ? profile.contactno : null,
        address: profile.address?.trim() ? profile.address : null,
        bloodtype: profile.bloodtype ? reverseBloodTypeEnumMap[profile.bloodtype] ?? null : null,
        allergies: profile.allergies?.trim() ? profile.allergies : null,
        medical_cond: serializeMedicalHistory(medicalHistory),
        department: profile.department ? reverseDepartmentEnumMap[profile.department] ?? null : null,
        program: profile.program?.trim() ? profile.program : null,
        year_level: profile.year_level ? reverseYearLevelEnumMap[profile.year_level] ?? null : null,
        emergencyco_name: profile.emergencyco_name?.trim() ? profile.emergencyco_name : null,
        emergencyco_num: profile.emergencyco_num?.trim() ? profile.emergencyco_num : null,
        emergencyco_relation: profile.emergencyco_relation?.trim() ? profile.emergencyco_relation : null,
    };
}

export default function ScholarAccountPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [dobConfirmOpen, setDobConfirmOpen] = useState(false);
    const [dobSaving, setDobSaving] = useState(false);
    const [tempDOB, setTempDOB] = useState("");

    const availablePrograms = useMemo(
        () => (profile?.department ? programOptions[profile.department] ?? [] : []),
        [profile?.department]
    );

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

    const emergencyReady = Boolean(
        profile?.emergencyco_name?.trim() &&
        profile?.emergencyco_num?.trim() &&
        profile?.emergencyco_relation?.trim()
    );

    const academicReady = Boolean(
        profile?.department?.trim() && profile?.program?.trim() && profile?.year_level?.trim()
    );

    const emergencySummary = profile
        ? emergencyReady
            ? `Emergency contact: ${profile.emergencyco_name || "—"}`
            : "Add an emergency contact for urgent support."
        : null;

    const summaryItems: AccountSummaryItem[] = profile
        ? [
            {
                icon: profile.status === "Active" ? ShieldCheck : ShieldAlert,
                label: "Account status",
                value: profile.status,
                helper:
                    profile.status === "Active"
                        ? "You have full access to clinic services."
                        : "Contact the clinic team to reactivate your access.",
                accent: profile.status === "Active" ? "emerald" : "rose",
            },
            {
                icon: BarChart3,
                label: "Profile completeness",
                value: `${completionPercent}% complete`,
                helper:
                    completionPercent >= 100
                        ? emergencySummary || "All essential contact details are provided."
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
                icon: GraduationCap,
                label: "Academic placement",
                value: academicReady ? profile.program ?? "" : "Select program",
                helper: academicReady
                    ? `${profile.department ?? ""}${profile.year_level ? ` • ${profile.year_level}` : ""}`
                    : "Choose your department, program, and year level.",
                accent: academicReady ? "indigo" : "amber",
            },
        ]
        : [];

    const loadProfile = useCallback(async () => {
        try {
            setProfileLoading(true);
            const res = await fetch("/api/scholar/account/me", { cache: "no-store" });
            const data = await res.json();

            if (!res.ok) {
                if (handleRateLimitError(res, data, "Too many profile requests. Please wait before trying again.")) {
                    return;
                }
                throw new Error(data.error ?? "Failed to load scholar profile");
            }

            if (data.error) {
                throw new Error(data.error);
            }

            setProfile(normalizeProfile(data, data.profile ?? null));
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to load scholar profile");
            setProfile(null);
        } finally {
            setProfileLoading(false);
            setInitializing(false);
        }
    }, []);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const handleProfileSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!profile) return;

            if (!profile.fname.trim() || !profile.lname.trim()) {
                toast.error("First and last name are required.");
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

            try {
                setUpdating(true);

                const payload = formatRequestPayload(updatedProfile);
                const res = await fetch("/api/scholar/account/me", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profile: payload }),
                });
                const data = await res.json();

                if (!res.ok) {
                    if (handleRateLimitError(res, data, "Too many profile updates. Please wait before trying again.")) {
                        return;
                    }
                    throw new Error(data.error ?? "Failed to update profile");
                }

                if (data.error) {
                    throw new Error(data.error);
                }

                toast.success("Scholar profile updated successfully!");
                if (data.verificationEmailSent) {
                    const targetEmail = data.profile?.email?.trim();
                    toast.success(
                        targetEmail
                            ? `A verification email was sent to ${targetEmail}. Please confirm it to receive clinic notifications.`
                            : "A verification email was sent. Please check your inbox to confirm the address."
                    );
                }
                if (data.profile) {
                    setProfile((prev) => (prev ? { ...prev, ...mapUpdatedProfile(data.profile) } : prev));
                }
            } catch (error) {
                console.error(error);
                toast.error(error instanceof Error ? error.message : "Failed to update profile");
            } finally {
                setUpdating(false);
            }
        },
        [profile]
    );

    const handlePasswordSubmit = useCallback(async ({
        oldPassword,
        newPassword,
    }: {
        oldPassword: string;
        newPassword: string;
    }): Promise<AccountPasswordResult> => {
        try {
            const res = await fetch("/api/scholar/account/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                return { error: data.error ?? "Failed to update password" };
            }

            return { success: data.message ?? "Password updated successfully!" };
        } catch (error) {
            console.error(error);
            return { error: "Failed to update password. Please try again." };
        }
    }, []);

    const confirmDateOfBirth = useCallback(async () => {
        if (!profile || !tempDOB) return;

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

        try {
            setDobSaving(true);
            const payload = formatRequestPayload(updatedProfile);
            const res = await fetch("/api/scholar/account/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile: payload }),
            });
            const data = await res.json();

            if (!res.ok) {
                if (handleRateLimitError(res, data, "Too many profile updates. Please wait before trying again.")) {
                    return;
                }
                throw new Error(data.error ?? "Failed to save date of birth");
            }

            if (data.error) {
                throw new Error(data.error);
            }

            toast.success("Date of birth saved!");
            if (data.verificationEmailSent) {
                const targetEmail = data.profile?.email?.trim();
                toast.success(
                    targetEmail
                        ? `A verification email was sent to ${targetEmail}. Please confirm it to receive clinic notifications.`
                        : "A verification email was sent. Please check your inbox to confirm the address."
                );
            }
            setDobConfirmOpen(false);
            setTempDOB("");
            await loadProfile();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to save date of birth");
        } finally {
            setDobSaving(false);
        }
    }, [loadProfile, profile, tempDOB]);

    if (initializing) {
        return <ScholarAccountLoading />;
    }

    return (
        <ScholarLayout
            title="Account Management"
            description="Review your personal information, keep emergency contacts current, and manage your clinic credentials."
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
            <div className="mx-auto w-full max-w-5xl space-y-8">
                {profileLoading ? (
                    <Card className="rounded-[28px] border border-emerald-100/70 bg-white/95 px-6 py-8 text-center shadow-sm backdrop-blur">
                        <div className="flex flex-col items-center gap-3 text-emerald-700">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <p className="text-sm font-medium">Loading your scholar profile…</p>
                        </div>
                    </Card>
                ) : null}

                {profile ? (
                    <div className="space-y-8">
                        <AccountSummaryGrid items={summaryItems} />
                        <AccountCard
                            title="Scholar profile"
                            description="Keep your details accurate so the clinic team can reach you quickly."
                            onPasswordSubmit={handlePasswordSubmit}
                            onPasswordSuccess={(message) => toast.success(message)}
                        >
                            <form className="space-y-10" onSubmit={handleProfileSubmit}>
                                <AccountSection
                                    icon={KeyRound}
                                    title="Account credentials"
                                    description="Reference-only identifiers used across clinic services."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">User ID</Label>
                                            <Input value={profile.user_id} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Scholar ID</Label>
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
                                                <Input type="date" value={profile.date_of_birth.slice(0, 10)} disabled />
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
                                                            onClick={() => setDobConfirmOpen(true)}
                                                        >
                                                            Confirm date
                                                        </Button>
                                                    ) : null}
                                                    <p className="text-xs text-muted-foreground">
                                                        This can only be saved once. Double-check before confirming.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Gender</Label>
                                            <Input value={profile.gender ?? ""} disabled />
                                        </div>
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={UserRound}
                                    title="Personal information"
                                    description="Update your core personal details."
                                >
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">First name</Label>
                                            <Input
                                                value={profile.fname}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, fname: event.target.value } : prev
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Middle name</Label>
                                            <Input
                                                value={profile.mname ?? ""}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, mname: event.target.value } : prev
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Last name</Label>
                                            <Input
                                                value={profile.lname}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, lname: event.target.value } : prev
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={GraduationCap}
                                    title="Academic information"
                                    description="Help the clinic coordinate with your department."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Department</Label>
                                            <Select
                                                value={profile.department ?? ""}
                                                onValueChange={(value) =>
                                                    setProfile((prev) =>
                                                        prev
                                                            ? {
                                                                ...prev,
                                                                department: value,
                                                                program: "",
                                                                year_level: "",
                                                            }
                                                            : prev
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departmentOptions.map((department) => (
                                                        <SelectItem key={department} value={department}>
                                                            {department}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Program</Label>
                                            <Select
                                                value={profile.program ?? ""}
                                                onValueChange={(value) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, program: value } : prev
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select program" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availablePrograms.map((program) => (
                                                        <SelectItem key={program} value={program}>
                                                            {program}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Year level</Label>
                                            <Select
                                                value={profile.year_level ?? ""}
                                                onValueChange={(value) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, year_level: value } : prev
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select year level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {yearLevelOptions.map((level) => (
                                                        <SelectItem key={level} value={level}>
                                                            {level}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={Phone}
                                    title="Contact & address"
                                    description="Provide reliable contact information for clinic coordination."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="example@hnu.edu.ph"
                                                value={profile.email ?? ""}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, email: event.target.value } : prev
                                                    )
                                                }
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
                                                value={profile.contactno ?? ""}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, contactno: event.target.value } : prev
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-emerald-900">Address</Label>
                                        <Input
                                            value={profile.address ?? ""}
                                            onChange={(event) =>
                                                setProfile((prev) =>
                                                    prev ? { ...prev, address: event.target.value } : prev
                                                )
                                            }
                                        />
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={HeartPulse}
                                    title="Medical history"
                                    description="Helps the clinic respond quickly in emergencies."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Blood type</Label>
                                            <Select
                                                value={profile.bloodtype ?? ""}
                                                onValueChange={(value) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, bloodtype: value } : prev
                                                    )
                                                }
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
                                                value={profile.allergies ?? ""}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, allergies: event.target.value } : prev
                                                    )
                                                }
                                                placeholder="Please specify"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-emerald-900">
                                            Medical conditions
                                        </Label>
                                        <MedicalHistoryField
                                            value={profile.medicalHistory}
                                            onChange={(next) =>
                                                setProfile((prev) =>
                                                    prev ? { ...prev, medicalHistory: next } : prev
                                                )
                                            }
                                            idPrefix="scholar-medical-history"
                                        />
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={LifeBuoy}
                                    title="Emergency contact"
                                    description="Provide someone we can reach in urgent situations."
                                >
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Contact name</Label>
                                            <Input
                                                value={profile.emergencyco_name ?? ""}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, emergencyco_name: event.target.value } : prev
                                                    )
                                                }
                                                placeholder="Full name of contact"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Contact number</Label>
                                            <Input
                                                value={profile.emergencyco_num ?? ""}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, emergencyco_num: event.target.value } : prev
                                                    )
                                                }
                                                placeholder="09XXXXXXXXX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Relationship</Label>
                                            <Input
                                                value={profile.emergencyco_relation ?? ""}
                                                onChange={(event) =>
                                                    setProfile((prev) =>
                                                        prev ? { ...prev, emergencyco_relation: event.target.value } : prev
                                                    )
                                                }
                                                placeholder="Contact’s relationship"
                                            />
                                        </div>
                                    </div>
                                </AccountSection>

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <AccountRefreshButton
                                        onClick={() => void loadProfile()}
                                        disabled={profileLoading || updating || dobSaving}
                                        isRefreshing={profileLoading}
                                    />
                                    <Button
                                        type="submit"
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                                        disabled={updating || dobSaving}
                                    >
                                        {updating || dobSaving ? (
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
                ) : (
                    <Card className="rounded-[28px] border border-rose-100/70 bg-white/95 px-6 py-8 text-center shadow-sm backdrop-blur">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">We couldn&apos;t load your scholar profile right now.</p>
                            <Button
                                variant="outline"
                                className="mx-auto w-full max-w-[200px] rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => void loadProfile()}
                                disabled={profileLoading}
                            >
                                Try again
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            <AlertDialog open={dobConfirmOpen} onOpenChange={setDobConfirmOpen}>
                <AlertDialogContent className="max-w-sm rounded-3xl border border-emerald-100/80 bg-white/95">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm date of birth</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to set your date of birth to
                            <span className="font-semibold text-emerald-700"> {tempDOB}</span>.
                            This action can only be done once and cannot be changed later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setTempDOB("");
                                setDobConfirmOpen(false);
                            }}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => void confirmDateOfBirth()}
                            disabled={dobSaving}
                        >
                            {dobSaving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                                </span>
                            ) : (
                                "Confirm"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ScholarLayout>
    );

}
