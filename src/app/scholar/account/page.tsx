"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import ScholarLayout from "@/components/scholar/scholar-layout";
import { AccountCard } from "@/components/account/account-card";
import { AccountPasswordResult } from "@/components/account/account-password-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    medical_cond?: string | null;
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
        medical_cond: (profile?.medical_cond as string | null) ?? "",
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
        medical_cond: (profile?.medical_cond as string | null) ?? "",
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
    return {
        ...profile,
        mname: profile.mname?.trim() ? profile.mname : null,
        email: profile.email?.trim() ? profile.email : null,
        contactno: profile.contactno?.trim() ? profile.contactno : null,
        address: profile.address?.trim() ? profile.address : null,
        bloodtype: profile.bloodtype ? reverseBloodTypeEnumMap[profile.bloodtype] ?? null : null,
        allergies: profile.allergies?.trim() ? profile.allergies : null,
        medical_cond: profile.medical_cond?.trim() ? profile.medical_cond : null,
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
    const [updating, setUpdating] = useState(false);
    const [dobConfirmOpen, setDobConfirmOpen] = useState(false);
    const [dobSaving, setDobSaving] = useState(false);
    const [tempDOB, setTempDOB] = useState("");

    const availablePrograms = useMemo(
        () => (profile?.department ? programOptions[profile.department] ?? [] : []),
        [profile?.department]
    );

    const loadProfile = useCallback(async () => {
        try {
            setProfileLoading(true);
            const res = await fetch("/api/scholar/account/me", { cache: "no-store" });
            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error ?? "Failed to load scholar profile");
            }

            setProfile(normalizeProfile(data, data.profile ?? null));
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to load scholar profile");
            setProfile(null);
        } finally {
            setProfileLoading(false);
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

            try {
                setUpdating(true);

                const payload = formatRequestPayload(profile);
                const res = await fetch("/api/scholar/account/me", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profile: payload }),
                });
                const data = await res.json();

                if (!res.ok || data.error) {
                    throw new Error(data.error ?? "Failed to update profile");
                }

                toast.success("Scholar profile updated successfully!");
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

        try {
            setDobSaving(true);
            const payload = formatRequestPayload({ ...profile, date_of_birth: tempDOB });
            const res = await fetch("/api/scholar/account/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile: payload }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error ?? "Failed to save date of birth");
            }

            toast.success("Date of birth saved!");
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

    return (
        <ScholarLayout
            title="Account Management"
            description="Review your personal information, keep emergency contacts current, and manage your clinic credentials."
        >
            <section className="space-y-6">
                {profileLoading ? (
                    <Card className="rounded-3xl border border-green-100/70 bg-white/80 shadow-sm">
                        <CardContent className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                            Loading profile...
                        </CardContent>
                    </Card>
                ) : profile ? (
                    <AccountCard
                        title="Scholar profile"
                        description="Keep your details accurate so the clinic team can reach you quickly."
                        onPasswordSubmit={handlePasswordSubmit}
                        onPasswordSuccess={(message) => toast.success(message)}
                    >
                        <form className="space-y-6" onSubmit={handleProfileSubmit}>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="mb-1 block font-medium">User ID</Label>
                                    <Input value={profile.user_id} disabled />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Scholar ID</Label>
                                    <Input value={profile.username} disabled />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Role</Label>
                                    <Input value={profile.role} disabled />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Status</Label>
                                    <Input value={profile.status} disabled />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Date of birth</Label>
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
                                                    className="mt-2 rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                                                    onClick={() => setDobConfirmOpen(true)}
                                                >
                                                    Confirm date
                                                </Button>
                                            ) : null}
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                You can only set this once. Once saved, it cannot be changed.
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Gender</Label>
                                    <Input value={profile.gender ?? ""} disabled />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="mb-1 block font-medium">First name</Label>
                                    <Input
                                        value={profile.fname}
                                        onChange={(event) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, fname: event.target.value } : prev
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Middle name</Label>
                                    <Input
                                        value={profile.mname ?? ""}
                                        onChange={(event) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, mname: event.target.value } : prev
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Last name</Label>
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

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="mb-1 block font-medium">Department</Label>
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
                                <div>
                                    <Label className="mb-1 block font-medium">Program</Label>
                                    <Select
                                        value={profile.program ?? ""}
                                        onValueChange={(value) =>
                                            setProfile((prev) => (prev ? { ...prev, program: value } : prev))
                                        }
                                        disabled={availablePrograms.length === 0}
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
                                <div>
                                    <Label className="mb-1 block font-medium">Year level</Label>
                                    <Select
                                        value={profile.year_level ?? ""}
                                        onValueChange={(value) =>
                                            setProfile((prev) => (prev ? { ...prev, year_level: value } : prev))
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

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="mb-1 block font-medium">Email</Label>
                                    <Input
                                        type="email"
                                        value={profile.email ?? ""}
                                        onChange={(event) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, email: event.target.value } : prev
                                            )
                                        }
                                        placeholder="example@hnu.edu.ph"
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Contact number</Label>
                                    <Input
                                        value={profile.contactno ?? ""}
                                        onChange={(event) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, contactno: event.target.value } : prev
                                            )
                                        }
                                        placeholder="09XXXXXXXXX"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="mb-1 block font-medium">Address</Label>
                                <Input
                                    value={profile.address ?? ""}
                                    onChange={(event) =>
                                        setProfile((prev) =>
                                            prev ? { ...prev, address: event.target.value } : prev
                                        )
                                    }
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="mb-1 block font-medium">Blood type</Label>
                                    <Select
                                        value={profile.bloodtype ?? ""}
                                        onValueChange={(value) =>
                                            setProfile((prev) => (prev ? { ...prev, bloodtype: value } : prev))
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
                                <div>
                                    <Label className="mb-1 block font-medium">Allergies</Label>
                                    <Input
                                        value={profile.allergies ?? ""}
                                        onChange={(event) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, allergies: event.target.value } : prev
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="mb-1 block font-medium">Medical conditions</Label>
                                <Input
                                    value={profile.medical_cond ?? ""}
                                    onChange={(event) =>
                                        setProfile((prev) =>
                                            prev ? { ...prev, medical_cond: event.target.value } : prev
                                        )
                                    }
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label className="mb-1 block font-medium">Emergency contact name</Label>
                                    <Input
                                        value={profile.emergencyco_name ?? ""}
                                        onChange={(event) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, emergencyco_name: event.target.value } : prev
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Emergency contact number</Label>
                                    <Input
                                        value={profile.emergencyco_num ?? ""}
                                        onChange={(event) =>
                                            setProfile((prev) =>
                                                prev ? { ...prev, emergencyco_num: event.target.value } : prev
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <Label className="mb-1 block font-medium">Emergency contact relation</Label>
                                    <Input
                                        value={profile.emergencyco_relation ?? ""}
                                        onChange={(event) =>
                                            setProfile((prev) =>
                                                prev
                                                    ? { ...prev, emergencyco_relation: event.target.value }
                                                    : prev
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-xl bg-green-600 text-sm font-semibold text-white hover:bg-green-700"
                                disabled={updating}
                            >
                                {updating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Saving changes...
                                    </span>
                                ) : (
                                    "Save changes"
                                )}
                            </Button>
                        </form>
                    </AccountCard>
                ) : (
                    <Card className="rounded-3xl border border-red-100/70 bg-white/80 shadow-sm">
                        <CardContent className="space-y-4 py-16 text-center text-sm text-muted-foreground">
                            <p>We couldn&apos;t load your scholar profile right now.</p>
                            <Button
                                variant="outline"
                                className="rounded-xl border-green-200 text-green-700 hover:bg-green-100/60"
                                onClick={() => void loadProfile()}
                            >
                                Try again
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>

            <AlertDialog open={dobConfirmOpen} onOpenChange={setDobConfirmOpen}>
                <AlertDialogContent className="max-w-sm rounded-3xl border border-green-100/80 bg-white/95">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm date of birth</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to set your date of birth to
                            <span className="font-semibold text-green-700"> {tempDOB}</span>.
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
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => void confirmDateOfBirth()}
                            disabled={dobSaving}
                        >
                            {dobSaving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
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
