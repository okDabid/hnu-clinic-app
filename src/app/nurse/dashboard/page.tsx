"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    UserCog,
    Calendar,
    FileText,
    Pill,
    ClipboardList,
    Package,
    BarChart3,
    Activity,
} from "lucide-react";

export default function NurseDashboard() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-8 text-center">
                School Nurse Dashboard
            </h1>

            {/* Grid of Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Manage Accounts */}
                <Link href="/admin/dashboard">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <Users className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Manage Accounts</CardTitle>
                            <CardDescription>
                                Create, edit, activate, or deactivate user accounts.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Update Own Profile */}
                <Link href="/admin/profile">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <UserCog className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>My Account</CardTitle>
                            <CardDescription>
                                Edit or update your own account information.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Doctor Availability & Appointments */}
                <Link href="/admin/appointments">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <Calendar className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Appointments</CardTitle>
                            <CardDescription>
                                View doctor availability and all scheduled appointments.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Patient Records */}
                <Link href="/admin/patients">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <FileText className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Patient Records</CardTitle>
                            <CardDescription>
                                Search, view, and update patient health records.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Dispense Medicines */}
                <Link href="/admin/medicines/dispense">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <Pill className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Dispense Medicines</CardTitle>
                            <CardDescription>
                                Record medicine dispenses during consultations.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Inventory Management */}
                <Link href="/admin/inventory">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <ClipboardList className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Inventory</CardTitle>
                            <CardDescription>
                                Monitor and maintain medicine stock with expiry tracking.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Add Stocks */}
                <Link href="/admin/inventory/add">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <Package className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Add Stocks</CardTitle>
                            <CardDescription>
                                Record replenishments with expiry monitoring (FIFO).
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Reports */}
                <Link href="/admin/reports">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Reports</CardTitle>
                            <CardDescription>
                                Generate inventory and quarterly clinic reports.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Operations */}
                <Link href="/admin/overview">
                    <Card className="hover:shadow-lg transition">
                        <CardHeader>
                            <Activity className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Clinic Operations</CardTitle>
                            <CardDescription>
                                Oversee and manage all clinic operations within the system.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>

            {/* Back to Admin Button */}
            <div className="mt-12 text-center">
                <Link href="/admin/dashboard">
                    <Button className="bg-green-600 hover:bg-green-700 px-8">
                        Go to Admin Dashboard
                    </Button>
                </Link>
            </div>
        </main>
    );
}
