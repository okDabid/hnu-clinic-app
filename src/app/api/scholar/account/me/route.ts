import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, Gender, Department, YearLevel, BloodType, Prisma } from "@prisma/client";

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

// ---------------- ENUM MAPPERS (COLLEGE ONLY) ----------------
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
    };
    return map[val];
}

// ---------------- BUILD UPDATE INPUT ----------------
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

    // restrict to college-level departments and years
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

// ---------------- GET PROFILE ----------------
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true },
        });

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.SCHOLAR)
            return NextResponse.json({ error: "Not a scholar" }, { status: 403 });

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            profile: user.student ?? null,
        });
    } catch (err) {
        console.error("[GET /api/scholar/account/me]", err);
        return NextResponse.json(
            { error: "Failed to fetch scholar profile" },
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
            include: { student: true },
        });

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.SCHOLAR)
            return NextResponse.json({ error: "Not a scholar" }, { status: 403 });

        const existingProfile = user.student;
        if (!existingProfile)
            return NextResponse.json(
                { error: "Student profile not found for scholar" },
                { status: 404 }
            );

        const incomingDOB = toDate(profile.date_of_birth);
        const existingDOB = existingProfile.date_of_birth ?? null;

        // Prevent DOB change after set
        if (existingDOB && incomingDOB && existingDOB.getTime() !== incomingDOB.getTime()) {
            return NextResponse.json(
                { error: "Date of birth cannot be changed once set." },
                { status: 400 }
            );
        }

        // Restrict updates to only college-level fields
        const data = buildStudentUpdateInput(profile);
        if (existingDOB) delete data.date_of_birth;

        const updated = await prisma.student.update({
            where: { user_id: session.user.id },
            data,
        });

        return NextResponse.json({ success: true, profile: updated });
    } catch (err) {
        console.error("[PUT /api/scholar/account/me]", err);
        return NextResponse.json(
            { error: "Failed to update scholar profile" },
            { status: 500 }
        );
    }
}
