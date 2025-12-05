"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import PatientLayout from "@/components/patient/patient-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatManilaDateTime } from "@/lib/time";

type CertificatePayload = {
    certificateId: string;
    status: string;
    issueDate: string;
    validUntil: string;
    appointmentId: string | null;
    consultationId: string | null;
    clinicName: string;
    doctorName: string;
    consultationDate: string;
};

function formatDateOnly(value?: string | null) {
    if (!value) return "—";
    return (
        formatManilaDateTime(value, {
            hour: undefined,
            minute: undefined,
        }) ?? "—"
    );
}

export default function PatientMedicalCertificatePage() {
    const [loading, setLoading] = useState(true);
    const [certificate, setCertificate] = useState<CertificatePayload | null>(null);
    const [error, setError] = useState<string | null>(null);

    const statusBadge = useMemo(() => {
        if (!certificate) return null;
        const isValid = certificate.status === "Valid";
        const classes = isValid
            ? "border-emerald-200 bg-primary/10 text-primary"
            : "border-slate-200 bg-slate-100 text-slate-600";

        return (
            <Badge variant="outline" className={`rounded-full px-3 py-1 text-[11px] ${classes}`}>
                {certificate.status}
            </Badge>
        );
    }, [certificate]);

    useEffect(() => {
        async function loadCertificate() {
            try {
                const res = await fetch("/api/patient/medical-certificate", { cache: "no-store" });
                if (!res.ok) {
                    throw new Error("Failed to load certificate");
                }
                const data = await res.json();
                setCertificate(data.certificate ?? null);
            } catch (err) {
                console.error(err);
                setError("We couldn't load your medical certificate status right now.");
            } finally {
                setLoading(false);
            }
        }

        loadCertificate();
    }, []);

    const hasCertificate = Boolean(certificate);

    return (
        <PatientLayout
            title="Medical certificate"
            description="View the status of your latest medical certificate issued by the clinic."
        >
            <div className="mx-auto w-full max-w-5xl space-y-8">
                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl text-primary">
                            <CheckCircle2 className="h-5 w-5" />
                            Certificate status
                        </CardTitle>
                        <CardDescription>
                            Certificates stay valid for one year from the date of issuance unless otherwise noted by the clinic.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Checking for your certificate...
                            </div>
                        ) : error ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber/10 p-4 text-sm text-amber-800">
                                <AlertCircle className="h-5 w-5" />
                                <div>
                                    <p className="font-medium">Something went wrong</p>
                                    <p>{error}</p>
                                </div>
                            </div>
                        ) : hasCertificate ? (
                            <div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-primary">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold">Certificate ID</p>
                                        <p className="font-mono text-lg">{certificate?.certificateId}</p>
                                    </div>
                                    {statusBadge}
                                </div>

                                <Separator />

                                <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-primary/70">Issued on</p>
                                        <p className="font-semibold">{formatDateOnly(certificate?.issueDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-primary/70">Valid until</p>
                                        <p className="font-semibold">{formatDateOnly(certificate?.validUntil)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-primary/70">Doctor</p>
                                        <p className="font-semibold">{certificate?.doctorName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-primary/70">Clinic</p>
                                        <p className="font-semibold">{certificate?.clinicName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-primary/70">Consultation date</p>
                                        <p className="font-semibold">{formatDateOnly(certificate?.consultationDate)}</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-primary/80">
                                    For a printed or digital copy, please contact the clinic staff so they can provide the
                                    appropriate document.
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                                <AlertCircle className="h-5 w-5" />
                                <div>
                                    <p className="font-semibold">No certificate on file</p>
                                    <p>Your doctor will issue a certificate after completing your consultation.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-primary/20 bg-white/80 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-primary">How validity works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>Your medical certificate stays valid for one year unless marked expired by the clinic.</p>
                        <p>
                            If your certificate has expired, schedule a follow-up appointment with a physician so they can
                            review your records and issue a new one.
                        </p>
                        <p>
                            Keep your account details updated so the clinic can include accurate information in your documents.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}

