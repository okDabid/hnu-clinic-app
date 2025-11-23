export type StaffProfile = {
    username?: string | null;
    fullName?: string | null;
    student?: { fname: string | null; mname: string | null; lname: string | null } | null;
    employee?: { fname: string | null; mname: string | null; lname: string | null } | null;
};

export function formatProfileName(staff?: StaffProfile | null) {
    if (!staff) return "—";

    const fromStudent = staff.student
        ? [staff.student.fname, staff.student.mname, staff.student.lname].filter(Boolean).join(" ")
        : "";

    if (fromStudent) return fromStudent;

    const fromEmployee = staff.employee
        ? [staff.employee.fname, staff.employee.mname, staff.employee.lname].filter(Boolean).join(" ")
        : "";

    if (fromEmployee) return fromEmployee;

    if (staff.fullName) return staff.fullName;

    return staff.username || "—";
}
