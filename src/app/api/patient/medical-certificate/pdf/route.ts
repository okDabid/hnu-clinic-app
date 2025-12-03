import chromium from "@sparticuz/chromium";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

import { renderCertificateHtml, slugify } from "@/lib/medical-certificate";
import { resolvePatientCertificate } from "../certificate-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const result = await resolvePatientCertificate();

    if (result === null) {
        return NextResponse.json({ error: "No certificate available." }, { status: 404 });
    }

    if (result instanceof NextResponse) {
        return result;
    }

    const { context, patientName, isLocal } = result;
    const html = renderCertificateHtml(context);

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1280, height: 720 },
        executablePath: isLocal
            ? process.platform === "win32"
                ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : await chromium.executablePath(),
        headless: true,
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "networkidle0" });
        await page.emulateMediaType("print");
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "0.4in",
                bottom: "0.5in",
                left: "0.5in",
                right: "0.5in",
            },
        });

        const pdfArrayBuffer =
            pdfBuffer instanceof ArrayBuffer
                ? pdfBuffer
                : pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength);

        const filename = `medical-certificate-${slugify(patientName)}.pdf`;

        return new Response(pdfArrayBuffer as ArrayBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline;  filename="${filename}"`,
                "Cache-Control": "no-store",
            },
        });
    } finally {
        await browser.close();
    }
}

