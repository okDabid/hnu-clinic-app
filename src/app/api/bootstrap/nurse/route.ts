import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { AccountStatus, Role } from "@prisma/client";

import { isNurseBootstrapEnabled } from "@/lib/bootstrap-flag";
import { prisma } from "@/lib/prisma";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generatePassword = customAlphabet(alphabet, 12);

async function ensureUniqueUsername(base: string) {
    let candidate = base;
    let attempt = 1;

    while (await prisma.users.findUnique({ where: { username: candidate } })) {
        candidate = `${base}-${attempt++}`;
    }

    return candidate;
}

async function ensureUniqueEmployeeId(value: string) {
    let candidate = value;
    let attempt = 1;

    while (await prisma.employee.findUnique({ where: { employee_id: candidate } })) {
        candidate = `${value}-${attempt++}`;
    }

    return candidate;
}

export async function POST(req: Request) {
    if (!isNurseBootstrapEnabled()) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let payload: Partial<{
        employee_id: string;
        fname: string;
        mname?: string;
        lname: string;
        email?: string;
        contactno?: string;
        address?: string;
    }> = {};

    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const employeeId = String(payload.employee_id || "").trim();
    const fname = String(payload.fname || "").trim();
    const lname = String(payload.lname || "").trim();
    const mname = payload.mname ? String(payload.mname).trim() : "";
    const email = payload.email ? String(payload.email).trim() : "";
    const contactno = payload.contactno ? String(payload.contactno).trim() : "";
    const address = payload.address ? String(payload.address).trim() : "";

    if (!employeeId || !fname || !lname) {
        return NextResponse.json(
            { error: "Employee ID, first name, and last name are required." },
            { status: 400 }
        );
    }

    try {
        const username = await ensureUniqueUsername(employeeId);
        const uniqueEmployeeId = await ensureUniqueEmployeeId(employeeId);
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
                data: {
                    username,
                    password: hashedPassword,
                    role: Role.NURSE,
                    status: AccountStatus.Active,
                },
            });

            await tx.employee.create({
                data: {
                    user_id: user.user_id,
                    employee_id: uniqueEmployeeId,
                    fname,
                    mname: mname || null,
                    lname,
                    address: address || null,
                    contactno: contactno || null,
                    email: email || null,
                },
            });
        });

        return NextResponse.json({ username, password });
    } catch (error) {
        console.error("[POST /api/bootstrap/nurse]", error);
        return NextResponse.json({ error: "Failed to bootstrap nurse account." }, { status: 500 });
    }
}
