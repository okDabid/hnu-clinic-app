"use client";

import { Bell, CalendarDays, Home, User } from "lucide-react";

import {
    PanelLayout,
    type PanelLayoutContentProps,
    type PanelNavItem,
} from "@/components/panel/panel-layout";

const NAV_ITEMS = [
    { href: "/patient", label: "Dashboard", icon: Home },
    { href: "/patient/account", label: "Account", icon: User },
    { href: "/patient/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/patient/notification", label: "Notifications", icon: Bell },
] as const satisfies readonly PanelNavItem[];

export type PatientLayoutProps = PanelLayoutContentProps;

export function PatientLayout(props: PatientLayoutProps) {
    return (
        <PanelLayout
            {...props}
            navItems={NAV_ITEMS}
            panelLabel="Patient Panel"
            defaultName="Patient"
            homeHref="/patient"
            sheetAriaLabel="Open patient navigation"
            sheetTitle="Patient Navigation"
            fallbackInitials="PT"
        />
    );
}

export default PatientLayout;
