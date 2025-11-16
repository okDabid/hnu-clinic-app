"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Loader2,
    ShieldCheck,
    ShieldAlert,
    BarChart3,
    Stethoscope,
    Phone,
    UserRound,
    KeyRound,
    HeartPulse,
    LifeBuoy,
} from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AccountCard } from "@/components/account/account-card";
import { AccountRefreshButton } from "@/components/account/account-refresh-button";
import { AccountSection } from "@/components/account/account-section";
import { MedicalHistoryField } from "@/components/account/medical-history-field";
import { AccountSummaryGrid } from "@/components/account/account-summary";
import type { AccountSummaryItem } from "@/components/account/account-summary";
import type { AccountPasswordResult } from "@/components/account/account-password-dialog";
import {
    parseMedicalHistory,
    serializeMedicalHistory,
    type MedicalHistoryValue,
} from "@/lib/medical-history";
import { validateAndNormalizeContacts } from "@/lib/validation";
import { handleRateLimitError } from "@/lib/rate-limit-toast";

import DoctorAccountLoading from "./loading";

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

type Profile = {
    user_id: string;
    username: string;
    role: string;
    status: "Active" | "Inactive";
    fname: string;
    mname?: string | null;
    lname: string;
    date_of_birth?: string;
    gender?: string | null;
    email?: string;
    contactno?: string | null;
    address?: string | null;
    bloodtype?: string | null;
    allergies?: string | null;
    medicalHistory: MedicalHistoryValue;
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

// Blood Type Mappings
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

export default function DoctorAccountPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    const [tempDOB, setTempDOB] = useState("");
    const [showDOBConfirm, setShowDOBConfirm] = useState(false);
    const [refreshing, setRefreshing] = useState(false);


    // Load Profile
    const loadProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/doctor/account/me", {
                cache: "no-store",
                next: { revalidate: 0 }, // ensures it always re-fetches
            });

            const data = await res.json();

            if (!res.ok) {
                if (handleRateLimitError(res, data, "Too many profile requests. Please wait before trying again.")) {
                    return;
                }
                toast.error(data?.error ?? "Failed to load profile");
                return;
            }

            if (data.error) {
                toast.error(data.error);
                return;
            }

            // Normalize blood type no matter what format the backend sends
            const bloodTypeValue =
                typeof data.profile?.bloodtype === "string"
                    ? bloodTypeEnumMap[data.profile.bloodtype] || data.profile.bloodtype
                    : "";

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
                contactno: data.profile?.contactno || "",
                email: data.profile?.email || "",
                address: data.profile?.address || "",
                bloodtype: bloodTypeValue,
                allergies: data.profile?.allergies || "",
                medicalHistory: parseMedicalHistory(data.profile?.medical_cond || ""),
                emergencyco_name: data.profile?.emergencyco_name || "",
                emergencyco_num: data.profile?.emergencyco_num || "",
                emergencyco_relation: data.profile?.emergencyco_relation || "",
            });
        } catch (err) {
            console.error("Failed to load profile:", err);
            toast.error("Failed to load profile");
        } finally {
            setInitializing(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // Update Profile
    async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
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
            const { medicalHistory, ...restProfile } = updatedProfile;
            const payload = {
                ...restProfile,
                medical_cond: serializeMedicalHistory(medicalHistory),
                bloodtype: reverseBloodTypeEnumMap[updatedProfile.bloodtype || ""] || null,
            };

            const res = await fetch("/api/doctor/account/me", {
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
                toast.success("Profile updated successfully!");
                if (data.verificationEmailSent) {
                    const targetEmail = data.profile?.email?.trim();
                    toast.success(
                        targetEmail
                            ? `A verification email was sent to ${targetEmail}. Please confirm it to receive clinic notifications.`
                            : "A verification email was sent. Please check your inbox to confirm the address."
                    );
                }

                // Update local state to reflect readable blood type again
                setProfile((prev) => ({
                    ...prev!,
                    ...updatedProfile,
                    bloodtype:
                        updatedProfile.bloodtype ||
                        (data.profile?.bloodtype
                            ? bloodTypeEnumMap[data.profile.bloodtype] || prev?.bloodtype
                            : prev?.bloodtype),
                }));

            }
        } catch (err) {
            console.error("Profile update failed:", err);
            toast.error("Failed to update profile");
        } finally {
            setProfileLoading(false);
        }
    }

    const handlePasswordSubmit = useCallback(
        async ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }): Promise<AccountPasswordResult> => {
            try {
                const res = await fetch("/api/doctor/account/password", {
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

    const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const statusBadge = profile?.status ?? null;

    const completionFields = profile
        ? [
            profile.email,
            profile.contactno,
            profile.address,
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

    const medicalPrepared = Boolean(profile?.bloodtype?.trim());

    const summaryItems: AccountSummaryItem[] = profile
        ? [
            {
                icon: profile.status === "Active" ? ShieldCheck : ShieldAlert,
                label: "Account status",
                value: profile.status,
                helper:
                    profile.status === "Active"
                        ? "Ready to access clinic systems."
                        : "Contact the administrator to reactivate your access.",
                accent: profile.status === "Active" ? "emerald" : "rose",
            },
            {
                icon: BarChart3,
                label: "Profile completeness",
                value: `${completionPercent}% complete`,
                helper:
                    completionPercent >= 100
                        ? "All key contact details are filled."
                        : "Add missing contact or emergency details.",
                progress: completionPercent,
                accent:
                    completionPercent >= 80
                        ? "emerald"
                        : completionPercent >= 50
                            ? "amber"
                            : "rose",
            },
            {
                icon: HeartPulse,
                label: "Clinical readiness",
                value: medicalPrepared ? profile.bloodtype ?? "" : "Add blood type",
                helper: medicalPrepared
                    ? `${profile.allergies?.trim() ? `Allergies: ${profile.allergies}` : "No allergies listed"
                    }. ${emergencyReady
                        ? `Emergency contact: ${profile.emergencyco_name || "—"}`
                        : "Add an emergency contact for urgent coordination."
                    }`
                    : "Provide blood type and medical notes to aid urgent care.",
                accent: medicalPrepared ? "teal" : "amber",
            },
        ]
        : [];

    const handleManualRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            await loadProfile();
        } finally {
            setRefreshing(false);
        }
    }, [loadProfile]);

    if (initializing) {
        return <DoctorAccountLoading />;
    }

    return (
        <DoctorLayout
            title="Account Management"
            description="Keep your clinic profile accurate, secure, and ready for seamless coordination."
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
            <div className="mx-auto w-full max-w-4xl space-y-8">
                {profileLoading ? (
                    <Card className="rounded-[28px] border border-emerald-100/70 bg-white/95 px-6 py-6 text-center shadow-sm backdrop-blur">
                        <div className="flex flex-col items-center gap-3 text-emerald-700">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <p className="text-sm font-medium">Saving your latest updates…</p>
                        </div>
                    </Card>
                ) : null}

                {refreshing ? (
                    <Card className="rounded-[28px] border border-emerald-100/70 bg-white/95 px-6 py-6 text-center shadow-sm backdrop-blur">
                        <div className="flex flex-col items-center gap-3 text-emerald-700">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <p className="text-sm font-medium">Refreshing your profile data…</p>
                        </div>
                    </Card>
                ) : null}

                {profile ? (
                    <div className="space-y-8">
                        <AccountSummaryGrid items={summaryItems} />
                        <AccountCard
                            description="Update your personal details, emergency contacts, and credentials to keep clinic records current."
                            onPasswordSubmit={handlePasswordSubmit}
                        >
                            <form onSubmit={handleProfileUpdate} className="space-y-10">
                                <AccountSection
                                    icon={KeyRound}
                                    title="Account credentials"
                                    description="Reference details used across clinic systems."
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
                                                    <AlertDialog open={showDOBConfirm} onOpenChange={setShowDOBConfirm}>
                                                        <AlertDialogContent className="max-w-sm sm:max-w-md">
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
                                                                                    reverseBloodTypeEnumMap[
                                                                                    updatedProfile?.bloodtype || ""
                                                                                    ] || null,
                                                                            };

                                                                            const res = await fetch("/api/doctor/account/me", {
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
                                    description="Keep your basic profile details current for accurate coordination."
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
                                    description="Ensure the clinic can reach you for urgent updates."
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

                                <AccountSection
                                    icon={HeartPulse}
                                    title="Medical history"
                                    description="Supports faster care during clinical operations."
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
                                        <Label className="text-sm font-medium text-emerald-900">
                                            Medical conditions
                                        </Label>
                                        <MedicalHistoryField
                                            value={profile.medicalHistory}
                                            onChange={(value) => setProfile({ ...profile, medicalHistory: value })}
                                            idPrefix="doctor-medical-history"
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
                                                onChange={(e) => setProfile({ ...profile, emergencyco_name: e.target.value })}
                                                placeholder="Full name of contact"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Contact number</Label>
                                            <Input
                                                value={profile.emergencyco_num || ""}
                                                onChange={(e) => setProfile({ ...profile, emergencyco_num: e.target.value })}
                                                placeholder="09XXXXXXXXX"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-emerald-900">Relationship</Label>
                                            <Input
                                                value={profile.emergencyco_relation || ""}
                                                onChange={(e) => setProfile({ ...profile, emergencyco_relation: e.target.value })}
                                                placeholder="Contact’s relationship"
                                            />
                                        </div>
                                    </div>
                                </AccountSection>

                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <AccountRefreshButton
                                        onClick={() => void handleManualRefresh()}
                                        disabled={refreshing || profileLoading}
                                        isRefreshing={refreshing}
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
                ) : (
                    <Card className="rounded-[28px] border border-emerald-100/70 bg-white/95 px-6 py-6 text-center shadow-sm backdrop-blur">
                        <div className="space-y-2">
                            <Stethoscope className="mx-auto h-6 w-6 text-emerald-600" />
                            <p className="text-sm text-muted-foreground">
                                We couldn&apos;t retrieve your account information right now. Try refreshing or contact the clinic administrator.
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </DoctorLayout>
    );

}
