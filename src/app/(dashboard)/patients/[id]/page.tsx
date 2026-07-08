// Tabbed patient detail — Overview / Contacts / Sessions / Medicines / Adherence log / Settings.
// Built in Part D Step 4.
export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <main className="p-6">Patient {id}</main>;
}
