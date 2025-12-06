import { describe, expect, it } from "bun:test";

import { resolveValidMedicalHistory } from "../src/app/api/doctor/appointments/[id]/certificate/medical-history";
import { hasMedicalCondition } from "../src/lib/medical-history";
import type { CertificateContext } from "../src/lib/medical-certificate";
import { renderCertificateHtml } from "../src/lib/medical-certificate";

describe("certificate generation", () => {
  it("marks recorded medical history options when present", () => {
    const medicalHistory = resolveValidMedicalHistory(["Asthma"]);

    const context: CertificateContext = {
      certificateId: "CERT-123",
      certificateType: "medical",
      issueDate: new Date("2024-01-01T00:00:00Z"),
      validUntil: new Date("2025-01-01T00:00:00Z"),
      issueDateDisplay: "January 1, 2024",
      patientName: "Test Patient",
      patientType: "Student",
      age: "20",
      sex: "Female",
      address: "123 Main St",
      program: "Nursing",
      department: "Health Sciences",
      yearLevel: "3rd Year",
      clinicName: "College Clinic",
      consultationDate: "January 1, 2024 08:00 AM",
      diagnosis: "Minor cold",
      findings: "Rest recommended",
      reason: "Checkup",
      allergies: [],
      medicalHistory,
      doctorName: "Dr. Smith",
      doctorTitle: "Attending Physician",
      licenseNumber: "",
      ptrNumber: "",
    };

    const html = renderCertificateHtml(context);

    expect(medicalHistory.conditions).toEqual(["Asthma"]);
    expect(hasMedicalCondition(context.medicalHistory, "Asthma")).toBe(true);
    expect(html).toMatch(/checkbox checked[\s\S]*<span class="text">Asthma<\/span>/);
  });
});
