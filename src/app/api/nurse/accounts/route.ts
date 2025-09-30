import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // Step 1: Create User account
        const newUser = await prisma.users.create({
            data: {
                username: payload.username ?? payload.fname.toLowerCase() + "." + payload.lname.toLowerCase(), // example username
                password: "autogen123", // replace with real password hashing
                role: payload.role,
                status: "Active",
            },
        });

        // Step 2: Depending on role, create linked profile
        if (payload.role === "PATIENT" && payload.patientType === "student") {
            await prisma.student.create({
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
        }

        if (payload.role === "PATIENT" && payload.patientType === "employee") {
            await prisma.employee.create({
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
        }

        if (payload.role === "NURSE" || payload.role === "DOCTOR") {
            await prisma.employee.create({
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
        }

        if (payload.role === "SCHOLAR") {
            await prisma.student.create({
                data: {
                    user_id: newUser.user_id,
                    student_id: payload.school_id, // storing school_id as student_id for scholars
                    fname: payload.fname,
                    mname: payload.mname,
                    lname: payload.lname,
                    date_of_birth: new Date(payload.date_of_birth),
                    gender: payload.gender,
                },
            });
        }

        return NextResponse.json({
            id: newUser.user_id,
            password: "autogen123", // return generated password
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
            user_id: u.user_id,
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
