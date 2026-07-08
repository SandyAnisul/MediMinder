import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TABS = [
  { href: "", label: "Overview" },
  { href: "/contacts", label: "Contacts" },
  { href: "/sessions", label: "Sessions" },
  { href: "/medicines", label: "Medicines" },
  { href: "/adherence", label: "Adherence log" },
  { href: "/settings", label: "Settings" },
];

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!patient) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <Link href="/patients" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← Patients
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">{patient.name}</h1>
      </div>

      <nav className="mb-6 flex gap-1 border-b border-zinc-200">
        {TABS.map((tab) => (
          <Link
            key={tab.label}
            href={`/patients/${id}${tab.href}`}
            className="rounded-t-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
