import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { handleAuthError, requireRole } from "@/lib/authorization";

const booleanTrueValues = new Set(["true", "yes", "1", "y"]);

function splitCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === "\"") {
            if (inQuotes && nextChar === "\"") {
                current += "\"";
                i += 1; // Skip escaped quote
                continue;
            }
            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
}

function parseCsv(text: string) {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (!lines.length) return { headers: [] as string[], rows: [] as Record<string, string>[] };

    const headers = splitCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        const record: Record<string, string> = {};
        headers.forEach((header, index) => {
            record[header] = values[index]?.trim() ?? "";
        });
        return record;
    });

    return { headers, rows };
}

function normalizeBoolean(value?: string) {
    if (!value) return false;
    return booleanTrueValues.has(value.trim().toLowerCase());
}

function normalizePayload(row: Record<string, string>) {
    const patientType = row.patienttype?.toLowerCase() as "student" | "employee" | undefined;

    return {
        role: row.role?.toUpperCase(),
        fname: row.fname,
        mname: row.mname || undefined,
        lname: row.lname,
        suffix: row.suffix || undefined,
        password: row.password || undefined,
        patientType,
        student_id: row.student_id || undefined,
        employee_id: row.employee_id || undefined,
        workingScholar: patientType === "student" ? normalizeBoolean(row.working_scholar || row.workingscholar) : false,
        department: row.department?.toUpperCase() || undefined,
        program: row.program || undefined,
        year_level: row.year_level || undefined,
        specialization: row.specialization || undefined,
        email: row.email || undefined,
        phone: row.phone || undefined,
        address: row.address || undefined,
        allergies: row.allergies || undefined,
        bloodtype: row.bloodtype || undefined,
        medical_cond: row.medical_cond || undefined,
        emergencyco_name: row.emergencyco_name || undefined,
        emergencyco_num: row.emergencyco_num || undefined,
        emergencyco_relation: row.emergencyco_relation || undefined,
    } as Record<string, unknown>;
}

export async function POST(req: Request) {
    try {
        await requireRole([Role.NURSE]);

        const formData = await req.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Please attach a CSV file to import." }, { status: 400 });
        }

        const text = await file.text();
        const { rows } = parseCsv(text);

        if (!rows.length) {
            return NextResponse.json({ error: "The uploaded CSV is empty." }, { status: 400 });
        }

        const targetUrl = new URL("/api/nurse/accounts", req.url);
        const cookieHeader = req.headers.get("cookie") ?? "";

        let created = 0;
        const errors: { row: number; message: string }[] = [];

        for (let index = 0; index < rows.length; index++) {
            const lineNumber = index + 2; // account for header
            const payload = normalizePayload(rows[index]);

            if (!payload.role || !payload.fname || !payload.lname) {
                errors.push({ row: lineNumber, message: "Missing required fields: role, fname, or lname." });
                continue;
            }

            try {
                const res = await fetch(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        cookie: cookieHeader,
                    },
                    body: JSON.stringify(payload),
                    cache: "no-store",
                });

                const data = await res.json();

                if (!res.ok || data?.error) {
                    errors.push({
                        row: lineNumber,
                        message: data?.error || "Failed to create user from CSV row.",
                    });
                    continue;
                }

                created += 1;
            } catch (err) {
                console.error("[IMPORT CSV]", err);
                errors.push({ row: lineNumber, message: "Unexpected error while processing this row." });
            }
        }

        return NextResponse.json({ created, failed: errors.length, errors });
    } catch (err) {
        const authResponse = handleAuthError(err);
        if (authResponse) return authResponse;

        console.error("[POST /api/nurse/accounts/import]", err);
        return NextResponse.json({ error: "Failed to import accounts from CSV." }, { status: 500 });
    }
}
