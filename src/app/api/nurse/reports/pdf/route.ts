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

function renderQuarterRow(quarter: QuarterReport) {
    return `
        <tr>
            <td>${escapeHtml(quarter.label)}</td>
            <td>${formatDateRange(quarter.startDate, quarter.endDate)}</td>
            <td>${formatNumber(quarter.consultations)}</td>
            <td>${formatNumber(quarter.uniquePatients)}</td>
            <td>${formatNumber(quarter.patientTypeCounts.Student ?? 0)}</td>
            <td>${formatNumber(quarter.patientTypeCounts.Employee ?? 0)}</td>
            <td>${formatNumber(quarter.patientTypeCounts.Unknown ?? 0)}</td>
        </tr>
    `;
}

function renderDiagnosisList(diagnoses: QuarterReport["diagnosisCounts"]) {
    if (!diagnoses.length) {
        return "<li>No diagnoses recorded.</li>";
    }

    return diagnoses
        .map((item) => {
            return `<li><span>${escapeHtml(item.diagnosis)}</span> <strong>${formatNumber(
                item.count
            )}</strong></li>`;
        })
        .join("\n");
}

function renderYearlyDiagnosisList(diagnoses: ReportsResponse["yearlyTopDiagnoses"]) {
    if (!diagnoses.length) {
        return "<li>No diagnoses recorded for the year.</li>";
    }

    return diagnoses
        .map((item, index) => {
            return `<li><span>${index + 1}. ${escapeHtml(item.diagnosis)}</span> <strong>${formatNumber(
                item.count
            )}</strong></li>`;
        })
        .join("\n");
}

function createReportHtml(report: ReportsResponse) {
    const generatedAt = new Intl.DateTimeFormat("en-PH", {
        dateStyle: "full",
        timeStyle: "short",
    }).format(new Date());

    const quarterRows = report.quarters.map(renderQuarterRow).join("\n");
    const selectedQuarterDiagnoses = renderDiagnosisList(report.selectedQuarter.diagnosisCounts);
    const yearlyTopDiagnoses = renderYearlyDiagnosisList(report.yearlyTopDiagnoses);

    return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <title>Quarterly Nurse Report</title>
                <style>
                    * {
                        box-sizing: border-box;
                        font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                    }
                    body {
                        margin: 0;
                        padding: 32px;
                        color: #052e16;
                        background: #f8fafc;
                        font-size: 14px;
                    }
                    header {
                        border-bottom: 2px solid #bbf7d0;
                        padding-bottom: 16px;
                        margin-bottom: 24px;
                    }
                    h1 {
                        margin: 0;
                        font-size: 28px;
                        color: #166534;
                    }
                    h2 {
                        font-size: 20px;
                        margin-top: 32px;
                        color: #14532d;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 12px;
                    }
                    th, td {
                        border: 1px solid #d1fae5;
                        padding: 8px 10px;
                        text-align: left;
                    }
                    th {
                        background: #ecfdf5;
                        color: #065f46;
                        font-weight: 600;
                    }
                    .summary {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 16px;
                    }
                    .summary-card {
                        background: #ecfdf5;
                        border: 1px solid #bbf7d0;
                        border-radius: 12px;
                        padding: 16px;
                    }
                    .summary-card h3 {
                        margin: 0 0 8px;
                        font-size: 16px;
                        color: #047857;
                    }
                    ul {
                        list-style: none;
                        padding: 0;
                        margin: 12px 0 0;
                    }
                    ul li {
                        display: flex;
                        justify-content: space-between;
                        padding: 6px 8px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    ul li strong {
                        color: #14532d;
                    }
                    footer {
                        margin-top: 40px;
                        padding-top: 12px;
                        font-size: 12px;
                        color: #475569;
                        border-top: 1px solid #e2e8f0;
                    }
                </style>
            </head>
            <body>
                <header>
                    <h1>Quarterly Nurse Report – ${report.year}</h1>
                    <p>Generated for quarter ${escapeHtml(
                        report.selectedQuarter.label
                    )} on ${escapeHtml(generatedAt)}</p>
                </header>
                <section class="summary">
                    <div class="summary-card">
                        <h3>Quarter consultations</h3>
                        <p><strong>${formatNumber(
                            report.selectedQuarter.consultations
                        )}</strong> consultations recorded.</p>
                    </div>
                    <div class="summary-card">
                        <h3>Unique patients</h3>
                        <p><strong>${formatNumber(
                            report.selectedQuarter.uniquePatients
                        )}</strong> patients cared for.</p>
                    </div>
                    <div class="summary-card">
                        <h3>Year totals</h3>
                        <p><strong>${formatNumber(report.totals.consultations)}</strong> consultations • <strong>${formatNumber(
                            report.totals.uniquePatients
                        )}</strong> patients.</p>
                    </div>
                </section>

                <h2>Quarter breakdown</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Quarter</th>
                            <th>Coverage</th>
                            <th>Consultations</th>
                            <th>Unique patients</th>
                            <th>Students</th>
                            <th>Employees</th>
                            <th>Unspecified</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quarterRows}
                    </tbody>
                </table>

                <h2>${escapeHtml(report.selectedQuarter.label)} diagnoses</h2>
                <ul>
                    ${selectedQuarterDiagnoses}
                </ul>

                <h2>Top diagnoses this year</h2>
                <ul>
                    ${yearlyTopDiagnoses}
                </ul>

                <footer>
                    Generated by the HNU Clinic reporting system using Puppeteer and headless Chromium.
                </footer>
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
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
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

        return new NextResponse(pdfBuffer, {
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
            await browser.close().catch(() => {
                /* ignore */
            });
        }
    }
}

