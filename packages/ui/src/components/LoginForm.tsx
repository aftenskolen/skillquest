"use client";

import { useState, type FormEvent } from "react";
import { loggInn } from "@novolms/auth";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";

interface LoginFormProps {
  loggInnAction?: (epost: string, passord: string) => Promise<{ error?: string }>;
  onSuccess?: () => void;
  registrerUrl?: string;
  glemtPassordUrl?: string;
}

export function LoginForm({
  loggInnAction,
  onSuccess,
  registrerUrl = "/auth/registrer",
  glemtPassordUrl = "/auth/glemt-passord",
}: LoginFormProps) {
  const [epost, setEpost] = useState("");
  const [passord, setPassord] = useState("");
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeil(null);
    setLaster(true);
    try {
      if (loggInnAction) {
        const result = await loggInnAction(epost, passord);
        if (result?.error) {
          setFeil(result.error);
          return;
        }
      } else {
        await loggInn(epost, passord);
      }
      onSuccess?.();
    } catch (err) {
      setFeil(err instanceof Error ? err.message : "Innlogging feilet. Sjekk e-post og passord.");
    } finally {
      setLaster(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="epost">E-post</Label>
        <Input
          id="epost"
          type="email"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          placeholder="din@epost.no"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="passord">Passord</Label>
          {glemtPassordUrl && (
            <a
              href={glemtPassordUrl}
              className="text-sm text-blue-600 hover:underline"
            >
              Glemt passord?
            </a>
          )}
        </div>
        <Input
          id="passord"
          type="password"
          value={passord}
          onChange={(e) => setPassord(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      {feil && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {feil}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={laster}>
        {laster ? "Logger inn..." : "Logg inn"}
      </Button>

      {registrerUrl && (
        <p className="text-center text-sm text-gray-600">
          Har du ikke konto?{" "}
          <a href={registrerUrl} className="text-blue-600 hover:underline">
            Opprett konto
          </a>
        </p>
      )}
    </form>
  );
}
