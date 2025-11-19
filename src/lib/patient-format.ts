import { formatManilaDateTime } from "@/lib/time";

type NullableString = string | null | undefined;

const BLOOD_TYPE_LABELS: Record<string, string> = {
    A_POS: "A+",
    A_NEG: "A-",
    B_POS: "B+",
    B_NEG: "B-",
    AB_POS: "AB+",
    AB_NEG: "AB-",
    O_POS: "O+",
    O_NEG: "O-",
};

const DEPARTMENT_LABELS: Record<string, string> = {
    EDUCATION: "College of Education",
    ARTS_AND_SCIENCES: "College of Arts and Sciences",
    BUSINESS_AND_ACCOUNTANCY: "College of Business and Accountancy",
    ENGINEERING_AND_COMPUTER_STUDIES: "College of Engineering and Computer Studies",
    HEALTH_SCIENCES: "College of Health Sciences",
    LAW: "College of Law",
    BASIC_EDUCATION: "Basic Education Department",
};

const YEAR_LEVEL_LABELS: Record<string, string> = {
    FIRST_YEAR: "1st Year",
    SECOND_YEAR: "2nd Year",
    THIRD_YEAR: "3rd Year",
    FOURTH_YEAR: "4th Year",
    FIFTH_YEAR: "5th Year",
    KINDERGARTEN_1: "Kindergarten 1",
    KINDERGARTEN_2: "Kindergarten 2",
    GRADE_1: "Grade 1",
    GRADE_2: "Grade 2",
    GRADE_3: "Grade 3",
    GRADE_4: "Grade 4",
    GRADE_5: "Grade 5",
    GRADE_6: "Grade 6",
    GRADE_7: "Grade 7",
    GRADE_8: "Grade 8",
    GRADE_9: "Grade 9",
    GRADE_10: "Grade 10",
    GRADE_11: "Grade 11",
    GRADE_12: "Grade 12",
};

const HUMANIZE_PATTERN = /^[A-Z0-9_]+$/;

export function humanizeEnumValue(value: NullableString) {
    if (!value) return "—";
    if (!HUMANIZE_PATTERN.test(value)) return value;

    return value
        .toLowerCase()
        .split("_")
        .map((word) => {
            if (word.length <= 3 && word === word.toUpperCase()) {
                return word.toUpperCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

export function formatDateOnly(value: NullableString) {
    if (!value) return "—";
    const formatted = formatManilaDateTime(value, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: undefined,
        minute: undefined,
    });

    return formatted || "—";
}

export function formatBloodType(value: NullableString) {
    if (!value) return "—";
    return BLOOD_TYPE_LABELS[value] ?? value;
}

export function formatDepartment(value: NullableString) {
    if (!value) return "—";
    return DEPARTMENT_LABELS[value] ?? humanizeEnumValue(value);
}

export function formatProgram(value: NullableString) {
    if (!value) return "—";
    if (DEPARTMENT_LABELS[value]) return DEPARTMENT_LABELS[value];
    return HUMANIZE_PATTERN.test(value) ? humanizeEnumValue(value) : value;
}

export function formatYearLevel(value: NullableString) {
    if (!value) return "—";
    return YEAR_LEVEL_LABELS[value] ?? humanizeEnumValue(value);
}

export function formatStaffName(staff?: { fullName: NullableString; username?: NullableString } | null) {
    if (!staff) return "—";
    return staff.fullName || staff.username || "—";
}

type AppointmentLike = {
    timestart: NullableString;
    timeend?: NullableString;
};

export function formatAppointmentWindow(appointment: AppointmentLike | null | undefined) {
    if (!appointment?.timestart) return "—";

    const start = formatManilaDateTime(appointment.timestart);
    const end = appointment.timeend
        ? formatManilaDateTime(appointment.timeend, {
              year: undefined,
              month: undefined,
              day: undefined,
          })
        : null;

    if (start && end) {
        return `${start} – ${end}`;
    }

    return start || "—";
}

export const PATIENT_STATUS_CLASSES: Record<string, string> = {
    active: "border-emerald-200 bg-emerald-50 text-emerald-700",
    inactive: "border-slate-200 bg-slate-100 text-slate-700",
};

