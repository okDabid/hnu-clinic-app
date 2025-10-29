import Link from "next/link";

export const metadata = {
    title: "Privacy Policy | HNU Clinic",
    description: "Learn how the HNU Clinic app collects, uses, and protects information across sign-in and care workflows.",
};

export default function PrivacyPage() {
    return (
        <div className="bg-white">
            <section className="bg-linear-to-b from-green-50 via-white to-green-50 px-6 py-16 md:px-12 md:py-24">
                <div className="mx-auto max-w-4xl space-y-12">
                    <div className="space-y-4 text-center md:text-left">
                        <span className="inline-flex items-center rounded-full border border-green-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                            HNU Clinic Privacy Statement
                        </span>
                        <h1 className="text-3xl font-bold text-green-700 md:text-4xl">Privacy Policy</h1>
                        <p className="text-base leading-relaxed text-gray-700 md:text-lg">
                            This policy explains how the HNU Clinic capstone application collects, uses, and protects information when you visit <Link href="https://hnu-clinic-app.vercel.app/" className="font-semibold text-green-700 underline underline-offset-2">hnu-clinic-app.vercel.app</Link> and use the connected scheduling and notification tools.
                        </p>
                    </div>

                    <div className="space-y-10 text-sm leading-relaxed text-gray-700 md:text-base">
                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-green-700">Information we collect</h2>
                            <ul className="list-disc space-y-2 pl-6">
                                <li>
                                    <span className="font-medium text-green-700">Google sign-in details:</span> your name, primary Google email address, and profile photo are provided by Google when you choose “Continue with Google.”
                                </li>
                                <li>
                                    <span className="font-medium text-green-700">Account and health records:</span> clinic staff may add or update demographic profiles, appointment bookings, consultation notes, prescriptions, and medical certificates required for campus care.
                                </li>
                                <li>
                                    <span className="font-medium text-green-700">Support messages:</span> inquiries submitted through the website contact form include your name, email, and message so the clinic can reply. These details are emailed to the clinic inbox and are not stored in the app database.
                                </li>
                                <li>
                                    <span className="font-medium text-green-700">System logs:</span> the platform records basic audit events (such as appointment updates and notification deliveries) to help administrators troubleshoot issues.
                                </li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-green-700">How we use your information</h2>
                            <ul className="list-disc space-y-2 pl-6">
                                <li>Verify you belong to the Holy Name University community and let you access the clinic portal without creating a new password.</li>
                                <li>Match you with the correct patient or employee record so staff can schedule visits, document care, and manage medicine inventory.</li>
                                <li>Send transactional emails, including appointment updates, doctor notifications, and password reset links, via the Gmail API.</li>
                                <li>Respond to questions you submit through the contact form or support email address.</li>
                            </ul>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-green-700">Sharing and third parties</h2>
                            <p>
                                We do not sell your information or share it with advertisers. Google provides authentication and email delivery services to the app. Email content is transmitted through Google’s Gmail API based on the clinic’s account configuration.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-green-700">Data retention and control</h2>
                            <p>
                                Health records managed inside the application follow Holy Name University clinic retention guidelines. You may request corrections or deactivation of your portal access by contacting the clinic support desk at <Link href="mailto:clinic-support@hnu.edu" className="font-medium text-green-700 underline underline-offset-2">clinic-support@hnu.edu</Link>.
                            </p>
                            <p>
                                To disconnect Google access, revoke the HNU Clinic app from your Google account permissions and notify clinic staff so they can complete the removal in the portal.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-green-700">Security practices</h2>
                            <p>
                                The application encrypts information in transit and at rest. Role-based permissions ensure only authorized clinic personnel can view or update sensitive records, and key actions are logged for auditing.
                            </p>
                            <p>
                                Hosting is currently provided through Vercel at <Link href="https://hnu-clinic-app.vercel.app/" className="font-medium text-green-700 underline underline-offset-2">hnu-clinic-app.vercel.app</Link>. Access is limited to the HNU Clinic team responsible for this capstone project.
                            </p>
                        </section>

                        <section className="space-y-3">
                            <h2 className="text-xl font-semibold text-green-700">Contact us</h2>
                            <p>
                                Questions about this policy or your data can be directed to <Link href="mailto:clinic-support@hnu.edu" className="font-medium text-green-700 underline underline-offset-2">clinic-support@hnu.edu</Link>. You may also reach the clinic office at Holy Name University Main Campus during regular operating hours.
                            </p>
                        </section>
                    </div>

                    <p className="text-xs text-gray-500">
                        Effective date: {new Date().getFullYear()}.
                    </p>
                </div>
            </section>
        </div>
    );
}
