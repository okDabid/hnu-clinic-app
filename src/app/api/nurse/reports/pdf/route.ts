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
        timeZone: "Asia/Manila",
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
                color-scheme: light;
            }

            * {
                box-sizing: border-box;
                font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            body {
                margin: 0;
                padding: 32px 16px;
                background: #f5f7fb;
                color: #0f172a;
            }

            main {
                max-width: 960px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
                overflow: hidden;
            }

            .header-accent {
                height: 6px;
                background: linear-gradient(90deg, #22c55e, #0ea5e9);
            }

            header {
                padding: 40px 48px 32px;
                background: #ffffff;
            }

            .brand-title {
                font-size: 26px;
                font-weight: 700;
                margin: 0;
                color: #0f172a;
            }

            .brand-subtitle {
                margin-top: 6px;
                font-size: 16px;
                color: #475569;
            }

            .header-meta {
                margin-top: 24px;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 16px;
            }

            .meta-block {
                padding: 14px 16px;
                border-radius: 14px;
                border: 1px solid #e2e8f0;
                background: #f8fafc;
            }

            .meta-label {
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #64748b;
                margin-bottom: 6px;
            }

            .meta-value {
                font-size: 15px;
                font-weight: 600;
                color: #0f172a;
            }

            .content {
                padding: 40px 48px 48px;
                background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
                display: flex;
                flex-direction: column;
                gap: 32px;
            }

            h2 {
                margin: 0;
                font-size: 19px;
                color: #0f172a;
            }

            .section-summary {
                margin: 6px 0 0;
                color: #64748b;
                font-size: 14px;
            }

            .metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }

            .metric-card {
                padding: 20px;
                border-radius: 16px;
                border: 1px solid #e2e8f0;
                background: #ffffff;
                box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
            }

            .metric-card.emphasis {
                border-color: rgba(34, 197, 94, 0.35);
                background: linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(14, 165, 233, 0.12));
            }

            .metric-card .label {
                display: block;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #64748b;
                margin-bottom: 8px;
            }

            .metric-card .value {
                font-size: 26px;
                font-weight: 700;
                color: #0f172a;
            }

            .metric-card .caption {
                margin-top: 12px;
                font-size: 13px;
                color: #475569;
                line-height: 1.5;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 16px;
                font-size: 14px;
            }

            thead th {
                text-align: left;
                padding: 12px 14px;
                background: #ecfdf5;
                color: #047857;
                font-weight: 600;
                border-bottom: 1px solid #bbf7d0;
            }

            tbody td {
                padding: 12px 14px;
                border-bottom: 1px solid #e2e8f0;
            }

            tbody tr.total td {
                font-weight: 600;
                color: #0f172a;
                background: #f8fafc;
            }

            .diagnosis-list {
                list-style: none;
                padding: 0;
                margin: 16px 0 0;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                overflow: hidden;
                background: #ffffff;
            }

            .diagnosis-list li {
                display: flex;
                justify-content: space-between;
                gap: 16px;
                padding: 14px 18px;
                border-bottom: 1px solid #e2e8f0;
            }

            .diagnosis-list li:nth-child(even) {
                background: #f9fbff;
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
                padding: 24px 48px 32px;
                background: #ffffff;
                border-top: 1px solid #e2e8f0;
                font-size: 13px;
                color: #475569;
            }

            @media print {
                body {
                    background: #ffffff;
                    padding: 0;
                }

                main {
                    border: none;
                    box-shadow: none;
                    border-radius: 0;
                }

                header,
                .content,
                footer {
                    padding-left: 32px;
                    padding-right: 32px;
                }
            }
        </style>
    </head>
    <body>
        <main>
            <div class="header-accent"></div>
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
                        <span class="meta-label">Generated (PHT)</span>
                        <span class="meta-value">${escapeHtml(generatedAt)}</span>
                    </div>
                </div>
            </header>
            <section class="content">
                <section class="metrics">
                    <div class="metric-card emphasis">
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
