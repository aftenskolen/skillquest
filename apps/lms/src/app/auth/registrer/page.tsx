import { RegisterForm } from "@novolms/ui";
import { registrerAction } from "./actions";

export default function RegistrerPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F8]">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-[#1B3A5C]">Opprett konto</h1>
        <RegisterForm registrerAction={registrerAction} />
      </div>
    </main>
  );
}
