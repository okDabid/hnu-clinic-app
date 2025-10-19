import { NextRequest, NextResponse } from "next/server";

import {
    generateNurseQuarterlyReport,
    NURSE_QUARTER_LABELS,
    type QuarterNumber,
    type QuarterReport,
    type ReportsResponse,
} from "@/lib/reports/nurse-quarterly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseQuarter(value: string | null): QuarterNumber | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || !NURSE_QUARTER_LABELS[parsed as QuarterNumber]
        ? undefined
        : (parsed as QuarterNumber);
}

function parseYear(value: string | null): number | undefined {
    if (!value) return undefined;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function escapeHtml(value: string) {
    return value.replace(/[&<>\"']/g, (char) => {
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

const numberFormatter = new Intl.NumberFormat("en-PH");
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
});

function formatRange(start: string, end: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    return `${dateFormatter.format(startDate)} – ${dateFormatter.format(endDate)}`;
}

function buildQuarterSummary(report: ReportsResponse, quarter: QuarterReport) {
    const patientTypeRows = Object.entries(quarter.patientTypeCounts)
        .map(([type, count]) => {
            const label = type === "Unknown" ? "Unspecified" : type;
            return `<tr><td>${escapeHtml(label)}</td><td>${numberFormatter.format(count)}</td></tr>`;
        })
        .join("");

    const quarterDiagnoses =
        quarter.diagnosisCounts
            .slice(0, 8)
            .map(
                (item) =>
                    `<li><span class="label">${escapeHtml(item.diagnosis)}</span><span>${numberFormatter.format(item.count)}</span></li>`
            )
            .join("") || '<li><span class="label">No diagnoses recorded</span><span>0</span></li>';

    const yearlyDiagnoses =
        report.yearlyTopDiagnoses
            .map(
                (item) =>
                    `<li><span class="label">${escapeHtml(item.diagnosis)}</span><span>${numberFormatter.format(item.count)}</span></li>`
            )
            .join("") || '<li><span class="label">No diagnoses recorded</span><span>0</span></li>';

    const quarterRows = report.quarters
        .map((item) => {
            return `<tr>
                <td>${escapeHtml(item.label)} ${report.year}</td>
                <td>${numberFormatter.format(item.consultations)}</td>
                <td>${numberFormatter.format(item.uniquePatients)}</td>
                <td>${numberFormatter.format(item.patientTypeCounts.Student ?? 0)}</td>
                <td>${numberFormatter.format(item.patientTypeCounts.Employee ?? 0)}</td>
                <td>${numberFormatter.format(item.patientTypeCounts.Unknown ?? 0)}</td>
            </tr>`;
        })
        .join("");

    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charSet="utf-8" />
        <title>Nurse quarterly report</title>
        <style>
            :root {
                color-scheme: light;
                font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
                line-height: 1.5;
                font-size: 12px;
            }

            body {
                margin: 0;
                padding: 32px;
                color: #0f172a;
                background-color: #ffffff;
            }

            h1, h2, h3 {
                margin: 0 0 8px 0;
                font-weight: 600;
                color: #0f766e;
            }

            h1 {
                font-size: 24px;
            }

            h2 {
                font-size: 18px;
            }

            p {
                margin: 0 0 12px 0;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e2e8f0;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                padding: 6px 12px;
                border-radius: 9999px;
                background: #ccfbf1;
                color: #0f766e;
                font-weight: 600;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.06em;
            }

            .metrics {
                display: grid;
                gap: 16px;
                grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                margin-bottom: 24px;
            }

            .metric-card {
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 16px;
                background: #f8fafc;
            }

            .metric-card strong {
                display: block;
                font-size: 28px;
                color: #0f172a;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 24px;
            }

            th, td {
                padding: 10px;
                border: 1px solid #e2e8f0;
                text-align: left;
            }

            th {
                background: #ecfdf5;
                color: #0f766e;
                font-weight: 600;
            }

            .list-card {
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 16px;
                margin-bottom: 24px;
            }

            .list-card ul {
                list-style: none;
                padding: 0;
                margin: 0;
                display: grid;
                gap: 8px;
            }

            .list-card li {
                display: flex;
                justify-content: space-between;
                gap: 8px;
                padding: 8px 0;
                border-bottom: 1px solid #f1f5f9;
            }

            .list-card li:last-child {
                border-bottom: none;
            }

            .list-card .label {
                font-weight: 600;
                color: #0f172a;
            }

            footer {
                margin-top: 32px;
                font-size: 11px;
                color: #475569;
            }
        </style>
    </head>
    <body>
        <header class="header">
            <div>
                <h1>Nurse quarterly report</h1>
                <p><strong>${escapeHtml(quarter.label)} ${report.year}</strong> • ${formatRange(
        quarter.startDate,
        quarter.endDate
    )}</p>
                <p>Generated on ${dateFormatter.format(new Date())}</p>
            </div>
            <div class="badge">Compliance ready</div>
        </header>

        <section class="metrics">
            <div class="metric-card">
                <span>Total consultations</span>
                <strong>${numberFormatter.format(quarter.consultations)}</strong>
                <p>Documented during ${escapeHtml(quarter.label)} ${report.year}.</p>
            </div>
            <div class="metric-card">
                <span>Unique patients</span>
                <strong>${numberFormatter.format(quarter.uniquePatients)}</strong>
                <p>Students and employees who visited during the quarter.</p>
            </div>
            <div class="metric-card">
                <span>Year-to-date consultations</span>
                <strong>${numberFormatter.format(report.totals.consultations)}</strong>
                <p>All consultations recorded for ${report.year}.</p>
            </div>
            <div class="metric-card">
                <span>Year-to-date unique patients</span>
                <strong>${numberFormatter.format(report.totals.uniquePatients)}</strong>
                <p>Distinct patients served since January 1.</p>
            </div>
        </section>

        <section class="list-card">
            <h2>Patient mix</h2>
            <p>Breakdown of patient types for the selected quarter.</p>
            <table>
                <thead>
                    <tr>
                        <th>Patient type</th>
                        <th>Visits</th>
                    </tr>
                </thead>
                <tbody>${patientTypeRows}</tbody>
            </table>
        </section>

        <section class="list-card">
            <h2>Top diagnoses this quarter</h2>
            <ul>${quarterDiagnoses}</ul>
        </section>

        <section class="list-card">
            <h2>Top diagnoses year-to-date</h2>
            <ul>${yearlyDiagnoses}</ul>
        </section>

        <section class="list-card">
            <h2>Quarterly trend comparison</h2>
            <p>How visits and unique patients shifted across the year.</p>
            <table>
                <thead>
                    <tr>
                        <th>Quarter</th>
                        <th>Consultations</th>
                        <th>Unique patients</th>
                        <th>Students</th>
                        <th>Employees</th>
                        <th>Unspecified</th>
                    </tr>
                </thead>
                <tbody>${quarterRows}</tbody>
            </table>
        </section>

        <footer>
            Prepared automatically by the Holy Name University Clinic system to support compliance and planning discussions.
        </footer>
    </body>
</html>`;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const year = parseYear(searchParams.get("year"));
    const quarter = parseQuarter(searchParams.get("quarter"));

    type Puppeteer = typeof import("puppeteer");
    type Browser = Awaited<ReturnType<Puppeteer["launch"]>>;

    let browser: Browser | null = null;

    try {
        const report = await generateNurseQuarterlyReport({
            year,
            quarter,
        });

        const exportQuarter =
            report.quarters.find((item) => item.quarter === (quarter ?? report.selectedQuarter.quarter)) ??
            report.selectedQuarter;

        const html = buildQuarterSummary(report, exportQuarter);

        const puppeteer = await import("puppeteer");
        const launchOptions: Parameters<Puppeteer["launch"]>[0] = {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: "new",
        };

        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "16mm", right: "16mm" },
        });

        const filename = `nurse-quarterly-report-${report.year}-q${exportQuarter.quarter}.pdf`;

        return new NextResponse(pdf, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("[GET /api/nurse/reports/export]", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Failed to export quarterly report" },
            { status: 500 }
        );
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (error) {
                console.error("[GET /api/nurse/reports/export] close", error);
            }
        }
    }
}
