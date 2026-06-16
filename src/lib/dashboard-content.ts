import {
    BarChart3,
    Bell,
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    Clock4,
    FileSpreadsheet,
    FileText,
    NotebookPen,
    Package,
    Pill,
    Stethoscope,
    User,
    UserCog,
    Users,
    Users2,
} from "lucide-react";

export const patientDashboardContent = {
    quickActions: [
        {
            title: "Manage your profile",
            description:
                "Review and update your contact details, academic information, and emergency contacts in one place.",
            href: "/patient/account",
            icon: User,
            cta: "Review account",
        },
        {
            title: "Book a consultation",
            description:
                "Check available clinics, select a physician or dentist, and send your appointment request instantly.",
            href: "/patient/appointments",
            icon: CalendarDays,
            cta: "Plan visit",
        },
        {
            title: "View medical certificate status",
            description: "See your latest certificate status and expiry date as recorded by the clinic team.",
            href: "/patient/medical-certificate",
            icon: FileText,
            cta: "View certificate",
        },
        {
            title: "Follow clinic updates",
            description:
                "Track appointment changes, reminders, and announcements so you are always ready for your next visit.",
            href: "/patient/notification",
            icon: Bell,
            cta: "View notifications",
        },
    ],
    wellnessHighlights: [
        "Arrive 10 minutes early to allow time for screening and paperwork.",
        "Keep your emergency contact details up to date for faster coordination.",
        "Bring your student/employee ID whenever you have a scheduled visit.",
    ],
};

export const nurseDashboardContent = {
    quickActions: [
        {
            title: "Supervise inventory",
            description: "Monitor critical stock levels, log replenishments, and flag expiring supplies.",
            href: "/nurse/inventory",
            icon: Package,
            cta: "Review inventory",
        },
        {
            title: "Support patient records",
            description: "Update consultation notes, upload vitals, and prepare charts for the medical team.",
            href: "/nurse/records",
            icon: ClipboardCheck,
            cta: "View records",
        },
        {
            title: "Administer accounts",
            description: "Create new profiles, reset credentials, and keep access permissions current.",
            href: "/nurse/accounts",
            icon: Users,
            cta: "Manage accounts",
        },
    ],
};

export const doctorDashboardContent = {
    managementAreas: [
        {
            title: "Account management",
            description:
                "Update your profile, change credentials, and review administrative access details to stay compliant.",
            href: "/doctor/account",
            icon: UserCog,
            cta: "Review account",
        },
        {
            title: "Consultation hours",
            description:
                "Configure clinics, adjust availability, and publish upcoming consultation windows for students and staff.",
            href: "/doctor/consultation",
            icon: Clock4,
            cta: "Manage schedule",
        },
        {
            title: "Appointment oversight",
            description: "Approve requests, document visit outcomes, and coordinate reschedules with the clinic care team.",
            href: "/doctor/appointments",
            icon: CalendarDays,
            cta: "View appointments",
        },
        {
            title: "Medicine dispensing",
            description:
                "Record dispensed medicines, verify inventory balances, and ensure prescriptions are properly documented.",
            href: "/doctor/dispense",
            icon: Pill,
            cta: "Log dispense",
        },
        {
            title: "Patient insights",
            description: "Review patient records, access latest consultations, and prepare for follow-up care.",
            href: "/doctor/patients",
            icon: ClipboardList,
            cta: "Open registry",
        },
    ],
    operationalHighlights: [
        "Coordinate with the nursing team before updating consultation slots to prevent scheduling conflicts.",
        "All appointment adjustments notify the patient automatically—include clear notes for reschedules or cancellations.",
        "Document dispensed medicines within the same day to keep the inventory ledger accurate.",
    ],
};

export const scholarDashboardContent = {
    workflowHighlights: [
        {
            title: "Coordinate appointments",
            description:
                "Review upcoming visits, arrange queues, and update the board when there are walk-ins or cancellations.",
            href: "/scholar/appointments",
            icon: CalendarDays,
            cta: "Open appointment hub",
        },
        {
            title: "Assist patient intake",
            description: "Search student profiles, confirm eligibility, and share the latest notes with the nursing team.",
            href: "/scholar/patients",
            icon: Users2,
            cta: "View patient list",
        },
        {
            title: "Maintain scholar records",
            description: "Keep your contact and emergency details updated so the clinic can reach you during campus operations.",
            href: "/scholar/account",
            icon: ClipboardList,
            cta: "Manage account",
        },
    ] as const,
    coordinationInsights: [
        "Share status updates in the clinic chat when appointment queues change so the medical team can adjust their rounds.",
        "Keep intake forms organized before handoff—complete profiles help nurses and doctors focus on care instead of paperwork.",
    ],
    supportChecklist: [
        "Confirm the day’s appointment roster at least one hour before clinic opening.",
        "Log every walk-in case in the shared tracker so nurses can assign the next available slot.",
        "Escalate urgent symptoms directly to the nurse channel to alert the medical team immediately.",
    ],
    documentationTips: [
        {
            label: "Schedule walk-ins",
            description: "Document walk-in for visibility across the clinic.",
            href: "/scholar/appointments",
        },
        {
            label: "Sync patient information",
            description: "Verify program, year level, and contact details during intake.",
            href: "/scholar/patients",
        },
        {
            label: "Refresh personal records",
            description: "Review your profile and confirm that emergency contacts are current.",
            href: "/scholar/account",
        },
    ] as const,
    coordinationIcon: NotebookPen,
    checklistIcon: FileSpreadsheet,
    highlightIcon: BarChart3,
};

export const dashboardIconSet = {
    Stethoscope,
    NotebookPen,
    BarChart3,
};
