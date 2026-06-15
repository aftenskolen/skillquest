import { LoginForm } from "@novolms/ui";
import { loggInnAction } from "./actions";

export default function LoggInnPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F8]">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Lærerportal</h1>
          <p className="mt-1 text-sm text-gray-500">Logg inn for å se dine klasser</p>
        </div>
        <LoginForm loggInnAction={loggInnAction} />
      </div>
    </main>
  );
}
