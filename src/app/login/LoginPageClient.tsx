"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPageClient() {
    const [loadingRole, setLoadingRole] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin(e: React.FormEvent<HTMLFormElement>, role: string) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const payload: Record<string, string> = {
            role: role.toUpperCase(),
            password: formData.get("password") as string,
        };

        if (role === "doctor" || role === "nurse") {
            payload.id = formData.get("employee_id") as string;
        } else if (role === "scholar") {
            payload.id = formData.get("school_id") as string;
        } else if (role === "patient") {
            payload.id = formData.get("patient_id") as string;
        }

        try {
            setLoadingRole(role);

            const result = await signIn("credentials", {
                redirect: false,
                ...payload,
            });

            if (result?.error) {
                // 🎯 Show custom message if inactive
                if (result.error.includes("inactive")) {
                    toast.error(
                        "Your account is inactive. Please contact the administrator.",
                        { position: "top-center" }
                    );
                } else {
                    toast.error(result.error, { position: "top-center" });
                }
            } else {
                toast.success(`Welcome!`, { position: "top-center" });

                // Redirect based on role
                if (payload.role === "NURSE") window.location.href = "/nurse";
                else if (payload.role === "DOCTOR") window.location.href = "/doctor/dashboard";
                else if (payload.role === "SCHOLAR") window.location.href = "/scholar/dashboard";
                else if (payload.role === "PATIENT") window.location.href = "/patient";
                else window.location.href = "/login";
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                toast.error(err.message, { position: "top-center" });
            } else {
                toast.error("Something went wrong", { position: "top-center" });
            }
        } finally {
            setLoadingRole(null);
        }
    }

    const renderForm = (role: string, label: string, fieldName: string, placeholder: string) => (
        <form className="space-y-4" onSubmit={(e) => handleLogin(e, role)}>
            {/* ID Field */}
            <Input name={fieldName} placeholder={placeholder} required />

            {/* Password Field with Toggle */}
            <div className="relative">
                <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    className="pr-10"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-transparent"
                >
                    {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                        <Eye className="h-5 w-5 text-gray-500" />
                    )}
                </Button>
            </div>

            {/* Submit */}
            <Button
                type="submit"
                disabled={loadingRole === role}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
                {loadingRole === role ? `Logging in...` : `Login as ${label}`}
            </Button>
        </form>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-6">
            {/* Logo + Title */}
            <div className="flex items-center gap-3 mb-8">
                <Image src="/clinic-illustration.svg" alt="logo" width={50} height={50} />
                <h1 className="text-2xl md:text-3xl font-bold text-green-600">
                    HNU Clinic Login
                </h1>
            </div>

            {/* Login Card */}
            <Card className="w-full max-w-md shadow-lg rounded-2xl">
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
                            {renderForm("scholar", "Scholar", "school_id", "School ID")}
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
        </div>
    );
}
