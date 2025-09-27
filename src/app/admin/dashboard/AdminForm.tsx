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
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";

// Spinner icon
import { Loader2 } from "lucide-react";

export default function AdminForm() {
    // form state
    const [role, setRole] = useState("");
    const [gender, setGender] = useState("");
    const [department, setDepartment] = useState("");
    const [program, setProgram] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [yearLevel, setYearLevel] = useState("");

    // loading state
    const [isLoading, setIsLoading] = useState(false);

    // Department -> Programs
    const programsByDepartment: Record<string, string[]> = {
        "College of Education": [
            "Bachelor of Elementary Education (BEEd)",
            "Bachelor of Technology and Livelihood Education (BTLEd)",
            "Bachelor of Physical Education (BPEd)",
            "Bachelor of Culture and Arts Education (BCAEd)",
            "Bachelor of Special Needs Education (BSNEd)",
            "Bachelor of Secondary Education (BSEd)", // specialization dropdown
        ],
        "College of Arts and Sciences": [
            "Bachelor of Science in Biology",
            "Bachelor of Arts in Communication",
            "Bachelor of Arts in Political Science",
            "Bachelor of Science in Psychology",
            "Bachelor of Science in Criminology",
        ],
        "College of Business and Accountancy": [
            "Bachelor of Science in Accountancy (BSA)",
            "Bachelor of Science in Management Accounting (BSMA)",
            "Bachelor of Science in Business Administration (BSBA)", // specialization dropdown
            "Bachelor of Science in Hospitality Management (BSHM)",
            "Bachelor of Science in Tourism Management (BSTM)",
        ],
        "College of Health Sciences": [
            "Bachelor of Science in Nursing",
            "Bachelor of Science in Medical Technology",
            "Bachelor of Science in Radiologic Technology",
        ],
        "College of Engineering and Computer Studies": [
            "Bachelor of Science in Civil Engineering",
            "Bachelor of Science in Computer Engineering",
            "Bachelor of Science in Electronics Engineering",
            "Bachelor of Science in Computer Science",
            "Bachelor of Science in Information Technology",
        ],
        "College of Law": ["Juris Doctor (Non-Thesis Programme)"],
    };

    const bsEdSpecializations = [
        "English",
        "Filipino",
        "Mathematics",
        "Science",
        "Social Studies",
    ];

    const bsbaSpecializations = [
        "Financial Management",
        "Marketing Management",
        "Human Resource Management",
    ];

    const isStudent = role === "Student" || role === "Working Scholar";
    const isIBED = department === "Integrated Basic Education Department";

    return (
        <Card className="w-full max-w-3xl shadow-xl">
            <CardHeader className="border-b pb-4">
                <CardTitle className="text-2xl font-bold text-green-600">
                    Create New User
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
                <form
                    action={async (formData: FormData) => {
                        try {
                            setIsLoading(true);
                            const res = await createUser(formData);
                            if (res?.error) {
                                toast.error(res.error);
                            } else {
                                toast.success(
                                    `✅ User created!\nUsername: ${res.username}\nPassword: ${res.password}`
                                );
                            }
                        } catch (error) {
                            toast.error("Something went wrong. Please try again.");
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    className="space-y-6"
                >
                    {/* Role */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={role}
                            onValueChange={(val) => {
                                setRole(val);
                                setDepartment("");
                                setProgram("");
                                setSpecialization("");
                                setYearLevel("");
                            }}
                        >
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
                        <input type="hidden" name="role" value={role} required />
                    </div>

                    {/* Student-only fields */}
                    {isStudent && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="student_id">Student ID</Label>
                                <Input name="student_id" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select
                                    value={department}
                                    onValueChange={(val) => {
                                        setDepartment(val);
                                        setProgram("");
                                        setSpecialization("");
                                        setYearLevel("");
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(programsByDepartment).map((dep) => (
                                            <SelectItem key={dep} value={dep}>
                                                {dep}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="Integrated Basic Education Department">
                                            Integrated Basic Education Department
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="department" value={department} required />
                            </div>

                            {/* Program (hidden for IBED) */}
                            {!isIBED && department && (
                                <div className="space-y-2">
                                    <Label htmlFor="program">Program</Label>
                                    {programsByDepartment[department] ? (
                                        <>
                                            <Select
                                                value={program}
                                                onValueChange={(val) => {
                                                    setProgram(val);
                                                    setSpecialization("");
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select program" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {programsByDepartment[department].map((p) => (
                                                        <SelectItem key={p} value={p}>
                                                            {p}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="program" value={program} required />
                                        </>
                                    ) : (
                                        <>
                                            <Input
                                                name="program_fallback_visible"
                                                placeholder="Enter program"
                                                value={program}
                                                onChange={(e) => setProgram(e.target.value)}
                                            />
                                            <input type="hidden" name="program" value={program} required />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* BSEd specialization */}
                            {program === "Bachelor of Secondary Education (BSEd)" && (
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Select
                                        value={specialization}
                                        onValueChange={setSpecialization}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select specialization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bsEdSpecializations.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="specialization" value={specialization} required />
                                </div>
                            )}

                            {/* BSBA specialization */}
                            {program === "Bachelor of Science in Business Administration (BSBA)" && (
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Select
                                        value={specialization}
                                        onValueChange={setSpecialization}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select specialization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bsbaSpecializations.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="specialization" value={specialization} required />
                                </div>
                            )}

                            {/* Year Level */}
                            {department && (
                                <div className="space-y-2">
                                    <Label htmlFor="year_level">Year Level</Label>
                                    <Select value={yearLevel} onValueChange={setYearLevel}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={isIBED ? "Select grade" : "Select year level"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isIBED ? (
                                                <>
                                                    <SelectItem value="G1">Grade 1</SelectItem>
                                                    <SelectItem value="G2">Grade 2</SelectItem>
                                                    <SelectItem value="G3">Grade 3</SelectItem>
                                                    <SelectItem value="G4">Grade 4</SelectItem>
                                                    <SelectItem value="G5">Grade 5</SelectItem>
                                                    <SelectItem value="G6">Grade 6</SelectItem>
                                                    <SelectItem value="G7">Grade 7 (JHS)</SelectItem>
                                                    <SelectItem value="G8">Grade 8 (JHS)</SelectItem>
                                                    <SelectItem value="G9">Grade 9 (JHS)</SelectItem>
                                                    <SelectItem value="G10">Grade 10 (JHS)</SelectItem>
                                                    <SelectItem value="G11">Grade 11 (SHS)</SelectItem>
                                                    <SelectItem value="G12">Grade 12 (SHS)</SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                                    <SelectItem value="5th Year">5th Year</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" name="year_level" value={yearLevel} required />
                                </div>
                            )}
                        </>
                    )}

                    {/* Employee ID for Faculty/Nurse/Doctor */}
                    {(role === "Faculty" || role === "Nurse" || role === "Doctor") && (
                        <div className="space-y-2">
                            <Label htmlFor="employee_id">Employee ID</Label>
                            <Input name="employee_id" required />
                        </div>
                    )}

                    {/* Names */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fname">First Name</Label>
                            <Input name="fname" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mname">Middle Name</Label>
                            <Input name="mname" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lname">Last Name</Label>
                            <Input name="lname" required />
                        </div>
                    </div>

                    {/* DOB */}
                    <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Date of Birth</Label>
                        <Input type="date" name="date_of_birth" required />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={gender} onValueChange={setGender}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="gender" value={gender} required />
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading && (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        )}
                        {isLoading ? "Creating..." : "Create User"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
