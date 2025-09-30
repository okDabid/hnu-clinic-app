"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const [loadingRole, setLoadingRole] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    // ✅ Show logout toast when redirected back with query param
    useEffect(() => {
        const logoutParam = searchParams.get("logout");
        if (logoutParam === "success") {
            toast.success("You have been logged out successfully.", {
                position: "top-center",
                duration: 4000,
            });

            // ✅ only remove after showing
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("logout");
            router.replace(newUrl.toString());
        }
    }, [searchParams, router]);

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
                toast.error(result.error, { position: "top-center" });
            } else {
                toast.success(`Welcome!`, { position: "top-center" });

                // Redirect based on role
                if (payload.role === "NURSE") window.location.href = "/nurse";
                else if (payload.role === "DOCTOR") window.location.href = "/doctor/dashboard";
                else if (payload.role === "SCHOLAR") window.location.href = "/scholar/dashboard";
                else if (payload.role === "PATIENT") window.location.href = "/patient";
                else window.location.href = "/login";
            }
        } catch (err: any) {
            toast.error(err.message || "Something went wrong", { position: "top-center" });
        } finally {
            setLoadingRole(null);
        }
    }

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

                        {/* Doctor */}
                        <TabsContent value="doctor">
                            <form className="space-y-4" onSubmit={(e) => handleLogin(e, "doctor")}>
                                <Input name="employee_id" placeholder="Employee ID" required />
                                <Input name="password" type="password" placeholder="Password" required />
                                <Button
                                    type="submit"
                                    disabled={loadingRole === "doctor"}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    {loadingRole === "doctor" ? "Logging in..." : "Login as Doctor"}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Nurse */}
                        <TabsContent value="nurse">
                            <form className="space-y-4" onSubmit={(e) => handleLogin(e, "nurse")}>
                                <Input name="employee_id" placeholder="Employee ID" required />
                                <Input name="password" type="password" placeholder="Password" required />
                                <Button
                                    type="submit"
                                    disabled={loadingRole === "nurse"}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    {loadingRole === "nurse" ? "Logging in..." : "Login as Nurse"}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Scholar */}
                        <TabsContent value="scholar">
                            <form className="space-y-4" onSubmit={(e) => handleLogin(e, "scholar")}>
                                <Input name="school_id" placeholder="School ID" required />
                                <Input name="password" type="password" placeholder="Password" required />
                                <Button
                                    type="submit"
                                    disabled={loadingRole === "scholar"}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    {loadingRole === "scholar" ? "Logging in..." : "Login as Scholar"}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Patient */}
                        <TabsContent value="patient">
                            <form className="space-y-4" onSubmit={(e) => handleLogin(e, "patient")}>
                                <Input name="patient_id" placeholder="Student ID or Employee ID" required />
                                <Input name="password" type="password" placeholder="Password" required />
                                <Button
                                    type="submit"
                                    disabled={loadingRole === "patient"}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    {loadingRole === "patient" ? "Logging in..." : "Login as Patient"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <p className="text-gray-600 text-sm mt-6">
                © {new Date().getFullYear()} HNU Clinic Capstone Project
            </p>
        </div>
    );
}
