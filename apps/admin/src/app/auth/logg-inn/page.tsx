import { LoginForm } from "@skillquest/ui";
import { loggInnAction } from "./actions";

export default function LoggInnPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F8]">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-[#1B3A5C]">Admin – Logg inn</h1>
        <LoginForm loggInnAction={loggInnAction} registrerUrl="" />
      </div>
    </main>
  );
}
