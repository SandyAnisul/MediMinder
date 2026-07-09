"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/contacts", label: "Contacts" },
  { href: "/sessions", label: "Sessions" },
  { href: "/medicines", label: "Medicines" },
  { href: "/adherence", label: "Adherence log" },
  { href: "/settings", label: "Settings" },
];

export default function PatientTabs({ patientId }: { patientId: string }) {
  const pathname = usePathname();
  const base = `/patients/${patientId}`;

  return (
    <nav className="mb-6 flex gap-1 border-b border-zinc-200">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              active
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
