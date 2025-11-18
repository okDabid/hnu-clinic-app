"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";

interface BootstrapResponse {
    username: string;
    password: string;
}

interface NurseBootstrapPageClientProps {
    enabled: boolean;
}

export function NurseBootstrapPageClient({ enabled }: NurseBootstrapPageClientProps) {
    const [formValues, setFormValues] = useState({
        employeeId: "",
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
    });
    const [result, setResult] = useState<BootstrapResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit =
        enabled &&
        Boolean(formValues.employeeId.trim()) &&
        Boolean(formValues.firstName.trim()) &&
        Boolean(formValues.lastName.trim());

    function handleChange(field: keyof typeof formValues) {
        return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const value = event.target.value;
            setFormValues((prev) => ({ ...prev, [field]: value }));
        };
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!enabled || !canSubmit || isSubmitting) return;

        setError(null);
        setResult(null);
        setIsSubmitting(true);

        try {
            const payload = {
                employee_id: formValues.employeeId.trim(),
                fname: formValues.firstName.trim(),
                mname: formValues.middleName.trim() || undefined,
                lname: formValues.lastName.trim(),
                email: formValues.email.trim() || undefined,
                contactno: formValues.phone.trim() || undefined,
                address: formValues.address.trim() || undefined,
            };

            const response = await fetch("/api/bootstrap/nurse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || "Failed to create a nurse account.");
            }

            const data = (await response.json()) as BootstrapResponse;
            setResult(data);
            setFormValues({
                employeeId: "",
                firstName: "",
                middleName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create the account.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto w-full max-w-3xl space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bootstrap a replacement nurse</CardTitle>
                    <CardDescription>
                        {enabled ? (
                            <>
                                Use this page only while <code>BOOTSTRAP_NURSE</code> is set to <code>true</code>. Remove the flag
                                and redeploy immediately after creating an account.
                            </>
                        ) : (
                            <>
                                Set <code>BOOTSTRAP_NURSE=true</code> in your environment variables and redeploy to enable this
                                emergency workflow. The form stays disabled while the flag is off.
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="employee-id">Employee ID *</Label>
                                <Input
                                    id="employee-id"
                                    placeholder="e.g. NURSE-001"
                                    value={formValues.employeeId}
                                    onChange={handleChange("employeeId")}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="clinic@example.com"
                                    value={formValues.email}
                                    onChange={handleChange("email")}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="first-name">First name *</Label>
                                <Input
                                    id="first-name"
                                    value={formValues.firstName}
                                    onChange={handleChange("firstName")}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="middle-name">Middle name</Label>
                                <Input id="middle-name" value={formValues.middleName} onChange={handleChange("middleName")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name">Last name *</Label>
                                <Input id="last-name" value={formValues.lastName} onChange={handleChange("lastName")} required />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone number</Label>
                                <Input id="phone" value={formValues.phone} onChange={handleChange("phone")} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    className="min-h-[80px]"
                                    value={formValues.address}
                                    onChange={handleChange("address")}
                                />
                            </div>
                        </div>

                        {enabled ? (
                            <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
                                <div>
                                    <p className="font-semibold">Security reminder</p>
                                    <p className="text-sm text-amber-800">
                                        This page skips the nurse role guard. Disable the flag as soon as the credentials are saved.
                                    </p>
                                </div>
                                <ShieldAlert className="h-8 w-8 shrink-0" />
                            </div>
                        ) : (
                            <Alert>
                                <AlertTitle>Bootstrap disabled</AlertTitle>
                                <AlertDescription>
                                    Turn on the <code>BOOTSTRAP_NURSE</code> flag and redeploy to activate the emergency bootstrap
                                    workflow.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Button className="w-full" type="submit" disabled={!canSubmit || isSubmitting}>
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Creating account
                                </span>
                            ) : (
                                "Create nurse account"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>New nurse credentials</AlertTitle>
                    <AlertDescription>
                        <p className="text-sm">Share the temporary credentials securely, then force a password change.</p>
                        <div className="mt-3 space-y-1 rounded-md bg-white/80 p-3 text-sm font-mono text-slate-900">
                            <p>
                                Username: <span className="font-semibold">{result.username}</span>
                            </p>
                            <p>
                                Password: <span className="font-semibold">{result.password}</span>
                            </p>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Bootstrap failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
