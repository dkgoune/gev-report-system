"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  {
    href: "/reports/incidents",
    label: "Vue d'ensemble",
    match: "exact",
  },
  {
    href: "/reports/incidents/templates",
    label: "Modeles",
  },
  {
    href: "/reports/incidents/bindings",
    label: "Liaisons",
    match: "exact",
  },
];

export function IncidentSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Sections incidents">
      {SECTIONS.map(section => {
        const isActive =
          section.match === "exact"
            ? pathname === section.href
            : pathname.startsWith(`${section.href}/`);

        return (
          <Link
            key={section.href}
            href={section.href}
            className={
              isActive
                ? "inline-flex border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                : "inline-flex border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
            }
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
