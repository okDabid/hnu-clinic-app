
import NurseForm from "./components/NurseForm";

export default function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold text-green-600 mb-6">
        Admin Dashboard
      </h1>

      <div className="max-w-2xl mx-auto">
        <NurseForm />
      </div>
    </main>
  );
}
