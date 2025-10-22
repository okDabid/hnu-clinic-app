"use client";

import { CalendarDays, Home, Pill, Search, User } from "lucide-react";

import {
    PanelLayout,
    type PanelLayoutContentProps,
    type PanelNavItem,
} from "@/components/panel/panel-layout";

const NAV_ITEMS = [
    { href: "/scholar", label: "Dashboard", icon: Home },
    { href: "/scholar/account", label: "Account", icon: User },
    { href: "/scholar/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/scholar/patients", label: "Patients", icon: Search },
    { href: "/scholar/dispense", label: "Dispense", icon: Pill },
] as const satisfies readonly PanelNavItem[];

export type ScholarLayoutProps = PanelLayoutContentProps;

export function ScholarLayout(props: ScholarLayoutProps) {
    return (
        <PanelLayout
            {...props}
            navItems={NAV_ITEMS}
            panelLabel="Scholar Panel"
            defaultName="Working Scholar"
            homeHref="/scholar"
            sheetAriaLabel="Open scholar navigation"
            sheetTitle="Scholar Navigation"
            fallbackInitials="WS"
        />
    );
}

export default ScholarLayout;
