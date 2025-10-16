"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Loader2,
    Cog,
    Eye,
    EyeOff,
} from "lucide-react";

import DoctorLayout from "@/components/doctor/doctor-layout";
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
    emergencyco_name?: string | null;
    emergencyco_num?: string | null;
    emergencyco_relation?: string | null;
};

// 🔹 Blood Type Mappings
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

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

    const [tempDOB, setTempDOB] = useState("");
    const [showDOBConfirm, setShowDOBConfirm] = useState(false);


    // 🔹 Load Profile
    const loadProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/doctor/account/me", {
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

            setProfile({
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
            });
        } catch (err) {
            console.error("Failed to load profile:", err);
            toast.error("Failed to load profile");
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // 🔹 Update Profile
    async function handleProfileUpdate(e: React.FormEvent<HTMLFormElement>) {
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
                bloodtype: reverseBloodTypeEnumMap[profile.bloodtype || ""] || null,
            };

            const res = await fetch("/api/doctor/account/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profile: payload }),
            });

            const data = await res.json();

            if (data.error) {
                toast.error(data.error);
            } else {
                toast.success("Profile updated successfully!");

                // 🩸 Update local state to reflect readable blood type again
                setProfile((prev) => ({
                    ...prev!,
                    ...profile,
                    bloodtype:
                        profile.bloodtype ||
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

    const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    return (
        <DoctorLayout
            title="Account management"
            description="Keep your clinic profile accurate, secure, and ready for seamless coordination."
        >
            <div className="mx-auto w-full max-w-4xl space-y-10">
                {profile && (
                        <Card className="rounded-3xl border border-emerald-100/70 bg-white/85 shadow-sm">
                            <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100/70">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl sm:text-2xl font-semibold text-emerald-700">
                                        My account
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Update your personal details, emergency contacts, and credentials to keep clinic records current.
                                    </p>
                                </div>

                                {/* Password Update Dialog */}
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
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-100/70"
                                            aria-label="Update password"
                                        >
                                            <Cog className="h-5 w-5 text-emerald-600" />
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent className="w-[95%] max-w-sm sm:max-w-md lg:max-w-lg rounded-3xl border border-emerald-100 bg-white/95">
                                        <DialogHeader>
                                            <DialogTitle className="text-lg sm:text-xl font-semibold text-emerald-700">
                                                Update password
                                            </DialogTitle>
                                            <DialogDescription className="text-sm text-muted-foreground sm:text-base">
                                                Change your account password securely. Enter your current password and set a new one.
                                            </DialogDescription>
                                        </DialogHeader>

                                        {/* Password Form */}
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
                                                    const res = await fetch("/api/doctor/account/password", {
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
                                            {/* Password Fields */}
                                            <div>
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

                                            <div>
                                                <Label className="block mb-1 font-medium">Confirm Password</Label>
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

                                            {passwordErrors.length > 0 && (
                                                <ul className="text-sm text-red-600 space-y-1">
                                                    {passwordErrors.map((err, idx) => (
                                                        <li key={idx}>• {err}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {passwordMessage && <p className="text-sm text-emerald-600">{passwordMessage}</p>}

                                            <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-3">
                                                <Button
                                                    type="submit"
                                                    className="w-full sm:w-auto rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
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
                            <CardContent className="space-y-6 pt-6 text-sm text-muted-foreground">
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
                                        {/* 🗓️ Date of Birth */}
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
                                                            className="mt-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                                            onClick={() => setShowDOBConfirm(true)}
                                                        >
                                                            Confirm date
                                                        </Button>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        You can only set this once. Once saved, it cannot be changed.
                                                    </p>

                                                    {/* 🔒 Confirmation Dialog */}
                                                    <AlertDialog open={showDOBConfirm} onOpenChange={setShowDOBConfirm}>
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
                                                                        setProfile({ ...profile, date_of_birth: tempDOB });
                                                                        setShowDOBConfirm(false);

                                                                        try {
                                                                            setProfileLoading(true);
                                                                            const payload = {
                                                                                ...profile,
                                                                                date_of_birth: tempDOB,
                                                                                bloodtype:
                                                                                    reverseBloodTypeEnumMap[profile?.bloodtype || ""] || null,
                                                                            };

                                                                            const res = await fetch("/api/doctor/account/me", {
                                                                                method: "PUT",
                                                                                headers: { "Content-Type": "application/json" },
                                                                                body: JSON.stringify({ profile: payload }),
                                                                            });

                                                                            const data = await res.json();
                                                                            if (data.error) {
                                                                                toast.error(data.error);
                                                                            } else {
                                                                                toast.success("Date of Birth saved!");
                                                                                await loadProfile(); // 🔄 refresh profile
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
                                        className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                                        disabled={profileLoading}
                                    >
                                        {profileLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                                        {profileLoading ? "Saving..." : "Save Changes"}
                                    </Button>
                                </form>
                            </CardContent>

                        </Card>
                    )}
            </div>
        </DoctorLayout>
    );
}
