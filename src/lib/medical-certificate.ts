import {
  MEDICAL_HISTORY_OPTIONS,
  hasMedicalCondition,
  type MedicalHistoryValue,
} from "@/lib/medical-history";

export type CertificateContext = {
  certificateId: string;
  issueDate: Date;
  validUntil: Date;
  issueDateDisplay: string;
  patientName: string;
  patientType: string;
  age: string;
  sex: string;
  address: string;
  program: string;
  department: string;
  yearLevel: string;
  clinicName: string;
  consultationDate: string;
  diagnosis: string;
  findings: string;
  reason: string;
  allergies: string[];
  medicalHistory: MedicalHistoryValue;
  doctorName: string;
  doctorTitle: string;
  licenseNumber: string;
  ptrNumber: string;
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function humanizeEnum(value: string | null | undefined) {
  if (!value) return "";
  return value
    .split("_")
    .map((segment) =>
      segment.length <= 3 && segment === segment.toUpperCase()
        ? segment
        : segment.charAt(0) + segment.slice(1).toLowerCase()
    )
    .join(" ");
}

export function computeAge(dateOfBirth?: Date | null, now: Date = new Date()) {
  if (!dateOfBirth) return "";
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "";

  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? String(age) : "";
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80) || "certificate";
}

export function buildConditionList(rawConditions?: string | null) {
  if (!rawConditions) {
    return [] as string[];
  }
  return rawConditions
    .split(/[,;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function renderCertificateHtml(context: CertificateContext) {
  const placeholder = (value?: string, fallback = "Not recorded") => {
    if (value && value.trim()) {
      return escapeHtml(value);
    }

    if (fallback === "Not recorded") {
      return "&nbsp;";
    }

    return `<span class="placeholder">${escapeHtml(fallback)}</span>`;
  };

  const credentialValue = (value?: string) => {
    if (value && value.trim()) {
      return escapeHtml(value);
    }
    return "&nbsp;";
  };

  const heading = "MEDICAL CERTIFICATE";

  const introLine = `This is to certify that <strong>${escapeHtml(
    context.patientName
  )}</strong>, a student of Holy Name University, was examined at the Holy Name University College Clinic.`;

  const renderCheckbox = (label: string, checked: boolean) => `
        <div class="checkbox${checked ? " checked" : ""}">
          <span class="box" aria-hidden="true"></span>
          <span class="text">${escapeHtml(label)}</span>
        </div>
    `;

  const medicalHistoryBoxes = MEDICAL_HISTORY_OPTIONS.map((option) =>
    renderCheckbox(option, hasMedicalCondition(context.medicalHistory, option))
  ).join("");

  const remainingMedical = context.medicalHistory.other?.trim() ?? "";

  const allergiesList = context.allergies
    .map((value) => titleCase(value))
    .join(", ");

  const impression = placeholder(context.diagnosis, "Not recorded");
  const recommendation = placeholder(
    context.findings,
    "No medical recommendations were provided."
  );

  const noteParts: string[] = [];
  if (context.reason) {
    noteParts.push(`Reason for visit: ${context.reason}.`);
  }
  noteParts.push(`Consultation recorded on ${context.consultationDate}.`);
  const notes = placeholder(
    noteParts.map((entry) => entry.trim()).join(" "),
    "No additional notes were recorded."
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(heading)}</title>
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: "Times New Roman", "Georgia", serif;
        background: #ffffff;
        color: #111827;
      }

      main {
        width: 8.27in;
        min-height: 11in;
        margin: 0 auto;
        padding: 0.32in 0.4in;
        display: flex;
        flex-direction: column;
      }

      main.medical .field-line .field-label::before {
        content: "☐";
        margin-right: 4px;
        font-size: 11px;
      }

      header {
        text-align: center;
        margin-bottom: 6px;
      }

      .institution {
        font-size: 16px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .department {
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .address {
        font-size: 13px;
        margin-top: 2px;
      }

      h1 {
        font-size: 22px;
        margin: 8px 0 0;
        letter-spacing: 0.16em;
      }

      .date-line {
        font-size: 13.5px;
        display: flex;
        justify-content: flex-end;
        margin-bottom: 8px;
        gap: 6px;
      }

      .underline {
        border-bottom: 1px solid #111827;
        padding: 0 6px 2px;
        min-width: 110px;
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        min-height: 16px;
      }

      .placeholder {
        font-style: italic;
        color: #6b7280;
      }

      section {
        margin-bottom: 8px;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
      }

      .field-line {
        display: flex;
        align-items: flex-start;
        gap: 5px;
        font-size: 12.8px;
        margin-bottom: 2px;
        flex-wrap: wrap;
      }

      .field-label {
        flex: 0 0 115px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 10.8px;
      }

      .field-line .underline {
        flex: 1 1 auto;
      }

      .field-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
        gap: 3px 10px;
      }

      .field-grid .field-line {
        margin-bottom: 0;
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 6px 10px;
      }

      .checkbox {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
      }

      .checkbox .box {
        width: 16px;
        height: 16px;
        border: 1px solid #111827;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        position: relative;
      }

      .checkbox.checked .box {
        background: #111827;
        color: #50C878;
      }

      .checkbox.checked .box::after {
        content: "🗹";
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        line-height: 1;
      }

      .statement {
        margin: 12px 0 20px;
        font-size: 13px;
        line-height: 1.5;
        text-align: justify;
        text-justify: inter-word;
      }

      .signature-block {
        display: flex;
        justify-content: flex-end;
        margin-top: 24px;
      }

      .signature {
        text-align: center;
        font-size: 11.8px;
        min-width: 190px;
      }

      .signature .line {
        border-bottom: 1px solid #111827;
        margin-bottom: 4px;
        padding-bottom: 3px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .signature .credentials {
        margin-top: 6px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 3px 12px;
        justify-items: start;
      }

      .signature .credential {
        text-align: left;
        font-size: 10.8px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .signature .credential .label {
        font-weight: 600;
        letter-spacing: 0.04em;
      }

      .signature .credential .underline {
        min-width: 130px;
      }

      footer {
        margin-top: auto;
        font-size: 10.8px;
        color: #374151;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      footer .certificate-id {
        font-family: "Courier New", monospace;
        letter-spacing: 0.08em;
      }
    </style>
  </head>
  <body>
    <main class="certificate medical">
      <header>
        <div class="institution">Holy Name University</div>
        <div class="department">Health Services Department</div>
        <div class="address">Tagbilaran City, Bohol</div>
        <h1>${escapeHtml(heading)}</h1>
      </header>

      <div class="date-line">
        <span>Date:</span>
        <span class="underline">${escapeHtml(context.issueDateDisplay)}</span>
      </div>

      <section class="patient-info">
        <div class="section-title">Patient Information</div>
        <div class="field-line">
          <span class="field-label">Name</span>
          <span class="underline">${placeholder(context.patientName)}</span>
        </div>
        <div class="field-line">
          <span class="field-label">Address</span>
          <span class="underline">${placeholder(context.address, "Not provided")}</span>
        </div>
        <div class="field-grid">
          <div class="field-line">
            <span class="field-label">Age</span>
            <span class="underline">${placeholder(context.age, "Not provided")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Sex</span>
            <span class="underline">${placeholder(context.sex, "Not provided")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Program</span>
            <span class="underline">${placeholder(context.program, "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Year Level</span>
            <span class="underline">${placeholder(context.yearLevel, "Not recorded")}</span>
          </div>
        </div>
      </section>

      <section>
        <div class="section-title">Vital Signs</div>
        <div class="field-grid">
          <div class="field-line">
            <span class="field-label">BP</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">HR</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">RR</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Temp</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Weight</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Height</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">SpO₂</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Clinic</span>
            <span class="underline">${placeholder(context.clinicName)}</span>
          </div>
        </div>
      </section>

      <section>
        <div class="section-title">Medical History</div>
        <div class="checkbox-grid">
          ${medicalHistoryBoxes}
        </div>
        <div class="field-line">
          <span class="field-label">Others</span>
          <span class="underline">${placeholder(remainingMedical)}</span>
        </div>
      </section>

      <section>
        <div class="section-title">COVID-19 Vaccination</div>
        <div class="field-line">
          <span class="field-label">Vaccine</span>
          <span class="underline">${placeholder("", "Not recorded")}</span>
        </div>
        <div class="field-grid">
          <div class="field-line">
            <span class="field-label">Dose 1</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">Dose 2</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">1st Booster</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
          <div class="field-line">
            <span class="field-label">2nd Booster</span>
            <span class="underline">${placeholder("", "Not recorded")}</span>
          </div>
        </div>
      </section>

      <section>
        <div class="section-title">Allergies</div>
        <div class="field-line">
          <span class="field-label">Food / Drug</span>
          <span class="underline">${placeholder(
    allergiesList,
    "No allergies declared"
  )}</span>
        </div>
      </section>

      <section>
        <div class="section-title">Clinical Impression</div>
        <div class="field-line">
          <span class="field-label">Impression</span>
          <span class="underline">${impression}</span>
        </div>
        <div class="field-line">
          <span class="field-label">Recommendation</span>
          <span class="underline">${recommendation}</span>
        </div>
        <div class="field-line notes">
          <span class="field-label">Notes</span>
          <span class="underline">${notes}</span>
        </div>
      </section>

      <p class="statement">${introLine}</p>

      <div class="signature-block">
        <div class="signature">
          <div class="line">${escapeHtml(context.doctorName)}</div>
          <div>${escapeHtml(context.doctorTitle)}</div>
          <div class="credentials">
            <div class="credential">
              <span class="label">License No.</span>
              <span class="underline">${credentialValue(context.licenseNumber)}</span>
            </div>
            <div class="credential">
              <span class="label">PTR No.</span>
              <span class="underline">${credentialValue(context.ptrNumber)}</span>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div>Valid until: ${escapeHtml(formatDateLong(context.validUntil))}</div>
        <div class="certificate-id">Certificate ID: ${escapeHtml(
    context.certificateId
  )}</div>
        <div>
          This certificate is issued for any school-related activity and is valid for one (1) year from the date of issuance.
        </div>
      </footer>
    </main>
  </body>
</html>`;
}

