import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    Role,
    Gender,
    Department,
    YearLevel,
    BloodType,
    Prisma,
} from "@prisma/client";

// ---------------- ENUM HELPERS ----------------
function mapDepartment(val?: string | null): Department | undefined {
    if (!val) return undefined;
    const map: Record<string, Department> = {
        "College of Education": Department.EDUCATION,
        "College of Arts and Sciences": Department.ARTS_AND_SCIENCES,
        "College of Business and Accountancy": Department.BUSINESS_AND_ACCOUNTANCY,
        "College of Engineering and Computer Studies":
            Department.ENGINEERING_AND_COMPUTER_STUDIES,
        "College of Health Sciences": Department.HEALTH_SCIENCES,
        "College of Law": Department.LAW,
        "Basic Education Department": Department.BASIC_EDUCATION,
        EDUCATION: Department.EDUCATION,
        ARTS_AND_SCIENCES: Department.ARTS_AND_SCIENCES,
        BUSINESS_AND_ACCOUNTANCY: Department.BUSINESS_AND_ACCOUNTANCY,
        ENGINEERING_AND_COMPUTER_STUDIES: Department.ENGINEERING_AND_COMPUTER_STUDIES,
        HEALTH_SCIENCES: Department.HEALTH_SCIENCES,
        LAW: Department.LAW,
        BASIC_EDUCATION: Department.BASIC_EDUCATION,
    };
    return map[val];
}

function mapYearLevel(val?: string | null): YearLevel | undefined {
    if (!val) return undefined;
    const map: Record<string, YearLevel> = {
        "1st Year": YearLevel.FIRST_YEAR,
        "2nd Year": YearLevel.SECOND_YEAR,
        "3rd Year": YearLevel.THIRD_YEAR,
        "4th Year": YearLevel.FOURTH_YEAR,
        "5th Year": YearLevel.FIFTH_YEAR,
        "Kindergarten": YearLevel.KINDERGARTEN,
        "Kindergarten 1": YearLevel.KINDERGARTEN,
        "Kindergarten 2": YearLevel.KINDERGARTEN,
        "Elementary": YearLevel.ELEMENTARY,
        "Grade 1": YearLevel.ELEMENTARY,
        "Grade 2": YearLevel.ELEMENTARY,
        "Grade 3": YearLevel.ELEMENTARY,
        "Grade 4": YearLevel.ELEMENTARY,
        "Grade 5": YearLevel.ELEMENTARY,
        "Grade 6": YearLevel.ELEMENTARY,
        "Junior High School": YearLevel.JUNIOR_HIGH,
        "Grade 7": YearLevel.JUNIOR_HIGH,
        "Grade 8": YearLevel.JUNIOR_HIGH,
        "Grade 9": YearLevel.JUNIOR_HIGH,
        "Grade 10": YearLevel.JUNIOR_HIGH,
        "Senior High School": YearLevel.SENIOR_HIGH,
        "Grade 11": YearLevel.SENIOR_HIGH,
        "Grade 12": YearLevel.SENIOR_HIGH,
        FIRST_YEAR: YearLevel.FIRST_YEAR,
        SECOND_YEAR: YearLevel.SECOND_YEAR,
        THIRD_YEAR: YearLevel.THIRD_YEAR,
        FOURTH_YEAR: YearLevel.FOURTH_YEAR,
        FIFTH_YEAR: YearLevel.FIFTH_YEAR,
        KINDERGARTEN: YearLevel.KINDERGARTEN,
        ELEMENTARY: YearLevel.ELEMENTARY,
        JUNIOR_HIGH: YearLevel.JUNIOR_HIGH,
        SENIOR_HIGH: YearLevel.SENIOR_HIGH,
    };
    return map[val];
}

function mapBloodType(val?: string | null): BloodType | undefined {
    if (!val) return undefined;
    const map: Record<string, BloodType> = {
        "A+": BloodType.A_POS,
        "A-": BloodType.A_NEG,
        "B+": BloodType.B_POS,
        "B-": BloodType.B_NEG,
        "AB+": BloodType.AB_POS,
        "AB-": BloodType.AB_NEG,
        "O+": BloodType.O_POS,
        "O-": BloodType.O_NEG,
        A_POS: BloodType.A_POS,
        A_NEG: BloodType.A_NEG,
        B_POS: BloodType.B_POS,
        B_NEG: BloodType.B_NEG,
        AB_POS: BloodType.AB_POS,
        AB_NEG: BloodType.AB_NEG,
        O_POS: BloodType.O_POS,
        O_NEG: BloodType.O_NEG,
    };
    return map[val];
}

// ---------------- HELPERS ----------------
function isGender(val: unknown): val is Gender {
    return val === "Male" || val === "Female";
}

function toDate(val: unknown): Date | undefined {
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === "string") {
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
    }
    return undefined;
}

// ---------------- UPDATE INPUT BUILDERS ----------------
function buildStudentUpdateInput(
    raw: Record<string, unknown>
): Prisma.StudentUpdateInput {
    const data: Prisma.StudentUpdateInput = {};

    if (typeof raw.fname === "string") data.fname = raw.fname;
    if (typeof raw.mname === "string") data.mname = raw.mname;
    if (typeof raw.lname === "string") data.lname = raw.lname;
    if (typeof raw.email === "string") data.email = raw.email;
    if (isGender(raw.gender)) data.gender = raw.gender;
    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    const department = mapDepartment(raw.department as string);
    const year_level = mapYearLevel(raw.year_level as string);
    const bloodtype = mapBloodType(raw.bloodtype as string);

    if (department) data.department = department;
    if (year_level) data.year_level = year_level;
    if (bloodtype) data.bloodtype = bloodtype;

    if (typeof raw.program === "string") data.program = raw.program;
    if (typeof raw.contactno === "string") data.contactno = raw.contactno;
    if (typeof raw.address === "string") data.address = raw.address;
    if (typeof raw.allergies === "string") data.allergies = raw.allergies;
    if (typeof raw.medical_cond === "string") data.medical_cond = raw.medical_cond;
    if (typeof raw.emergencyco_name === "string")
        data.emergencyco_name = raw.emergencyco_name;
    if (typeof raw.emergencyco_num === "string")
        data.emergencyco_num = raw.emergencyco_num;
    if (typeof raw.emergencyco_relation === "string")
        data.emergencyco_relation = raw.emergencyco_relation;

    return data;
}

function buildEmployeeUpdateInput(
    raw: Record<string, unknown>
): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};

    if (typeof raw.fname === "string") data.fname = raw.fname;
    if (typeof raw.mname === "string") data.mname = raw.mname;
    if (typeof raw.lname === "string") data.lname = raw.lname;
    if (typeof raw.email === "string") data.email = raw.email;
    if (isGender(raw.gender)) data.gender = raw.gender;

    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    const bloodtype = mapBloodType(raw.bloodtype as string);
    if (bloodtype) data.bloodtype = bloodtype;

    if (typeof raw.contactno === "string") data.contactno = raw.contactno;
    if (typeof raw.address === "string") data.address = raw.address;
    if (typeof raw.allergies === "string") data.allergies = raw.allergies;
    if (typeof raw.medical_cond === "string") data.medical_cond = raw.medical_cond;
    if (typeof raw.emergencyco_name === "string")
        data.emergencyco_name = raw.emergencyco_name;
    if (typeof raw.emergencyco_num === "string")
        data.emergencyco_num = raw.emergencyco_num;
    if (typeof raw.emergencyco_relation === "string")
        data.emergencyco_relation = raw.emergencyco_relation;

    return data;
}

// ---------------- GET PROFILE ----------------
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true, employee: true },
        });

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.PATIENT)
            return NextResponse.json({ error: "Not a patient" }, { status: 403 });

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            type: user.student ? "student" : user.employee ? "employee" : null,
            profile: user.student ?? user.employee ?? null,
        });
    } catch (err) {
        console.error("[GET /api/patient/account/me]", err);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

// ---------------- UPDATE PROFILE ----------------
export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await req.json();
        const profile = (payload?.profile ?? {}) as Record<string, unknown>;

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true, employee: true },
        });

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.PATIENT)
            return NextResponse.json({ error: "Not a patient" }, { status: 403 });

        // 1. Detect if DOB is already set and prevent changes
        const isStudent = Boolean(user.student);
        const isEmployee = Boolean(user.employee);
        const existingProfile = user.student ?? user.employee;

        const incomingDOB = toDate(profile.date_of_birth);
        const existingDOB = existingProfile?.date_of_birth ?? null;

        if (existingDOB && incomingDOB && existingDOB.getTime() !== incomingDOB.getTime()) {
            return NextResponse.json(
                { error: "Date of birth cannot be changed once set." },
                { status: 400 }
            );
        }

        // 2. Build proper update input (like before)
        if (isStudent) {
            const data = buildStudentUpdateInput(profile);

            // Ensure we don't override DOB if already set
            if (existingDOB) delete data.date_of_birth;

            const updated = await prisma.student.update({
                where: { user_id: session.user.id },
                data,
            });

            return NextResponse.json({ success: true, profile: updated, type: "student" });
        }

        if (isEmployee) {
            const data = buildEmployeeUpdateInput(profile);

            // Ensure we don't override DOB if already set
            if (existingDOB) delete data.date_of_birth;

            const updated = await prisma.employee.update({
                where: { user_id: session.user.id },
                data,
            });

            return NextResponse.json({ success: true, profile: updated, type: "employee" });
        }

        return NextResponse.json(
            { error: "Profile not found for this user" },
            { status: 404 }
        );
    } catch (err) {
        console.error("[PUT /api/patient/account/me]", err);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

