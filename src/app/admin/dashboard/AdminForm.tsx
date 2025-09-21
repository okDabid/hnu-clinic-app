"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createUser } from "../../actions";

export default function AdminForm() {
    const [role, setRole] = useState("");

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            <form
                action={async (formData: FormData) => {
                    const res = await createUser(formData);
                    if (res?.error) {
                        toast.error(res.error);
                    } else {
                        toast.success(
                            `✅ User created!\nUsername: ${res.username}\nPassword: ${res.password}`
                        );
                    }
                }}
                className="space-y-4"
            >
                {/* Role selector */}
                <div className="flex flex-col">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole} name="role" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Faculty">Faculty</SelectItem>
                            <SelectItem value="Nurse">Nurse</SelectItem>
                            <SelectItem value="Doctor">Doctor</SelectItem>
                            <SelectItem value="Working Scholar">Working Scholar</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Conditional fields */}
                {(role === "Student" || role === "Working Scholar") && (
                    <div className="flex flex-col">
                        <Label htmlFor="student_id">Student ID</Label>
                        <Input name="student_id" />
                    </div>
                )}

                {/* Faculty, Nurse, Doctor share Employee table */}
                {(role === "Faculty" || role === "Nurse" || role === "Doctor") && (
                    <div className="flex flex-col">
                        <Label htmlFor="employee_id">Employee ID</Label>
                        <Input name="employee_id" />
                    </div>
                )}

                {/* Name fields */}
                <div className="flex flex-col">
                    <Label htmlFor="fname">First Name</Label>
                    <Input name="fname" />
                </div>

                <div className="flex flex-col">
                    <Label htmlFor="mname">Middle Name</Label>
                    <Input name="mname" />
                </div>

                <div className="flex flex-col">
                    <Label htmlFor="lname">Last Name</Label>
                    <Input name="lname" />
                </div>

                {/* Simple Date Input */}
                <div className="flex flex-col">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input type="date" name="date_of_birth" />
                </div>

                {/* Gender */}
                <div className="flex flex-col">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender">
                        <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Submit button */}
                <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    Create User
                </Button>
            </form>
        </div>

    );
}
