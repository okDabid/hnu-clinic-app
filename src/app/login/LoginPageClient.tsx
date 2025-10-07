"use client";

import Image from "next/image";
import { useState } from "react";
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
    const router = useRouter();

    // ---------- LOGIN ----------
    async function handleLogin(e: React.FormEvent<HTMLFormElement>, role: string) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const payload: Record<string, string> = {
            role: role.toUpperCase(),
            password: formData.get("password") as string,
        };

        if (role === "doctor" || role === "nurse") payload.id = formData.get("employee_id") as string;
        else if (role === "scholar") payload.id = formData.get("school_id") as string;
        else if (role === "patient") payload.id = formData.get("patient_id") as string;

        try {
            setLoadingRole(role);
            const result = await signIn("credentials", { redirect: false, ...payload });
            if (result?.error) {
                toast.error(
                    result.error.includes("inactive")
                        ? "Your account is inactive. Please contact the administrator."
                        : result.error,
                    { position: "top-center" }
                );
            } else {
                toast.success("Successful login!", { position: "top-center" });
                if (payload.role === "NURSE") router.push("/nurse");
                else if (payload.role === "DOCTOR") router.push("/doctor");
                else if (payload.role === "SCHOLAR") router.push("/scholar");
                else if (payload.role === "PATIENT") router.push("/patient");
            }
        } catch (err: any) {
            toast.error(err?.message || "Something went wrong", { position: "top-center" });
        } finally {
            setLoadingRole(null);
        }
    }

    // ---------- FORGOT PASSWORD ----------
    async function handleSendCode(e: React.FormEvent) {
        e.preventDefault();
        setVerifying(true);
        try {
            const res = await fetch("/api/auth/request-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contact: contact.trim() }), // email or phone
            });
            const data = await res.json();
            setVerifying(false);
            if (res.ok) {
                toast.success("Verification code sent via Email/SMS!");
                setTokenSent(true);
            } else {
                toast.error(data.error || "Account not found");
            }
        } catch (error) {
            toast.error("Network error. Try again.");
            setVerifying(false);
        }
    }

    async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        setResetting(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contact: contact.trim(), newPassword }),
            });
            const data = await res.json();
            setResetting(false);
            if (res.ok) {
                toast.success("Password reset successful!");
                setForgotOpen(false);
                setTokenSent(false);
                setContact("");
                setNewPassword("");
            } else {
                toast.error(data.error || "Reset failed");
            }
        } catch (error) {
            toast.error("Network error. Try again.");
            setResetting(false);
        }
    }

    // ---------- FORM RENDER ----------
    const renderForm = (role: string, label: string, fieldName: string, placeholder: string) => (
        <form className="space-y-4" onSubmit={(e) => handleLogin(e, role)}>
            <Input name={fieldName} placeholder={placeholder} required disabled={!!loadingRole} />

            <div className="relative">
                <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    className="pr-10"
                    disabled={!!loadingRole}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!!loadingRole}
                    className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                >
                    {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                        <Eye className="h-5 w-5 text-gray-500" />
                    )}
                </Button>
            </div>

            <Button
                type="submit"
                disabled={loadingRole === role}
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
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
            <p className="text-sm text-center mt-3">
                <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-green-700 hover:underline"
                >
                    Forgot password?
                </button>
            </p>
        </form>
    );

    // ---------- RENDER ----------
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
            <div className="flex items-center gap-3 mb-8">
                <Image src="/clinic-illustration.svg" alt="logo" width={50} height={50} />
                <h1 className="text-2xl md:text-3xl font-bold text-green-600">
                    HNU Clinic Login
                </h1>
            </div>

            <Card
                className={`w-full max-w-md shadow-lg rounded-2xl transition-opacity ${loadingRole ? "opacity-50 pointer-events-none" : ""
                    }`}
            >
                <CardContent className="p-6">
                    <Tabs defaultValue="doctor" className="w-full">
                        <TabsList className="flex flex-wrap w-full mb-6 bg-muted p-1 rounded-lg gap-2">
                            <TabsTrigger value="doctor">Doctor</TabsTrigger>
                            <TabsTrigger value="nurse">Nurse</TabsTrigger>
                            <TabsTrigger value="scholar">Scholar</TabsTrigger>
                            <TabsTrigger value="patient">Patient</TabsTrigger>
                        </TabsList>

                        <TabsContent value="doctor">
                            {renderForm("doctor", "Doctor", "employee_id", "Employee ID")}
                        </TabsContent>
                        <TabsContent value="nurse">
                            {renderForm("nurse", "Nurse", "employee_id", "Employee ID")}
                        </TabsContent>
                        <TabsContent value="scholar">
                            {renderForm("scholar", "Scholar", "school_id", "Student ID")}
                        </TabsContent>
                        <TabsContent value="patient">
                            {renderForm("patient", "Patient", "patient_id", "Student ID or Employee ID")}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <p className="text-gray-600 text-sm mt-6 text-center">
                © {new Date().getFullYear()} HNU Clinic Capstone Project
            </p>

            {/* 🔒 Forgot Password Modal */}
            <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-green-700">Reset Password</DialogTitle>
                    </DialogHeader>

                    {!tokenSent ? (
                        <form onSubmit={handleSendCode} className="space-y-4 mt-2">
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
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
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
                        <form onSubmit={handleReset} className="space-y-4 mt-2">
                            <Input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={resetting}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
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
