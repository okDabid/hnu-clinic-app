"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Stethoscope,
    UserRound,
    GraduationCap,
    UserCircle2,
    User,
    Lock,
    Eye,
    EyeOff,
} from "lucide-react";

export default function LoginPage() {
    const { role } = useParams();
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [idNumber, setIdNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Role configs for UI (purely for labels/icons)
    const roleConfig: Record<
        string,
        { label: string; icon: React.ElementType }
    > = {
        doctor: { label: "Doctor Login", icon: Stethoscope },
        nurse: { label: "Nurse Login", icon: UserRound },
        scholar: { label: "Working Scholar Login", icon: GraduationCap },
        patient: { label: "Patient Login", icon: UserCircle2 },
    };

    const config = roleConfig[role as string] || {
        label: "User Login",
        icon: UserCircle2,
    };
    const Icon = config.icon;

    // 🔑 Real login handler
    const handleLogin = async () => {
        setError("");

        if (!idNumber || !password) {
            setError("Please enter your ID number and password.");
            return;
        }

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idNumber, password, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                return;
            }

            // Save JWT in localStorage (for now)
            localStorage.setItem("token", data.token);

            // Redirect returned from API
            router.push(data.redirect);
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
            {/* System Title */}
            <h1 className="mb-8 text-2xl md:text-3xl font-bold text-green-700 text-center">
                HNU Clinic Health Record and Appointment System
            </h1>

            {/* Login Card */}
            <Card className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border border-green-100 bg-white">
                {/* Header */}
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white text-center py-4">
                    <div className="flex flex-col items-center gap-1">
                        <div className="p-3 bg-white rounded-full shadow-md">
                            <Icon className="h-7 w-7 text-green-600" />
                        </div>
                        <CardTitle className="text-base font-semibold">
                            {config.label}
                        </CardTitle>
                    </div>
                </CardHeader>

                {/* Form */}
                <CardContent className="bg-white dark:bg-gray-800 p-8 space-y-6">
                    {/* Error */}
                    {error && (
                        <p className="text-red-600 text-sm text-center">{error}</p>
                    )}

                    {/* ID Number */}
                    <div className="space-y-2 text-left">
                        <Label htmlFor="id">ID Number</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                id="id"
                                type="text"
                                placeholder="ID number"
                                value={idNumber}
                                onChange={(e) => setIdNumber(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2 text-left">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                        <Link
                            href="#"
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Forgot Password?
                        </Link>
                        <Button
                            onClick={handleLogin}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 transition-all"
                        >
                            Sign In
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
