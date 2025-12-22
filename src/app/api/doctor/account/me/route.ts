import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, Gender, BloodType, Prisma, Employee } from "@prisma/client";
import { isAllowedNameSuffix } from "@/lib/validation";
import { issueEmailVerification, clearEmailVerifications } from "@/lib/email-verification";
import { consumeRateLimit } from "@/lib/rate-limit";

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

function normalizeStringOrNull(value: unknown): string | null | undefined {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }
    if (value === null) return null;
    return undefined;
}

function buildEmployeeUpdateInput(
    raw: Record<string, unknown>
): Prisma.EmployeeUpdateInput {
    const data: Prisma.EmployeeUpdateInput = {};

    const stringField = (key: string) =>
        typeof raw[key] === "string" ? (raw[key] as string).trim() : undefined;

    data.fname = stringField("fname");
    data.mname = stringField("mname");
    data.lname = stringField("lname");
    const suffix = stringField("suffix");
    if (suffix !== undefined) data.suffix = suffix;
    else if (raw.suffix === null) data.suffix = null;
    data.email = stringField("email");
    data.contactno = stringField("contactno");
    data.address = stringField("address");
    data.allergies = stringField("allergies");
    data.medical_cond = normalizeStringOrNull(raw.medical_cond);
    data.emergencyco_name = stringField("emergencyco_name");
    data.emergencyco_num = stringField("emergencyco_num");
    data.emergencyco_relation = stringField("emergencyco_relation");
    data.department_office = stringField("department_office");

    if (isGender(raw.gender)) data.gender = raw.gender;

    const dob = toDate(raw.date_of_birth);
    if (dob) data.date_of_birth = dob;

    const bloodtype = mapBloodType(raw.bloodtype as string);
    if (bloodtype) data.bloodtype = bloodtype;

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
            include: { employee: true },
        });

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.DOCTOR)
            return NextResponse.json({ error: "Not a doctor" }, { status: 403 });

        return NextResponse.json({
            accountId: user.user_id,
            username: user.username,
            role: user.role,
            status: user.status,
            specialization: user.employee?.specialization ?? null,
            profile: user.employee
                ? {
                    ...user.employee,
                    suffix:
                        typeof user.employee.suffix === "string" && user.employee.suffix.trim()
                            ? user.employee.suffix.trim()
                            : null,
                }
                : null,
        });
    } catch (err) {
        console.error("[GET /api/doctor/account/me]", err);
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
            include: { employee: true },
        });

        if (!user)
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (user.role !== Role.DOCTOR || !user.employee)
            return NextResponse.json({ error: "Not a doctor" }, { status: 403 });

        const existing = user.employee;
        const incomingDOB = toDate(profile.date_of_birth);
        const existingDOB = existing.date_of_birth ?? null;
        const incomingGender = isGender(profile.gender) ? profile.gender : null;

        if (profile.suffix !== undefined) {
            const suffix = typeof profile.suffix === "string" ? profile.suffix.trim() : "";

            if (!isAllowedNameSuffix(suffix)) {
                return NextResponse.json(
                    { error: "Suffix must be Jr., Sr., II, III, IV, or left blank." },
                    { status: 400 }
                );
            }

            profile.suffix = suffix || null;
        }

        if (existing.gender && incomingGender && existing.gender !== incomingGender) {
            return NextResponse.json(
                { error: "Gender cannot be changed once set." },
                { status: 400 }
            );
        }

        // Prevent DOB change once set
        if (existingDOB && incomingDOB && existingDOB.getTime() !== incomingDOB.getTime()) {
            return NextResponse.json(
                { error: "Date of birth cannot be changed once set." },
                { status: 400 }
            );
        }

        const data = buildEmployeeUpdateInput(profile);

        // Remove unchanged / null / empty fields safely
        if (existingDOB) delete data.date_of_birth;
        if (existing.gender) delete data.gender;

        let verificationEmail: string | null = null;
        let shouldClearVerification = false;
        let normalizedContact: string | null = null;
        if (typeof profile.email === "string") {
            const trimmedEmail = profile.email.trim();
            const existingEmail = existing.email ?? "";

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
                if (existing.contactno) {
                    data.contactno = null;
                } else {
                    delete data.contactno;
                }
            } else if (trimmedContact === existing.contactno) {
                delete data.contactno;
            } else {
                data.contactno = trimmedContact;
                normalizedContact = trimmedContact;
            }
        }

        (Object.keys(data) as (keyof Prisma.EmployeeUpdateInput)[]).forEach((key) => {
            if (key === "email" || key === "contactno") {
                return;
            }

            const val = data[key];
            const existingVal = existing[key as keyof Employee];
            if (
                val === null ||
                val === undefined ||
                (typeof val === "string" && val.trim() === "") ||
                val === existingVal
            ) {
                delete data[key];
            }
        });

        // Nothing to update
        if (Object.keys(data).length === 0) {
            return NextResponse.json({
                success: true,
                message: "No changes detected",
                profile: existing,
            });
        }

        // Duplicate checks
        if (normalizedContact) {
            const duplicateContact = await prisma.employee.findFirst({
                where: {
                    contactno: normalizedContact,
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

        if (typeof data.email === "string") {
            const duplicateEmail = await prisma.employee.findFirst({
                where: {
                    email: data.email as string,
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

        // Safe update
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
                console.error("[Doctor email verification]", error);
                return NextResponse.json(
                    {
                        error:
                            "Profile saved but the verification email could not be sent. Please try again later.",
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true, profile: updated, verificationEmailSent: Boolean(verificationEmail) });
    } catch (error) {
        if (error instanceof Error && "code" in error && (error as { code?: string }).code === "P2002") {
            return NextResponse.json(
                { error: "Duplicate field value (email or contact number already exists)" },
                { status: 400 }
            );
        }

        console.error("[PUT /api/doctor/account/me]", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
