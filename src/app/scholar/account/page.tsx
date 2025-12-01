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
    isWorkingScholar: boolean;
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
        isWorkingScholar: Boolean(response.isWorkingScholar),
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
    const [tempGender, setTempGender] = useState<"Male" | "Female" | "">("");
    const [genderConfirmOpen, setGenderConfirmOpen] = useState(false);
    const [genderSaving, setGenderSaving] = useState(false);

    const availablePrograms = useMemo(
        () => (profile?.department ? programOptions[profile.department] ?? [] : []),
        [profile?.department]
    );

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

    const confirmGender = useCallback(async () => {
        if (!profile || !tempGender) return;

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
            gender: tempGender,
        };

        setProfile(updatedProfile);

        try {
            setGenderSaving(true);
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
                throw new Error(data.error ?? "Failed to save gender");
            }

            if (data.error) {
                throw new Error(data.error);
            }

            toast.success("Gender saved!");
            if (data.verificationEmailSent) {
                const targetEmail = data.profile?.email?.trim();
                toast.success(
                    targetEmail
                        ? `A verification email was sent to ${targetEmail}. Please confirm it to receive clinic notifications.`
                        : "A verification email was sent. Please check your inbox to confirm the address."
                );
            }
            await loadProfile();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to save gender");
        } finally {
            setGenderSaving(false);
            setGenderConfirmOpen(false);
        }
    }, [loadProfile, profile, tempGender]);

    if (initializing) {
        return <ScholarAccountLoading />;
    }

    if (!profile) {
        return (
            <ScholarLayout
                title="Account Management"
                description="Review your personal information, keep emergency contacts current, and manage your clinic credentials."
                actions={
                    <div className="flex items-center gap-3">
                        <AccountRefreshButton
                            onClick={() => void loadProfile()}
                            disabled={profileLoading}
                            isRefreshing={profileLoading}
                        />
                    </div>
                }
            >
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <Card className="rounded-[28px] border border-emerald-100/70 bg-white/95 px-6 py-8 shadow-sm backdrop-blur">
                        <div className="space-y-2 text-center text-emerald-900">
                            <p className="text-base font-semibold">We couldn’t load your profile.</p>
                            <p className="text-sm text-muted-foreground">
                                Please refresh to try again. If the issue persists, contact the clinic team.
                            </p>
                        </div>
                    </Card>
                </div>
            </ScholarLayout>
        );
    }

    if (profile.isWorkingScholar) {
        const cleanedId = profile.username.replace(/-\d+$/, "");

        return (
            <ScholarLayout
                title="Account Management"
                description="Your working scholar access is linked to your patient student record."
                actions={
                    <div className="flex items-center gap-3">
                        <AccountRefreshButton
                            onClick={() => void loadProfile()}
                            disabled={profileLoading}
                            isRefreshing={profileLoading}
                        />
                    </div>
                }
            >
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-6 py-5 text-amber-900">
                        <p className="text-sm font-semibold">Linked to your student patient profile</p>
                        <p className="text-sm text-amber-800">
                            Core details come from your patient record. To change them, open your patient account.
                        </p>
                    </div>

                    <AccountSummaryGrid items={summaryItems} />

                    <AccountSection
                        icon={UserRound}
                        title="Basic details"
                        description="View the information shared from your patient student account."
                    >
                        <dl className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl border p-4">
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Student ID</dt>
                                <dd className="text-sm font-semibold text-primary">{cleanedId || "—"}</dd>
                            </div>
                            <div className="rounded-xl border p-4">
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Full name</dt>
                                <dd className="text-sm font-semibold text-primary">
                                    {[profile.fname, profile.mname, profile.lname].filter(Boolean).join(" ") || "—"}
                                </dd>
                            </div>
                            <div className="rounded-xl border p-4">
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Department</dt>
                                <dd className="text-sm font-semibold text-primary">{profile.department || "—"}</dd>
                            </div>
                            <div className="rounded-xl border p-4">
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Program & Year</dt>
                                <dd className="text-sm font-semibold text-primary">
                                    {[profile.program, profile.year_level].filter(Boolean).join(" • ") || "—"}
                                </dd>
                            </div>
                            <div className="rounded-xl border p-4">
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Contact number</dt>
                                <dd className="text-sm font-semibold text-primary">{profile.contactno || "—"}</dd>
                            </div>
                            <div className="rounded-xl border p-4">
                                <dt className="text-xs uppercase tracking-wide text-gray-500">Email</dt>
                                <dd className="text-sm font-semibold text-primary">{profile.email || "—"}</dd>
                            </div>
                        </dl>
                    </AccountSection>
                </div>
            </ScholarLayout>
        );
    }
}
