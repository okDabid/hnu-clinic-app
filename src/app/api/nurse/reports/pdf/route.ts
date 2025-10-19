import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import {
    QUARTERS,
    getQuarterlyReports,
    type QuarterReport,
    type ReportsResponse,
} from "../helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
    return value.replace(/[&<>"]|'/g, (char) => {
        switch (char) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case '"':
                return "&quot;";
            case "'":
                return "&#39;";
            default:
                return char;
        }
    });
}

function formatDateRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    end.setUTCDate(end.getUTCDate() - 1);

    const formatter = new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-PH").format(value);
}

function formatPercentage(value: number, total: number) {
    if (!total) return "0%";

    const ratio = value / total;
    return new Intl.NumberFormat("en-PH", {
        style: "percent",
        minimumFractionDigits: ratio > 0 && ratio < 0.1 ? 1 : 0,
        maximumFractionDigits: 1,
    }).format(ratio);
}

function renderDiagnosisList(diagnoses: QuarterReport["diagnosisCounts"]) {
    if (!diagnoses.length) {
        return '<li class="empty">No diagnoses were recorded for this quarter.</li>';
    }

    return diagnoses
        .map((item, index) => {
            return `<li><span class="name">${index + 1}. ${escapeHtml(item.diagnosis)}</span><span class="count">${formatNumber(
                item.count
            )}</span></li>`;
        })
        .join("\n");
}

function renderPatientMixTable(counts: QuarterReport["patientTypeCounts"]) {
    const entries = [
        { label: "Students", value: counts.Student ?? 0 },
        { label: "Employees", value: counts.Employee ?? 0 },
        { label: "Unspecified", value: counts.Unknown ?? 0 },
    ];

    const total = entries.reduce((sum, entry) => sum + entry.value, 0);

    const rows = entries
        .map((entry) => {
            return `<tr><td>${escapeHtml(entry.label)}</td><td>${formatNumber(entry.value)}</td><td>${formatPercentage(
                entry.value,
                total
            )}</td></tr>`;
        })
        .join("\n");

    return `${rows}\n<tr class="total"><td>Total</td><td>${formatNumber(total)}</td><td>${total ? "100%" : "0%"}</td></tr>`;
}

function createReportHtml(report: ReportsResponse) {
    const generatedAt = new Intl.DateTimeFormat("en-PH", {
        dateStyle: "long",
        timeStyle: "short",
    }).format(new Date());

    const quarter = report.selectedQuarter;
    const coverageRange = formatDateRange(quarter.startDate, quarter.endDate);
    const quarterHeading = `${quarter.label} ${report.year}`;

    const studentCount = quarter.patientTypeCounts.Student ?? 0;
    const employeeCount = quarter.patientTypeCounts.Employee ?? 0;
    const unspecifiedCount = quarter.patientTypeCounts.Unknown ?? 0;

    const patientMixTable = renderPatientMixTable(quarter.patientTypeCounts);
    const diagnosesList = renderDiagnosisList(quarter.diagnosisCounts);

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Quarterly Nurse Report</title>
        <style>
            :root {
                color-scheme: only light;
            }

            * {
                box-sizing: border-box;
                font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            body {
                margin: 0;
                padding: 48px 0;
                background: linear-gradient(180deg, #f0fdf4 0%, #e0f2fe 100%);
                color: #0f172a;
            }

            main {
                max-width: 960px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(15, 118, 110, 0.1);
                border: 1px solid #e2e8f0;
                overflow: hidden;
            }

            header {
                padding: 36px 48px 28px;
                background: radial-gradient(circle at top left, #047857, #0f766e);
                color: #f8fafc;
            }

            .brand-title {
                font-size: 26px;
                font-weight: 700;
                margin: 0;
            }

            .brand-subtitle {
                margin-top: 6px;
                font-size: 16px;
                opacity: 0.85;
            }

            .header-meta {
                margin-top: 24px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 18px;
            }

            .meta-block {
                padding: 14px 16px;
                border-radius: 14px;
                background: rgba(255, 255, 255, 0.12);
                border: 1px solid rgba(255, 255, 255, 0.15);
            }

            .meta-label {
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                opacity: 0.7;
                margin-bottom: 6px;
            }

            .meta-value {
                font-size: 15px;
                font-weight: 600;
            }

            .content {
                padding: 40px 48px 48px;
                display: flex;
                flex-direction: column;
                gap: 36px;
            }

            h2 {
                margin: 0;
                font-size: 20px;
                color: #0f172a;
            }

            .section-summary {
                margin: 8px 0 0;
                color: #475569;
                font-size: 14px;
            }

            .metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 18px;
            }

            .metric-card {
                padding: 20px;
                border-radius: 16px;
                border: 1px solid #e2e8f0;
                background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
                box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
            }

            .metric-card.primary {
                background: linear-gradient(135deg, #047857, #0f766e);
                color: #ecfdf5;
                border: none;
                box-shadow: 0 14px 30px rgba(4, 120, 87, 0.35);
            }

            .metric-card .label {
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: rgba(71, 85, 105, 0.9);
                margin-bottom: 10px;
            }

            .metric-card.primary .label {
                color: rgba(236, 253, 245, 0.75);
            }

            .metric-card .value {
                font-size: 28px;
                font-weight: 700;
                color: #0f172a;
            }

            .metric-card.primary .value {
                color: #ffffff;
            }

            .metric-card .caption {
                margin-top: 12px;
                font-size: 13px;
                color: #64748b;
                line-height: 1.45;
            }

            .metric-card.primary .caption {
                color: rgba(236, 253, 245, 0.85);
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 16px;
                font-size: 14px;
            }

            th,
            td {
                padding: 12px 14px;
                text-align: left;
            }

            thead th {
                background: #ecfdf5;
                color: #047857;
                font-weight: 600;
                border-bottom: 2px solid #bbf7d0;
            }

            tbody td {
                border-bottom: 1px solid #e2e8f0;
            }

            tbody tr.total td {
                font-weight: 600;
                color: #0f172a;
                border-bottom: none;
                background: #f8fafc;
            }

            .diagnosis-list {
                list-style: none;
                padding: 0;
                margin: 16px 0 0;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                overflow: hidden;
            }

            .diagnosis-list li {
                display: flex;
                justify-content: space-between;
                gap: 18px;
                padding: 14px 18px;
                background: #ffffff;
                border-bottom: 1px solid #e2e8f0;
            }

            .diagnosis-list li:nth-child(even) {
                background: #f8fafc;
            }

            .diagnosis-list li:last-child {
                border-bottom: none;
            }

            .diagnosis-list li .name {
                font-weight: 600;
                color: #0f172a;
            }

            .diagnosis-list li .count {
                font-weight: 600;
                color: #047857;
            }

            .diagnosis-list li.empty {
                justify-content: center;
                color: #64748b;
                font-weight: 500;
            }

            footer {
                padding: 24px 48px 36px;
                background: #f8fafc;
                color: #475569;
                font-size: 13px;
                border-top: 1px solid #e2e8f0;
            }
        </style>
    </head>
    <body>
        <main>
            <header>
                <h1 class="brand-title">Holy Name University Clinic</h1>
                <p class="brand-subtitle">Quarterly Nursing Report</p>
                <div class="header-meta">
                    <div class="meta-block">
                        <span class="meta-label">Quarter</span>
                        <span class="meta-value">${escapeHtml(quarterHeading)}</span>
                    </div>
                    <div class="meta-block">
                        <span class="meta-label">Coverage</span>
                        <span class="meta-value">${escapeHtml(coverageRange)}</span>
                    </div>
                    <div class="meta-block">
                        <span class="meta-label">Generated</span>
                        <span class="meta-value">${escapeHtml(generatedAt)}</span>
                    </div>
                </div>
            </header>
            <section class="content">
                <section class="metrics">
                    <div class="metric-card primary">
                        <span class="label">Consultations</span>
                        <span class="value">${formatNumber(quarter.consultations)}</span>
                        <p class="caption">Patient encounters recorded throughout the reporting period.</p>
                    </div>
                    <div class="metric-card">
                        <span class="label">Unique patients</span>
                        <span class="value">${formatNumber(quarter.uniquePatients)}</span>
                        <p class="caption">Individuals who visited the clinic at least once.</p>
                    </div>
                    <div class="metric-card">
                        <span class="label">Students</span>
                        <span class="value">${formatNumber(studentCount)}</span>
                        <p class="caption">Consultations from the student population.</p>
                    </div>
                    <div class="metric-card">
                        <span class="label">Employees</span>
                        <span class="value">${formatNumber(employeeCount)}</span>
                        <p class="caption">Consultations from faculty and staff.</p>
                    </div>
                    <div class="metric-card">
                        <span class="label">Unspecified</span>
                        <span class="value">${formatNumber(unspecifiedCount)}</span>
                        <p class="caption">Encounters without an affiliation on record.</p>
                    </div>
                </section>
                <section>
                    <h2>Patient mix</h2>
                    <p class="section-summary">Distribution of consultations by patient affiliation.</p>
                    <table class="patient-mix">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Consultations</th>
                                <th>Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${patientMixTable}
                        </tbody>
                    </table>
                </section>
                <section>
                    <h2>Diagnosis insights</h2>
                    <p class="section-summary">Leading reasons for consultations during the quarter.</p>
                    <ul class="diagnosis-list">
                        ${diagnosesList}
                    </ul>
                </section>
            </section>
            <footer>
                Prepared automatically by the HNU Clinic reporting system for internal quality monitoring.
            </footer>
        </main>
    </body>
</html>`;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const yearParam = Number.parseInt(searchParams.get("year") ?? "", 10);
    const quarterParam = Number.parseInt(searchParams.get("quarter") ?? "", 10);

    const year = Number.isNaN(yearParam) ? undefined : yearParam;
    const quarter = Number.isNaN(quarterParam)
        ? undefined
        : QUARTERS.includes(quarterParam as (typeof QUARTERS)[number])
            ? (quarterParam as (typeof QUARTERS)[number])
            : undefined;

    let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

    try {
        const report = await getQuarterlyReports({ year, quarter });

        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath(),
            headless: true,
        });

        const page = await browser.newPage();
        const html = createReportHtml(report);
        await page.setContent(html, { waitUntil: "load" });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "12mm", right: "12mm" },
        });

        const filename = `nurse-quarterly-report-${report.year}-q${report.selectedQuarter.quarter}.pdf`;

        const pdfArrayBuffer = pdfBuffer instanceof ArrayBuffer
            ? pdfBuffer
            : pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);

        return new Response(pdfArrayBuffer as ArrayBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Failed to generate nurse report PDF", error);
        return NextResponse.json({ error: "Failed to generate report PDF" }, { status: 500 });
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
    }
}
