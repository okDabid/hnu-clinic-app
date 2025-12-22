import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
import { isAllowedNameSuffix } from "@/lib/validation";

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
        "Kindergarten 1": YearLevel.KINDERGARTEN_1,
        "Kindergarten 2": YearLevel.KINDERGARTEN_2,
        "Grade 1": YearLevel.GRADE_1,
        "Grade 2": YearLevel.GRADE_2,
        "Grade 3": YearLevel.GRADE_3,
        "Grade 4": YearLevel.GRADE_4,
        "Grade 5": YearLevel.GRADE_5,
        "Grade 6": YearLevel.GRADE_6,
        "Grade 7": YearLevel.GRADE_7,
        "Grade 8": YearLevel.GRADE_8,
        "Grade 9": YearLevel.GRADE_9,
        "Grade 10": YearLevel.GRADE_10,
        "Grade 11": YearLevel.GRADE_11,
        "Grade 12": YearLevel.GRADE_12,
        FIRST_YEAR: YearLevel.FIRST_YEAR,
        SECOND_YEAR: YearLevel.SECOND_YEAR,
        THIRD_YEAR: YearLevel.THIRD_YEAR,
        FOURTH_YEAR: YearLevel.FOURTH_YEAR,
        FIFTH_YEAR: YearLevel.FIFTH_YEAR,
        KINDERGARTEN_1: YearLevel.KINDERGARTEN_1,
        KINDERGARTEN_2: YearLevel.KINDERGARTEN_2,
        GRADE_1: YearLevel.GRADE_1,
        GRADE_2: YearLevel.GRADE_2,
        GRADE_3: YearLevel.GRADE_3,
        GRADE_4: YearLevel.GRADE_4,
        GRADE_5: YearLevel.GRADE_5,
        GRADE_6: YearLevel.GRADE_6,
        GRADE_7: YearLevel.GRADE_7,
        GRADE_8: YearLevel.GRADE_8,
        GRADE_9: YearLevel.GRADE_9,
        GRADE_10: YearLevel.GRADE_10,
        GRADE_11: YearLevel.GRADE_11,
        GRADE_12: YearLevel.GRADE_12,
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

function normalizeStringOrNull(value: unknown): string | null | undefined {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }
    if (value === null) return null;
    return undefined;
}

// ---------------- UPDATE INPUT BUILDERS ----------------
function buildStudentUpdateInput(raw: Record<string, unknown>): Prisma.StudentUpdateInput {
    const data: Prisma.StudentUpdateInput = {};

    if (typeof raw.fname === "string") data.fname = raw.fname;
    if (typeof raw.mname === "string") data.mname = raw.mname;
    if (typeof raw.lname === "string") data.lname = raw.lname;
    if (typeof raw.suffix === "string") data.suffix = raw.suffix;
    else if (raw.suffix === null) data.suffix = null;
    if (typeof raw.email === "string") data.email = raw.email;
    if (isGender(raw.gender)) data.gender = raw.gender;
    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    const department = mapDepartment(raw.department as string);
    const year_level = mapYearLevel(raw.year_level as string);
    const bloodtype = mapBloodType(raw.bloodtype as string);

    if (department) data.department = department;
    const yearLevelProvided = Object.prototype.hasOwnProperty.call(raw, "year_level");
    if (year_level) {
        data.year_level = year_level;
    } else if (yearLevelProvided && raw.year_level === null) {
        data.year_level = null;
    }
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

function buildEmployeeUpdateInput(
    raw: Record<string, unknown>
): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};

    const stringField = (key: string) =>
        typeof raw[key] === "string" ? (raw[key] as string).trim() : undefined;

    const fname = stringField("fname");
    if (fname !== undefined) data.fname = fname;

    const mname = stringField("mname");
    if (mname !== undefined) data.mname = mname;

    const lname = stringField("lname");
    if (lname !== undefined) data.lname = lname;

    const suffix = stringField("suffix");
    if (suffix !== undefined) data.suffix = suffix;
    else if (raw.suffix === null) data.suffix = null;

    const email = stringField("email");
    if (email !== undefined) data.email = email;

    if (isGender(raw.gender)) data.gender = raw.gender;

    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    const bloodtype = mapBloodType(raw.bloodtype as string);
    if (bloodtype) data.bloodtype = bloodtype;

    const department_office = normalizeStringOrNull(raw.department_office);
    if (department_office !== undefined) data.department_office = department_office;

    const contactno = stringField("contactno");
    if (contactno !== undefined) data.contactno = contactno;

    const address = stringField("address");
    if (address !== undefined) data.address = address;

    const allergies = stringField("allergies");
    if (allergies !== undefined) data.allergies = allergies;

    const medicalCond = normalizeStringOrNull(raw.medical_cond);
    if (medicalCond !== undefined) data.medical_cond = medicalCond;

    const emergencyName = stringField("emergencyco_name");
    if (emergencyName !== undefined) data.emergencyco_name = emergencyName;

    const emergencyNumber = stringField("emergencyco_num");
    if (emergencyNumber !== undefined) data.emergencyco_num = emergencyNumber;

    const emergencyRelation = stringField("emergencyco_relation");
    if (emergencyRelation !== undefined)
        data.emergencyco_relation = emergencyRelation;

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
            profile:
                user.student
                    ? { ...user.student, suffix: user.student.suffix?.trim() || null }
                    : user.employee
                        ? { ...user.employee, suffix: user.employee.suffix?.trim() || null }
                        : null,
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

        if (profile.suffix !== undefined) {
            const normalizedSuffix = typeof profile.suffix === "string" ? profile.suffix.trim() : profile.suffix;

            if (!isAllowedNameSuffix(normalizedSuffix as string | null | undefined)) {
                return NextResponse.json(
                    { error: "Suffix must be Jr., Sr., II, III, IV, or left blank." },
                    { status: 400 }
                );
            }

            profile.suffix = typeof normalizedSuffix === "string" ? normalizedSuffix || null : normalizedSuffix;
        }

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
        const incomingGender = isGender(profile.gender) ? profile.gender : null;

        if (existingProfile?.gender && incomingGender && existingProfile.gender !== incomingGender) {
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

        // 2. Build proper update input (like before)
        if (isStudent) {
            const studentProfile = user.student!;
            const data = buildStudentUpdateInput(profile);

            // Ensure we don't override DOB if already set
            if (existingDOB) delete data.date_of_birth;
            if (studentProfile.gender) delete data.gender;

            let verificationEmail: string | null = null;
            let shouldClearVerification = false;
            if (typeof profile.email === "string") {
                const trimmedEmail = profile.email.trim();
                const existingEmail = studentProfile.email ?? "";

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

            if (typeof data.contactno === "string") {
                const trimmedContact = data.contactno.trim();

                if (!trimmedContact) {
                    if (studentProfile.contactno) {
                        data.contactno = null;
                    } else {
                        delete data.contactno;
                    }
                } else if (trimmedContact === studentProfile.contactno) {
                    delete data.contactno;
                } else {
                    data.contactno = trimmedContact;
                    const duplicateContact = await prisma.student.findFirst({
                        where: {
                            contactno: trimmedContact,
                            NOT: { user_id: session.user.id },
                        },
                    });
                    if (duplicateContact) {
                        return NextResponse.json(
                            { error: "Contact number already exists." },
                            { status: 400 }
                        );
                    }
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
                    console.error("[Patient student email verification]", error);
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
                type: "student",
                verificationEmailSent: Boolean(verificationEmail),
            });
        }

        if (isEmployee) {
            const employeeProfile = user.employee!;
            const data = buildEmployeeUpdateInput(profile);

            // Ensure we don't override DOB if already set
            if (existingDOB) delete data.date_of_birth;
            if (employeeProfile.gender) delete data.gender;

            let verificationEmail: string | null = null;
            let shouldClearVerification = false;
            if (typeof profile.email === "string") {
                const trimmedEmail = profile.email.trim();
                const existingEmail = employeeProfile.email ?? "";

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

            if (typeof data.contactno === "string") {
                const trimmedContact = data.contactno.trim();

                if (!trimmedContact) {
                    if (employeeProfile.contactno) {
                        data.contactno = null;
                    } else {
                        delete data.contactno;
                    }
                } else {
                    if (trimmedContact === employeeProfile.contactno) {
                        delete data.contactno;
                    } else {
                        data.contactno = trimmedContact;
                        const duplicateContact = await prisma.employee.findFirst({
                            where: {
                                contactno: trimmedContact,
                                NOT: { user_id: session.user.id },
                            },
                        });
                        if (duplicateContact) {
                            return NextResponse.json(
                                { error: "Contact number already exists." },
                                { status: 400 }
                            );
                        }
                    }
                }
            }

            if (typeof data.email === "string") {
                const duplicateEmail = await prisma.employee.findFirst({
                    where: {
                        email: data.email,
                        NOT: { user_id: session.user.id },
                    },
                });
                if (duplicateEmail) {
                    return NextResponse.json(
                        { error: "Email already exists." },
                        { status: 400 }
                    );
                }
            }

            const updated = await prisma.employee.update({
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
                    console.error("[Patient employee email verification]", error);
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
                type: "employee",
                verificationEmailSent: Boolean(verificationEmail),
            });
        }

        return NextResponse.json(
            { error: "Profile not found for this user" },
            { status: 404 }
        );
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            const field = (err.meta?.target as string[])?.[0] ?? "field";
            return NextResponse.json(
                { error: `Duplicate ${field} — this value is already in use.` },
                { status: 400 }
            );
        }

        console.error("[PUT /api/patient/account/me]", err);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

