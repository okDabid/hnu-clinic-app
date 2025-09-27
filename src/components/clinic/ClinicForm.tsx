"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Phone, MapPin, Building2 } from "lucide-react";

export function ClinicForm({ action }: { action: (fd: FormData) => void }) {
    return (
        <Card className="w-full shadow-xl rounded-2xl">
            <CardHeader className="border-b">
                <CardTitle className="text-2xl font-bold text-green-600">
                    Add Clinic Details
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
                <form action={action} className="space-y-6">
                    {/* Clinic Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-green-600" /> Clinic Name
                        </label>
                        <Input name="clinic_name" placeholder="e.g. College Clinic" required />
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-600" /> Location
                        </label>
                        <Input name="clinic_location" placeholder="e.g. Scanlon Building" required />
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-600" /> Contact Number
                        </label>
                        <Input
                            name="clinic_contactno"
                            placeholder="11-digit number"
                            maxLength={11}
                            pattern="\d{11}"
                            required
                        />
                        <p className="text-xs text-gray-500">Must be exactly 11 digits.</p>
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                        Add Clinic
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
