import NewPatientForm from "./NewPatientForm";

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Add patient</h1>
      <NewPatientForm />
    </div>
  );
}
