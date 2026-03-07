"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";

export function ConditionalHeader() {
    const pathname = usePathname();
    // Don't show the header on landing page or auth pages
    if (pathname === "/" || pathname === "/login") return null;
    return <Header />;
}
