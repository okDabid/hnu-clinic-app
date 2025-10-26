type FontAlias = "regular" | "bold";

type PageCommand = string;

type PageDefinition = {
    width: number;
    height: number;
    commands: PageCommand[];
    contentObject: number;
    pageObject: number;
};

function escapePdfText(value: string) {
    return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function estimateCharWidth(fontSize: number) {
    return fontSize * 0.5;
}

export class PdfPage {
    constructor(private page: PageDefinition) { }

    getSize() {
        return { width: this.page.width, height: this.page.height };
    }

    drawText(text: string, x: number, y: number, font: FontAlias, size: number) {
        const escaped = escapePdfText(text);
        const fontRef = font === "bold" ? "F2" : "F1";
        this.page.commands.push(
            "BT",
            `/${fontRef} ${size.toFixed(2)} Tf`,
            `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
            `(${escaped}) Tj`,
            "ET",
        );
    }

    drawParagraph(text: string, x: number, y: number, font: FontAlias, size: number, maxWidth: number, lineHeight?: number) {
        const words = text.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let current = "";
        const estimatedCharWidth = estimateCharWidth(size);
        const maxChars = Math.max(1, Math.floor(maxWidth / estimatedCharWidth));

        for (const word of words) {
            const tentative = current ? `${current} ${word}` : word;
            if (tentative.length > maxChars) {
                if (current) {
                    lines.push(current);
                    current = word;
                } else {
                    lines.push(tentative);
                    current = "";
                }
            } else {
                current = tentative;
            }
        }

        if (current) {
            lines.push(current);
        }

        const actualLineHeight = lineHeight ?? size * 1.35;
        let offsetY = y;
        for (const line of lines) {
            this.drawText(line, x, offsetY, font, size);
            offsetY -= actualLineHeight;
        }

        return offsetY;
    }

    drawHorizontalRule(x: number, y: number, width: number, thickness = 1) {
        this.page.commands.push(
            `${thickness} w`,
            `${x.toFixed(2)} ${y.toFixed(2)} m`,
            `${(x + width).toFixed(2)} ${y.toFixed(2)} l`,
            "S",
        );
    }
}

export class SimplePdfDocument {
    private objects: string[] = [""];
    private pages: PageDefinition[] = [];
    private readonly regularFont: number;
    private readonly boldFont: number;

    constructor() {
        this.regularFont = this.addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
        this.boldFont = this.addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    }

    private addObject(content: string) {
        this.objects.push(content);
        return this.objects.length - 1;
    }

    private reserveObject() {
        this.objects.push("");
        return this.objects.length - 1;
    }

    private setObject(index: number, content: string) {
        this.objects[index] = content;
    }

    addPage(width: number, height: number) {
        const contentObject = this.reserveObject();
        const pageObject = this.reserveObject();
        const definition: PageDefinition = {
            width,
            height,
            commands: [],
            contentObject,
            pageObject,
        };
        this.pages.push(definition);
        return new PdfPage(definition);
    }

    private buildXref(output: string[], rootIndex: number) {
        const offsets: number[] = [];
        let position = 0;
        const encoder = new TextEncoder();

        const header = "%PDF-1.4\n";
        output.push(header);
        position += encoder.encode(header).length;

        for (let index = 1; index < this.objects.length; index++) {
            offsets[index] = position;
            const body = `${index} 0 obj\n${this.objects[index]}\nendobj\n`;
            output.push(body);
            position += encoder.encode(body).length;
        }

        const xrefStart = position;
        const xrefLines = ["xref", `0 ${this.objects.length}`, "0000000000 65535 f "];

        for (let index = 1; index < this.objects.length; index++) {
            const offset = offsets[index] ?? 0;
            xrefLines.push(`${offset.toString().padStart(10, "0")} 00000 n `);
        }

        const xrefSection = `${xrefLines.join("\n")}\n`;
        output.push(xrefSection);
        position += encoder.encode(xrefSection).length;

        const trailer = `trailer\n<< /Size ${this.objects.length} /Root ${rootIndex} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
        output.push(trailer);

        return output.join("");
    }

    async save() {
        const pagesKids: string[] = [];

        for (const page of this.pages) {
            const content = page.commands.join("\n");
            const length = new TextEncoder().encode(content).length;
            const stream = `<< /Length ${length} >>\nstream\n${content}\nendstream`;
            this.setObject(page.contentObject, stream);
            pagesKids.push(`${page.pageObject} 0 R`);
        }

        const pagesObject = this.addObject(`<< /Type /Pages /Count ${this.pages.length} /Kids [${pagesKids.join(" ")}] >>`);

        for (const page of this.pages) {
            const resources = `<< /Font << /F1 ${this.regularFont} 0 R /F2 ${this.boldFont} 0 R >> >>`;
            const pageDefinition = `<< /Type /Page /Parent ${pagesObject} 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources ${resources} /Contents ${page.contentObject} 0 R >>`;
            this.setObject(page.pageObject, pageDefinition);
        }

        const catalogObject = this.addObject(`<< /Type /Catalog /Pages ${pagesObject} 0 R >>`);

        const chunks: string[] = [];
        const documentString = this.buildXref(chunks, catalogObject);
        const encoder = new TextEncoder();
        return encoder.encode(documentString);
    }
}
