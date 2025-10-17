"use client";

import {
    CalendarDays,
    ClipboardList,
    Home,
    Pill,
    Stethoscope,
    User,
} from "lucide-react";

import {
    PanelLayout,
    type PanelLayoutContentProps,
    type PanelNavItem,
} from "@/components/panel/panel-layout";

const NAV_ITEMS = [
    { href: "/doctor", label: "Dashboard", icon: Home },
    { href: "/doctor/account", label: "Account", icon: User },
    { href: "/doctor/consultation", label: "Consultation", icon: Stethoscope },
    { href: "/doctor/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/doctor/dispense", label: "Dispensing", icon: Pill },
    { href: "/doctor/patients", label: "Patients", icon: ClipboardList },
] as const satisfies readonly PanelNavItem[];

export type DoctorLayoutProps = PanelLayoutContentProps;

function isDoctorNavActive(href: string, pathname: string) {
    if (href === "/doctor") {
        return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export function DoctorLayout(props: DoctorLayoutProps) {
    return (
        <PanelLayout
            {...props}
            navItems={NAV_ITEMS}
            panelLabel="Doctor Panel"
            defaultName="Doctor"
            homeHref="/doctor"
            sheetAriaLabel="Open doctor navigation"
            sheetTitle="Doctor Navigation"
            fallbackInitials="DR"
            isNavItemActive={isDoctorNavActive}
        />
    );
}

export default DoctorLayout;
