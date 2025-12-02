import Link from "next/link";

import { SiteHeader } from "@/components/marketing/site-header";

const navigation = [
    { href: "/#features", label: "Features" },
    { href: "/#workflow", label: "Workflow" },
    { href: "/about", label: "About" },
    { href: "/learn-more", label: "Learn More" },
    { href: "/privacy", label: "Privacy" },
    { href: "/#contact", label: "Contact" },
];

export const metadata = {
    title: "Privacy Policy | HNU Clinic",
    description: "Learn how the HNU Clinic app collects, uses, and protects information across sign-in and care workflows.",
};

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <SiteHeader navigation={navigation} />

            <main className="flex-1">
                <section className="bg-linear-to-b from-green-50 via-white to-green-50 px-6 py-16 md:px-12 md:py-24">
                    <div className="mx-auto max-w-4xl space-y-12">
                        <div className="space-y-4 text-center md:text-left">
                            <span className="inline-flex items-center rounded-full border border-green-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                                HNU Clinic Privacy Statement
                            </span>
                            <h1 className="text-3xl font-bold text-green-700 md:text-4xl">Privacy Policy</h1>
                            <p className="text-base leading-relaxed text-gray-700 md:text-lg">
                                This policy explains how the HNU Clinic capstone application collects, uses, and protects information when you visit <Link href="https://www.hnu-clinic-app.com/" className="font-semibold text-green-700 underline underline-offset-2">www.hnu-clinic-app.com</Link>, request an account, and use the scheduling, records, and notification features offered to the Holy Name University community.
                            </p>
                        </div>

                        <div className="space-y-10 text-sm leading-relaxed text-gray-700 md:text-base">
                            <section className="space-y-3">
                                <h2 className="text-xl font-semibold text-green-700">Information we collect</h2>
                                <ul className="list-disc space-y-2 pl-6">
                                    <li>
                                        <span className="font-medium text-green-700">Account request details:</span> when you ask for clinic portal access through the homepage contact form, you provide your Holy Name University student or employee status, school or employee ID, date of birth, gender, and a campus email address where the nurse can send the credentials.
                                    </li>
                                    <li>
                                        <span className="font-medium text-green-700">Account and health records:</span> clinic staff may add or update demographic profiles, appointment bookings, consultation notes, medical certificates, and other campus clinic documentation tied to your profile.
                                    </li>
                                    <li>
                                        <span className="font-medium text-green-700">Support and inquiry messages:</span> inquiries submitted through the contact form or support email include your name, email, and message so the clinic can reply. These details are emailed to the clinic inbox and are not stored in the app database.
                                    </li>
                                </ul>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-semibold text-green-700">How we use your information</h2>
                                <ul className="list-disc space-y-2 pl-6">
                                    <li>Confirm you are a Holy Name University student or employee before a nurse creates your clinic account and issues a temporary password.</li>
                                    <li>Match you with the correct patient or employee record so staff can schedule visits, document care, manage medicine inventory, and prepare medical certificates.</li>
                                    <li>Send transactional emails—appointment requests, approvals, reschedules, cancellations, completion summaries, and password reset codes—through the Gmail API so patients and clinicians stay informed.</li>
                                    <li>Respond to questions you submit through the contact form or support email address and document follow-up for clinic staff.</li>
                                </ul>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-semibold text-green-700">Requesting portal access</h2>
                                <p>
                                    Clinic accounts are provisioned by the nursing team. Eligible users can request access through the homepage contact form by sharing their full name, campus role, Holy Name University school or employee ID, gender, and date of birth. The nurse reviews each request and, once approved, sends the username (matching the provided ID) and a temporary password to the institutional email address on file. You must change that password after your first sign-in.
                                </p>
                                <p>
                                    If you later add a personal email to your profile, the system will send a verification link to confirm ownership before notifications are delivered to that address.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-semibold text-green-700">Sharing and third parties</h2>
                                <p>
                                    We do not sell your information or share it with advertisers. Email notifications are sent through the clinic’s managed Gmail account and are limited to transactional messages about appointments and password resets.
                                </p>
                                <p>
                                    The application is hosted on Vercel, and supporting services such as database hosting are administered by the HNU Clinic capstone team. No marketing or analytics platforms ingest your health information.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-semibold text-green-700">Data retention and control</h2>
                                <p>
                                    Health records managed inside the application follow Holy Name University clinic retention guidelines. You may request corrections or deactivation of your portal access by contacting the clinic support desk at <Link href="mailto:hnucliniccapstone@gmail.com" className="font-medium text-green-700 underline underline-offset-2">hnucliniccapstone@gmail.com</Link>.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-semibold text-green-700">Security practices</h2>
                                <p>
                                    The application encrypts information in transit and at rest. Role-based permissions ensure only authorized clinic personnel can view or update sensitive records, and key actions are logged for auditing.
                                </p>
                                <p>
                                    Hosting is currently provided through Vercel at <Link href="https://www.hnu-clinic-app.com/" className="font-medium text-green-700 underline underline-offset-2">www.hnu-clinic-app.com</Link>. Access is limited to the HNU Clinic team responsible for this capstone project.
                                </p>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-xl font-semibold text-green-700">Contact us</h2>
                                <p>
                                    Questions about this policy or your data can be directed to <Link href="mailto:hnucliniccapstone@gmail.com" className="font-medium text-green-700 underline underline-offset-2">hnucliniccapstone@gmail.com</Link>. You may also reach the clinic office at Holy Name University Main Campus during regular operating hours.
                                </p>
                            </section>
                        </div>

                        <p className="text-xs text-gray-500">
                            Effective date: {new Date().getFullYear()}.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
