import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";

// Password generator (8 chars, alphanumeric)
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generatePassword = customAlphabet(alphabet, 8);

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Generate random password
        const plainPassword = generatePassword();

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Step 1: Create base user
        const newUser = await prisma.users.create({
            data: {
                username:
                    payload.username ??
                    payload.fname.toLowerCase() + "." + payload.lname.toLowerCase(),
                password: hashedPassword, // ✅ store hash
                role: payload.role,
                status: "Active",
            },
        });

        let externalId: string | null = null;

        // Step 2: Linked profiles
        if (payload.role === "PATIENT" && payload.patientType === "student") {
            const student = await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.student_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
            externalId = student.student_id;
        }

        if (payload.role === "PATIENT" && payload.patientType === "employee") {
            const employee = await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: payload.employee_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
            externalId = employee.employee_id;
        }

        if (payload.role === "NURSE" || payload.role === "DOCTOR") {
            const employee = await prisma.employee.create({
                data: {
                    user_id: newUser.user_id,
                    employee_id: payload.employee_id,
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
            externalId = employee.employee_id;
        }

        if (payload.role === "SCHOLAR") {
            const scholar = await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.school_id, // storing school_id in student_id field
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
            externalId = scholar.student_id;
        }

        // ✅ Return external ID + plaintext password (for toast)
        return NextResponse.json({
            id: externalId ?? newUser.username,
            password: plainPassword,
        });
    } catch (err) {
        console.error("[POST /api/nurse/accounts]", err);
        return NextResponse.json(
            { error: "Failed to create user" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const users = await prisma.users.findMany({
            include: {
                student: true,
                employee: true,
            },
        });

        const formatted = users.map((u) => ({
            // ✅ show external ID instead of cuid
            user_id:
                u.student?.student_id ??
                u.employee?.employee_id ??
                u.username, // fallback only if no profile exists

            username: u.username,
            role: u.role,
            status: u.status,
            fullName:
                u.student?.fname && u.student?.lname
                    ? `${u.student.fname} ${u.student.lname}`
                    : u.employee?.fname && u.employee?.lname
                        ? `${u.employee.fname} ${u.employee.lname}`
                        : u.username,
        }));

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[GET /api/nurse/accounts]", err);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const { userId, newStatus } = await req.json();

        await prisma.users.update({
            where: { user_id: userId },
            data: { status: newStatus },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[PUT /api/nurse/accounts]", err);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
