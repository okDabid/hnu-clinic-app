"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
    Loader2,
    ShieldCheck,
    ShieldAlert,
    BarChart3,
    LifeBuoy,
    GraduationCap,
    Briefcase,
    Phone,
    UserRound,
    KeyRound,
    HeartPulse,
} from "lucide-react";

import PatientLayout from "@/components/patient/patient-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import { AccountCard } from "@/components/account/account-card";
import { AccountRefreshButton } from "@/components/account/account-refresh-button";
import { AccountSection } from "@/components/account/account-section";
import { AccountSummaryGrid } from "@/components/account/account-summary";
import type { AccountSummaryItem } from "@/components/account/account-summary";
import type { AccountPasswordResult } from "@/components/account/account-password-dialog";
import { validateAndNormalizeContacts } from "@/lib/validation";
import { handleRateLimitError } from "@/lib/rate-limit-toast";

import PatientAccountLoading from "./loading";
import {
    normalizePatientAccountProfile,
    patientBloodTypeEnumMap,
    patientDepartmentEnumMap,
    patientReverseBloodTypeEnumMap,
    patientReverseDepartmentEnumMap,
    patientReverseYearLevelEnumMap,
    patientYearLevelEnumMap,
    type PatientAccountProfile,
    type PatientAccountProfileApi,
} from "./types";

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

const departmentOptions = Object.values(patientDepartmentEnumMap);
const bloodTypeOptions = Object.values(patientBloodTypeEnumMap);

export type PatientAccountPageClientProps = {
    initialProfile: PatientAccountProfile | null;
    initialPatientType: string | null;
    initialProfileLoaded: boolean;
};

export function PatientAccountPageClient({
    initialProfile,
    initialPatientType,
    initialProfileLoaded,
}: PatientAccountPageClientProps) {
    const normalizedTypeValue =
        initialPatientType === "student" || initialPatientType === "employee"
            ? initialPatientType
            : null;
    const [profile, setProfile] = useState<PatientAccountProfile | null>(initialProfile);
    const [profileLoading, setProfileLoading] = useState(false);
    const [hydratingProfile, setHydratingProfile] = useState(false);

    const [initializing, setInitializing] = useState(!initialProfileLoaded);

    const [profileType, setProfileType] = useState<"student" | "employee" | null>(normalizedTypeValue);
    const [profileLoaded, setProfileLoaded] = useState(initialProfileLoaded);

    const [tempDOB, setTempDOB] = useState("");
    const [showDOBConfirm, setShowDOBConfirm] = useState(false);
    const [refreshingProfile, setRefreshingProfile] = useState(false);

    useEffect(() => {
        if (initialProfileLoaded) {
            setInitializing(false);
        }
    }, [initialProfileLoaded]);

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

    const loadProfile = useCallback(async ({ fromRefresh = false } = {}) => {
        try {
            if (fromRefresh) {
                setRefreshingProfile(true);
            }
            setHydratingProfile(true);
            const res = await fetch("/api/patient/account/me", { cache: "no-store" });
            const data = await res.json();
            if (!res.ok) {
                if (handleRateLimitError(res, data, "Too many profile requests. Please wait before trying again.")) {
                    return;
                }
                toast.error((data as { error?: string })?.error ?? "Failed to load profile");
                return;
            }
            if ((data as { error?: string })?.error) {
                toast.error((data as { error?: string })?.error ?? "Failed to load profile");
                return;
            }

            const normalized = normalizePatientAccountProfile(data as PatientAccountProfileApi);
            const nextType =
                normalized.type === "student" || normalized.type === "employee" ? normalized.type : null;
            setProfile(normalized.profile);
            setProfileType(nextType);
            setProfileLoaded(Boolean(normalized.profile));
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setHydratingProfile(false);
            setInitializing(false);
            if (fromRefresh) {
                setRefreshingProfile(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!profileLoaded) {
            void loadProfile();
        }
    }, [profileLoaded, loadProfile]);

    const layoutTitle = hydratingProfile
        ? "Loading profile"
        : profileType === "employee"
          ? "Employee profile"
          : profileType === "student"
            ? "Student profile"
            : "Account overview";

    const layoutDescription = hydratingProfile
        ? "Please wait while we retrieve your account data."
        : "Review and update your personal, academic, and emergency contact information to keep the clinic prepared.";

    const statusBadge = profile?.status ?? null;

    const completionFields = profile
        ? [
              profile.email,
              profile.contactno,
              profile.address,
              profile.bloodtype,
              profile.allergies,
              profile.medical_cond,
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

    const summaryItems: AccountSummaryItem[] = profile
        ? [
              {
                  icon: profile.status === "Active" ? ShieldCheck : ShieldAlert,
                  label: "Account status",
                  value: profile.status,
                  helper:
                      profile.status === "Active"
                          ? "Your account can access clinic services."
                          : "Contact the clinic team to reactivate access.",
                  accent: profile.status === "Active" ? "emerald" : "rose",
              },
              {
                  icon: BarChart3,
                  label: "Profile completeness",
                  value: `${completionPercent}% complete`,
                  helper:
                      completionPercent >= 100
                          ? "All essential profile fields are complete."
                          : "Add missing contact or medical information.",
                  progress: completionPercent,
                  accent:
                      completionPercent >= 80
                          ? "emerald"
                          : completionPercent >= 50
                            ? "amber"
                            : "rose",
              },
              {
                  icon: LifeBuoy,
                  label: "Emergency readiness",
                  value: emergencyReady ? "Ready" : "Action required",
                  helper: emergencyReady
                      ? `${profile.emergencyco_name || "Emergency contact"}${
                            profile.emergencyco_relation ? ` (${profile.emergencyco_relation})` : ""
                        } • ${profile.emergencyco_num || "—"}`
                      : "Provide an emergency contact name, number, and relationship.",
                  accent: emergencyReady ? "teal" : "amber",
              },
          ]
        : [];

    const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!profile) return;
        if (!profile.fname.trim() || !profile.lname.trim()) {
            toast.error("First and Last Name are required.");
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
            setProfileLoading(true);
            const payload = {
                ...updatedProfile,
                department:
                    profileType === "student"
                        ? patientReverseDepartmentEnumMap[updatedProfile.department || ""] || null
                        : updatedProfile.department || null,
                year_level:
                    profileType === "student"
                        ? patientReverseYearLevelEnumMap[updatedProfile.year_level || ""] || null
                        : null,
                bloodtype: patientReverseBloodTypeEnumMap[updatedProfile.bloodtype || ""] || null,
            };

            const res = await fetch("/api/patient/account/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile: payload }),
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
                toast.success(
                    profileType === "employee"
                        ? "Employee profile updated successfully!"
                        : "Profile updated successfully!"
                );
                if (data.verificationEmailSent) {
                    const targetEmail = data.profile?.email?.trim();
                    toast.success(
                        targetEmail
                            ? `A verification email was sent to ${targetEmail}. Please confirm it to receive clinic notifications.`
                            : "A verification email was sent. Please check your inbox to confirm the address."
                    );
                }
                setProfile((prev) => ({
                    ...prev!,
                    ...data.profile,
                    department: data.profile.department
                        ? patientDepartmentEnumMap[data.profile.department]
                        : prev?.department,
                    year_level: data.profile.year_level
                        ? patientYearLevelEnumMap[data.profile.year_level]
                        : prev?.year_level,
                    bloodtype: data.profile.bloodtype
                        ? patientBloodTypeEnumMap[data.profile.bloodtype]
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

    const handlePasswordSubmit = useCallback(
        async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }): Promise<AccountPasswordResult> => {
            try {
                const res = await fetch("/api/patient/account/password", {
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

    if (initializing) {
        return <PatientAccountLoading />;
    }

    return (
        <PatientLayout
            title={layoutTitle}
            description={layoutDescription}
            actions={
                statusBadge ? (
                    <span
                        className={`hidden items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-sm md:inline-flex ${
                            statusBadge === "Active"
                                ? "border-emerald-200 bg-emerald-50/80 text-emerald-700"
                                : "border-rose-200 bg-rose-50/80 text-rose-600"
                        }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${
                                statusBadge === "Active" ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                        />
                        Status: {statusBadge}
                    </span>
                ) : null
            }
        >
            <div className="mx-auto w-full max-w-5xl space-y-8">
                {hydratingProfile ? (
                    <Card className="rounded-[28px] border border-emerald-100/70 bg-white/95 px-6 py-8 text-center shadow-sm backdrop-blur">
                        <div className="flex flex-col items-center gap-3 text-emerald-700">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <p className="text-sm font-medium">Refreshing your profile information…</p>
                        </div>
                    </Card>
                ) : null}

                {!hydratingProfile && !profile ? (
                    <Card className="rounded-[28px] border border-emerald-100/70 bg-white/95 px-6 py-8 text-center shadow-sm backdrop-blur">
                        <p className="text-sm text-muted-foreground">
                            We couldn&apos;t load your account information right now. Please refresh or contact the clinic team.
                        </p>
                    </Card>
                ) : null}

                {profile ? (
                    <div className="space-y-8">
                        <AccountSummaryGrid items={summaryItems} />
                        <AccountCard
                            description="Update your personal, academic, and emergency details to keep the clinic team prepared."
                            onPasswordSubmit={handlePasswordSubmit}
                        >
                            <form onSubmit={handleProfileUpdate} className="space-y-10">
                                <AccountSection
                                    icon={KeyRound}
                                    title="Account credentials"
                                    description="Reference-only details used across clinic systems."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">User ID</Label>
                                            <Input value={profile.user_id} disabled />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">
                                                {profileType === "student"
                                                    ? "School ID"
                                                    : profileType === "employee"
                                                      ? "Employee ID"
                                                      : "ID"}
                                            </Label>
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
                                                    {showDOBConfirm ? (
                                                        <AlertDialog open onOpenChange={setShowDOBConfirm}>
                                                            <AlertDialogContent className="max-w-sm sm:max-w-md">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Confirm Date of Birth</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        You are about to set your Date of Birth to{" "}
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
                                                                                    department:
                                                                                        profileType === "student"
                                                                                            ? patientReverseDepartmentEnumMap[
                                                                                                  updatedProfile.department || ""
                                                                                              ] || null
                                                                                            : updatedProfile.department || null,
                                                                                    year_level:
                                                                                        profileType === "student"
                                                                                            ? patientReverseYearLevelEnumMap[
                                                                                                  updatedProfile.year_level || ""
                                                                                              ] || null
                                                                                            : null,
                                                                                    bloodtype:
                                                                                        patientReverseBloodTypeEnumMap[
                                                                                            updatedProfile?.bloodtype || ""
                                                                                        ] || null,
                                                                                };

                                                                                const res = await fetch("/api/patient/account/me", {
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
                                                    ) : null}
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
                                    description="Keep your basic profile details current for accurate records."
                                >
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">First name</Label>
                                            <Input
                                                value={profile.fname}
                                                onChange={(e) => setProfile({ ...profile, fname: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Middle name</Label>
                                            <Input
                                                value={profile.mname || ""}
                                                onChange={(e) => setProfile({ ...profile, mname: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Last name</Label>
                                            <Input
                                                value={profile.lname}
                                                onChange={(e) => setProfile({ ...profile, lname: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </AccountSection>

                                <AccountSection
                                    icon={Phone}
                                    title="Contact & address"
                                    description="Where the clinic can reach you for updates and reminders."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="example@hnu.edu.ph"
                                                value={profile.email || ""}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
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
                                                onChange={(e) => setProfile({ ...profile, contactno: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-emerald-900">Address</Label>
                                        <Input
                                            value={profile.address || ""}
                                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        />
                                    </div>
                                </AccountSection>

                                {profileType === "student" ? (
                                    <AccountSection
                                        icon={GraduationCap}
                                        title="Academic information"
                                        description="Help the clinic coordinate with your department."
                                    >
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-emerald-900">Department</Label>
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
                                                    <SelectTrigger className="w-full whitespace-normal text-left leading-snug">
                                                        <SelectValue
                                                            className="line-clamp-none whitespace-normal text-left"
                                                            placeholder="Select department"
                                                        />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {departmentOptions.map((dept) => (
                                                            <SelectItem key={dept} value={dept}>
                                                                {dept}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-emerald-900">Program</Label>
                                                <Select
                                                    value={profile.program || ""}
                                                    onValueChange={(val) => setProfile({ ...profile, program: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select program" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(programOptions[profile.department || ""] || []).map((prog) => (
                                                            <SelectItem key={prog} value={prog}>
                                                                {prog}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-emerald-900">Year level</Label>
                                                <Select
                                                    value={profile.year_level || ""}
                                                    onValueChange={(val) => setProfile({ ...profile, year_level: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select year level" />
                                                    </SelectTrigger>
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
                                    </AccountSection>
                                ) : null}

                                {profileType === "employee" ? (
                                    <AccountSection
                                        icon={Briefcase}
                                        title="Employment information"
                                        description="Share your latest office or department details."
                                    >
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-emerald-900">Department / Office</Label>
                                                <Input
                                                    value={profile.department || ""}
                                                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                                    placeholder="e.g. HR, Accounting, Nursing"
                                                />
                                            </div>
                                        </div>
                                    </AccountSection>
                                ) : null}

                                <AccountSection
                                    icon={HeartPulse}
                                    title="Medical background"
                                    description="Supports faster care during clinic visits."
                                >
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Blood type</Label>
                                            <Select
                                                value={profile.bloodtype || ""}
                                                onValueChange={(val) => setProfile({ ...profile, bloodtype: val })}
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
                                                onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-emerald-900">Medical conditions</Label>
                                        <Input
                                            value={profile.medical_cond || ""}
                                            onChange={(e) => setProfile({ ...profile, medical_cond: e.target.value })}
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
                                                value={profile.emergencyco_name || ""}
                                                onChange={(e) => setProfile({ ...profile, emergencyco_name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Contact number</Label>
                                            <Input
                                                value={profile.emergencyco_num || ""}
                                                onChange={(e) => setProfile({ ...profile, emergencyco_num: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Relationship</Label>
                                            <Input
                                                value={profile.emergencyco_relation || ""}
                                                onChange={(e) =>
                                                    setProfile({ ...profile, emergencyco_relation: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                </AccountSection>

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <AccountRefreshButton
                                        onClick={() => void loadProfile({ fromRefresh: true })}
                                        disabled={hydratingProfile || profileLoading}
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
            </div>
        </PatientLayout>
    );
}

export default PatientAccountPageClient;
