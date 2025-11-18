import type { Metadata } from "next";

import { NurseBootstrapPageClient } from "./page.client";

export const metadata: Metadata = {
    title: "Nurse Bootstrap",
};

export default function NurseBootstrapPage() {
    const bootstrapEnabled = process.env.BOOTSTRAP_NURSE === "true";
    return (
        <main className="min-h-screen bg-slate-50 py-10">
            <div className="mx-auto max-w-5xl px-4">
                <div className="mb-8 text-center">
                    <p className="text-sm uppercase tracking-wide text-slate-500">Maintenance utility</p>
                    <h1 className="text-3xl font-semibold text-slate-900">Create a temporary nurse account</h1>
                    <p className="mt-2 text-base text-slate-600">
                        Keep this page open only long enough to provision a replacement nurse, then remove the
                        <code className="mx-1 rounded bg-slate-200 px-1 py-0.5 text-xs font-mono">BOOTSTRAP_NURSE</code>
                        flag.
                    </p>
                </div>
                <NurseBootstrapPageClient enabled={bootstrapEnabled} />
            </div>
        </main>
    );
}
