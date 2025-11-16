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
import { issueEmailVerification, clearEmailVerifications } from "@/lib/email-verification";
import { consumeRateLimit } from "@/lib/rate-limit";

/** ---------- MAPPERS (College-only) ---------- */
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
        EDUCATION: Department.EDUCATION,
        ARTS_AND_SCIENCES: Department.ARTS_AND_SCIENCES,
        BUSINESS_AND_ACCOUNTANCY: Department.BUSINESS_AND_ACCOUNTANCY,
        ENGINEERING_AND_COMPUTER_STUDIES: Department.ENGINEERING_AND_COMPUTER_STUDIES,
        HEALTH_SCIENCES: Department.HEALTH_SCIENCES,
        LAW: Department.LAW,
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
        FIRST_YEAR: YearLevel.FIRST_YEAR,
        SECOND_YEAR: YearLevel.SECOND_YEAR,
        THIRD_YEAR: YearLevel.THIRD_YEAR,
        FOURTH_YEAR: YearLevel.FOURTH_YEAR,
        FIFTH_YEAR: YearLevel.FIFTH_YEAR,
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

/** ---------- HELPERS ---------- */
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

function normalizeStringOrNull(value: unknown): string | null | undefined {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }
    if (value === null) return null;
    return undefined;
}

/** ---------- BUILD UPDATE INPUT (Student) ---------- */
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
    const medicalCond = normalizeStringOrNull(raw.medical_cond);
    if (medicalCond !== undefined) data.medical_cond = medicalCond;
    if (typeof raw.emergencyco_name === "string")
        data.emergencyco_name = raw.emergencyco_name;
    if (typeof raw.emergencyco_num === "string")
        data.emergencyco_num = raw.emergencyco_num;
    if (typeof raw.emergencyco_relation === "string")
        data.emergencyco_relation = raw.emergencyco_relation;

    return data;
}

/** ---------- GET (profile) ---------- */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.users.findUnique({
            where: { user_id: session.user.id },
            include: { student: true },
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
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
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

/** ---------- PUT (update profile) ---------- */
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

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.SCHOLAR)
            return NextResponse.json({ error: "Not a scholar" }, { status: 403 });

        const existingProfile = user.student;
        if (!existingProfile)
            return NextResponse.json(
                { error: "Student profile not found for this scholar" },
                { status: 404 }
            );

        // Prevent changing DOB once set
        const incomingDOB = toDate(profile.date_of_birth);
        const existingDOB = existingProfile.date_of_birth ?? null;
        const incomingGender = isGender(profile.gender) ? profile.gender : null;

        if (existingProfile.gender && incomingGender && existingProfile.gender !== incomingGender) {
            return NextResponse.json(
                { error: "Gender cannot be changed once set." },
                { status: 400 }
            );
        }

        if (existingDOB && incomingDOB && existingDOB.getTime() !== incomingDOB.getTime()) {
            return NextResponse.json(
                { error: "Date of birth cannot be changed once set." },
                { status: 400 }
            );
        }

        // Build update data (without using any)
        const data = buildStudentUpdateInput(profile);
        if (existingDOB && "date_of_birth" in data) {
            delete data.date_of_birth;
        }
        if (existingProfile.gender && "gender" in data) {
            delete data.gender;
        }

        let verificationEmail: string | null = null;
        let shouldClearVerification = false;
        if (typeof profile.email === "string") {
            const trimmedEmail = profile.email.trim();
            const existingEmail = existingProfile.email ?? "";

            if (!trimmedEmail) {
                if (existingEmail) {
                    data.email = null;
                    shouldClearVerification = true;
                } else {
                    delete data.email;
                }
            } else if (trimmedEmail.toLowerCase() !== existingEmail.toLowerCase()) {
                const rate = await consumeRateLimit(
                    `email-verify:${session.user.id}`,
                    3,
                    60 * 60_000
                );
                if (!rate.success) {
                    const minutes = rate.retryAfterMs
                        ? Math.ceil(rate.retryAfterMs / 60000)
                        : null;
                    const waitMessage =
                        minutes && minutes > 0
                            ? `Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before requesting another verification email.`
                            : "Please wait before requesting another verification email.";
                    return NextResponse.json(
                        { error: `Too many verification requests. ${waitMessage}` },
                        { status: 429 }
                    );
                }

                data.email = trimmedEmail;
                verificationEmail = trimmedEmail;
            } else {
                delete data.email;
            }
        }

        const updated = await prisma.student.update({
            where: { user_id: session.user.id },
            data,
        });

        if (shouldClearVerification) {
            await clearEmailVerifications(session.user.id);
        }

        if (verificationEmail) {
            const displayName =
                `${updated.fname ?? ""} ${updated.lname ?? ""}`.trim() ||
                user.username ||
                "Clinic user";
            try {
                await issueEmailVerification({
                    userId: session.user.id,
                    email: verificationEmail,
                    name: displayName,
                });
            } catch (error) {
                console.error("[Scholar email verification]", error);
                return NextResponse.json(
                    {
                        error:
                            "Profile saved but the verification email could not be sent. Please try again later.",
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            profile: updated,
            verificationEmailSent: Boolean(verificationEmail),
        });
    } catch (err) {
        console.error("[PUT /api/scholar/account/me]", err);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
