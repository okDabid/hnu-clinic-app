"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPageClient() {
    const [loadingRole, setLoadingRole] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [forgotOpen, setForgotOpen] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [tokenSent, setTokenSent] = useState(false);
    const [contact, setContact] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [code, setCode] = useState("");
    const [resendTimer, setResendTimer] = useState(0);
    const [verifyingContact, setVerifyingContact] = useState<"EMAIL" | "PHONE" | null>(null);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    // ---------- LOGIN ----------
    async function handleLogin(e: React.FormEvent<HTMLFormElement>, role: string) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const payload: Record<string, string> = {
            role: role.toUpperCase(),
            password: String(formData.get("password") ?? ""),
        };

        if (role === "doctor" || role === "nurse") payload.id = String(formData.get("employee_id") ?? "");
        else if (role === "scholar") payload.id = String(formData.get("school_id") ?? "");
        else if (role === "patient") payload.id = String(formData.get("patient_id") ?? "");

        try {
            setLoadingRole(role);

            const result = await signIn("credentials", { redirect: false, ...payload });

            if (result?.error) {
                const message = result.error.includes("inactive")
                    ? "Your account is inactive. Please contact the administrator."
                    : result.error;

                toast.error(message, { position: "top-center" });
                return;
            }

            toast.success("Successful login!", { position: "top-center" });

            // 🚀 Redirect by role
            switch (payload.role) {
                case "NURSE":
                    router.push("/nurse");
                    break;
                case "DOCTOR":
                    router.push("/doctor");
                    break;
                case "SCHOLAR":
                    router.push("/scholar");
                    break;
                case "PATIENT":
                    router.push("/patient");
                    break;
                default:
                    router.push("/login");
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unexpected error occurred.";
            toast.error(message, { position: "top-center" });
        } finally {
            setLoadingRole(null);
        }
    }

    // ---------- FORGOT PASSWORD ----------
    const emailRegex = useMemo(
        () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        []
    );

    const parseContact = (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) {
            return { normalized: "", type: null as "EMAIL" | "PHONE" | null };
        }

        const lower = trimmed.toLowerCase();
        if (emailRegex.test(lower)) {
            return { normalized: lower, type: "EMAIL" as const };
        }

        const compact = trimmed.replace(/[^+\d]/g, "");

        if (/^\+639\d{9}$/.test(compact)) {
            return { normalized: compact, type: "PHONE" as const };
        }

        if (/^09\d{9}$/.test(compact)) {
            return { normalized: `+63${compact.slice(1)}`, type: "PHONE" as const };
        }

        if (/^639\d{9}$/.test(compact)) {
            return { normalized: `+${compact}`, type: "PHONE" as const };
        }

        if (/^9\d{9}$/.test(compact)) {
            return { normalized: `+63${compact}`, type: "PHONE" as const };
        }

        return { normalized: trimmed, type: null as "EMAIL" | "PHONE" | null };
    };

    useEffect(() => {
        if (!tokenSent || resendTimer <= 0) return;

        const timer = setInterval(() => {
            setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [tokenSent, resendTimer]);

    useEffect(() => {
        if (forgotOpen) return;

        setTokenSent(false);
        setContact("");
        setCode("");
        setNewPassword("");
        setConfirmPassword("");
        setResendTimer(0);
        setVerifying(false);
        setResetting(false);
        setVerifyingContact(null);
    }, [forgotOpen]);

    const requestResetCode = async (isResend = false) => {
        const { normalized, type } = parseContact(contact);
        if (!normalized || !type) {
            toast.error("Enter a valid email or Philippine mobile number.");
            return false;
        }

        setContact(normalized);
        setVerifying(true);

        try {
            const res = await fetch("/api/auth/request-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contact: normalized }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(
                    isResend
                        ? "A new verification code has been sent."
                        : "Verification code sent via Email/SMS!"
                );
                setTokenSent(true);
                setResendTimer(60);
                setVerifyingContact(type);
                return true;
            }

            toast.error(data.error || "Account not found");
            return false;
        } catch {
            toast.error("Network error. Try again.");
            return false;
        } finally {
            setVerifying(false);
        }
    };

    async function handleSendCode(e: React.FormEvent) {
        e.preventDefault();
        await requestResetCode(false);
    }

    async function handleResend() {
        if (resendTimer > 0 || verifying) return;
        await requestResetCode(true);
    }

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();

        const sanitizedCode = code.trim();
        if (!/^\d{6}$/.test(sanitizedCode)) {
            toast.error("Please enter the 6-digit verification code.");
            return;
        }

        const password = newPassword.trim();
        const confirm = confirmPassword.trim();

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
            toast.error("Use a mix of letters and numbers for a stronger password.");
            return;
        }

        if (password !== confirm) {
            toast.error("Passwords do not match.");
            return;
        }

        setResetting(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contact: contact.trim(),
                    code: sanitizedCode,
                    newPassword: password,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Password reset successful!");
                setForgotOpen(false);
                setTokenSent(false);
                setContact("");
                setNewPassword("");
                setConfirmPassword("");
                setCode("");
                setResendTimer(0);
                setVerifyingContact(null);
            } else {
                toast.error(data.error || "Reset failed");
            }
        } catch {
            toast.error("Network error. Try again.");
        } finally {
            setResetting(false);
        }
    }

    // ---------- FORM RENDER ----------
    const renderForm = (role: string, label: string, fieldName: string, placeholder: string) => (
        <form className="space-y-5" onSubmit={(e) => handleLogin(e, role)}>
            <Input
                name={fieldName}
                placeholder={placeholder}
                required
                disabled={!!loadingRole}
                className="h-11 rounded-xl border-green-100 bg-white/90 text-slate-700 placeholder:text-slate-400 focus-visible:ring-green-500/50"
            />

            <div className="relative">
                <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    className="h-11 rounded-xl border-green-100 bg-white/90 pr-12 text-slate-700 placeholder:text-slate-400 focus-visible:ring-green-500/50"
                    disabled={!!loadingRole}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!!loadingRole}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:bg-transparent"
                >
                    {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                    ) : (
                        <Eye className="h-5 w-5" />
                    )}
                </Button>
            </div>

            <Button
                type="submit"
                disabled={loadingRole === role}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 font-medium text-white shadow-md shadow-green-200 transition hover:bg-green-700"
            >
                {loadingRole === role ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Logging in...
                    </>
                ) : (
                    `Login as ${label}`
                )}
            </Button>

            {/* ✅ Forgot password opens modal */}
            <p className="mt-3 text-center text-sm">
                <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                                className="font-medium text-green-800 underline-offset-4 transition hover:underline"
                >
                    Forgot password?
                </button>
            </p>
        </form>
    );

    // ---------- RENDER ----------
    return (
        <div className="relative min-h-screen bg-gradient-to-br from-green-100 via-white to-green-200">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-green-300/40 blur-3xl" />
                <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-green-300/40 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-between gap-12 px-6 py-12 lg:flex-row lg:items-center lg:py-24">
                <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-lg lg:text-left">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm font-medium text-green-700 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Secure Access Portal
                    </span>
                    <h1 className="mt-6 text-3xl font-bold text-green-600 sm:text-4xl md:text-5xl">
                        Welcome back to HNU Clinic
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                        Sign in to manage appointments, review health records, and stay connected with the Holy
                        Name University Clinic team.
                    </p>

                    <dl className="mt-8 grid gap-4 text-left sm:grid-cols-2">
                        <div className="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur">
                            <dt className="text-sm font-medium text-green-700">Multi-role support</dt>
                            <dd className="mt-1 text-sm text-slate-600">
                                Access tailored dashboards for doctors, nurses, scholars, and patients.
                            </dd>
                        </div>
                        <div className="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur">
                            <dt className="text-sm font-medium text-green-700">Privacy first</dt>
                            <dd className="mt-1 text-sm text-slate-600">
                                Your information is protected with secure authentication measures.
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="mx-auto w-full max-w-md lg:mx-0">
                    <Card
                        className={`relative z-10 overflow-hidden border-0 bg-white/90 shadow-xl backdrop-blur-xl transition-opacity ${loadingRole ? "opacity-60" : ""}`}
                    >
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-400 via-lime-400 to-green-500" />
                        <CardContent className="p-8">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-green-900">Sign in</h2>
                                    <p className="text-sm text-slate-500">
                                        Use your assigned credentials to access the clinic portal.
                                    </p>
                                </div>
                                <div className="hidden sm:block">
                                    <Image src="/clinic-illustration.svg" alt="HNU Clinic" width={48} height={48} />
                                </div>
                            </div>

                            <Tabs defaultValue="doctor" className="w-full">
                                <TabsList className="flex flex-wrap w-full grid-cols-2 gap-2 rounded-xl bg-green-100/60 p-1 text-sm sm:grid-cols-4">
                                    <TabsTrigger
                                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700"
                                        value="doctor"
                                    >
                                        Doctor
                                    </TabsTrigger>
                                    <TabsTrigger
                                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700"
                                        value="nurse"
                                    >
                                        Nurse
                                    </TabsTrigger>
                                    <TabsTrigger
                                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700"
                                        value="scholar"
                                    >
                                        Scholar
                                    </TabsTrigger>
                                    <TabsTrigger
                                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-700"
                                        value="patient"
                                    >
                                        Patient
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="doctor" className="mt-6">
                                    {renderForm("doctor", "Doctor", "employee_id", "Employee ID")}
                                </TabsContent>
                                <TabsContent value="nurse" className="mt-6">
                                    {renderForm("nurse", "Nurse", "employee_id", "Employee ID")}
                                </TabsContent>
                                <TabsContent value="scholar" className="mt-6">
                                    {renderForm("scholar", "Scholar", "school_id", "Student ID")}
                                </TabsContent>
                                <TabsContent value="patient" className="mt-6">
                                    {renderForm("patient", "Patient", "patient_id", "Student ID or Employee ID")}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <p className="mt-6 text-center text-xs text-slate-500">
                        By logging in you agree to our confidentiality and privacy standards.
                    </p>
                </div>
            </div>

            <p className="relative pb-8 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} HNU Clinic Capstone Project. All rights reserved.
            </p>

            {/* 🔒 Forgot Password Modal */}
            <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-green-700">Reset Password</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            {tokenSent
                                ? `Enter the 6 digit code sent to your ${
                                      verifyingContact === "EMAIL" ? "email" : "mobile number"
                                  } and set your new password.`
                                : "Enter your registered email or phone number to receive a reset code."}
                        </DialogDescription>
                    </DialogHeader>

                    {!tokenSent ? (
                        <form onSubmit={handleSendCode} className="mt-2 space-y-4">
                            <Input
                                value={contact}
                                onChange={(e) => setContact(e.target.value)}
                                placeholder="Enter email or phone number"
                                required
                            />
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={verifying}
                                    className="w-full bg-green-600 text-white hover:bg-green-700"
                                >
                                    {verifying ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Send Reset Code"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} className="mt-2 space-y-4">
                            <Input
                                placeholder="Enter 6-digit code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ""))}
                                maxLength={6}
                                required
                            />
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:bg-transparent"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:bg-transparent"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                            <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                                <div className="flex w-full flex-col gap-2 sm:flex-row">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResend}
                                        disabled={resetting || verifying || resendTimer > 0}
                                        className="flex-1"
                                    >
                                        {verifying
                                            ? "Sending..."
                                            : resendTimer > 0
                                              ? `Resend in ${resendTimer}s`
                                              : "Resend Code"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setTokenSent(false);
                                            setContact("");
                                            setCode("");
                                            setNewPassword("");
                                            setConfirmPassword("");
                                            setResendTimer(0);
                                            setVerifyingContact(null);
                                        }}
                                        className="flex-1"
                                    >
                                        Use different contact
                                    </Button>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={resetting}
                                    className="w-full bg-green-600 text-white hover:bg-green-700"
                                >
                                    {resetting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Update Password"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
