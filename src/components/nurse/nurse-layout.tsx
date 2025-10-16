"use client";

import {
    CalendarCheck,
    ClipboardList,
    Home,
    Package,
    Pill,
    Users,
} from "lucide-react";

import {
    PanelLayout,
    type PanelLayoutContentProps,
    type PanelNavItem,
} from "@/components/panel/panel-layout";

const NAV_ITEMS = [
    { href: "/nurse", label: "Dashboard", icon: Home },
    { href: "/nurse/accounts", label: "Accounts", icon: Users },
    { href: "/nurse/clinic", label: "Clinic", icon: ClipboardList },
    { href: "/nurse/dispense", label: "Dispense", icon: Pill },
    { href: "/nurse/inventory", label: "Inventory", icon: Package },
    { href: "/nurse/records", label: "Records", icon: CalendarCheck },
] as const satisfies readonly PanelNavItem[];

export type NurseLayoutProps = PanelLayoutContentProps;

export function NurseLayout(props: NurseLayoutProps) {
    return (
        <PanelLayout
            {...props}
            navItems={NAV_ITEMS}
            panelLabel="Nurse Panel"
            defaultName="Nurse"
            homeHref="/nurse"
            sheetAriaLabel="Open nurse navigation"
            sheetTitle="Nurse Navigation"
            fallbackInitials="NR"
        />
    );
}

export default NurseLayout;
