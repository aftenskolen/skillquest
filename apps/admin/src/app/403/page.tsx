export default function ForbudenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F8]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#1B3A5C]">403</h1>
        <p className="mt-2 text-gray-500">Du har ikke tilgang. Kun administratorer har tilgang til dette panelet.</p>
        <a href="/auth/logg-inn" className="mt-4 inline-block text-blue-600 hover:underline">
          Logg inn
        </a>
      </div>
    </main>
  );
}
