"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";

interface RegisterFormProps {
  /**
   * Server action som kaller @skillquest/auth registrerBruker().
   * Eksempel i Next.js app:
   *   async function registrerAction(navn: string, epost: string, passord: string) {
   *     "use server";
   *     await registrerBruker(epost, passord, navn);
   *   }
   */
  registrerAction: (
    navn: string,
    epost: string,
    passord: string
  ) => Promise<void>;
  loggInnUrl?: string;
  onSuccess?: () => void;
}

export function RegisterForm({
  registrerAction,
  loggInnUrl = "/auth/logg-inn",
  onSuccess,
}: RegisterFormProps) {
  const [navn, setNavn] = useState("");
  const [epost, setEpost] = useState("");
  const [passord, setPassord] = useState("");
  const [bekreftPassord, setBekreftPassord] = useState("");
  const [gdprSamtykke, setGdprSamtykke] = useState(false);
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeil(null);

    if (passord !== bekreftPassord) {
      setFeil("Passordene stemmer ikke overens.");
      return;
    }

    if (passord.length < 8) {
      setFeil("Passordet må være minst 8 tegn.");
      return;
    }

    if (!gdprSamtykke) {
      setFeil("Du må godta personvernvilkårene for å opprette konto.");
      return;
    }

    setLaster(true);
    try {
      await registrerAction(navn, epost, passord);
      onSuccess?.();
    } catch (err) {
      setFeil(
        err instanceof Error
          ? err.message
          : "Noe gikk galt. Prøv igjen eller kontakt support."
      );
    } finally {
      setLaster(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="navn">Fullt navn</Label>
        <Input
          id="navn"
          type="text"
          value={navn}
          onChange={(e) => setNavn(e.target.value)}
          placeholder="Ola Nordmann"
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-epost">E-post</Label>
        <Input
          id="reg-epost"
          type="email"
          value={epost}
          onChange={(e) => setEpost(e.target.value)}
          placeholder="din@epost.no"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-passord">Passord</Label>
        <Input
          id="reg-passord"
          type="password"
          value={passord}
          onChange={(e) => setPassord(e.target.value)}
          placeholder="Minst 8 tegn"
          required
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bekreft-passord">Bekreft passord</Label>
        <Input
          id="bekreft-passord"
          type="password"
          value={bekreftPassord}
          onChange={(e) => setBekreftPassord(e.target.value)}
          placeholder="Gjenta passordet"
          required
          autoComplete="new-password"
        />
      </div>

      <div className="flex items-start gap-2">
        <input
          id="gdpr"
          type="checkbox"
          checked={gdprSamtykke}
          onChange={(e) => setGdprSamtykke(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300"
          required
        />
        <Label htmlFor="gdpr" className="text-sm font-normal leading-snug">
          Jeg godtar{" "}
          <a href="/personvern" className="text-blue-600 hover:underline">
            personvernvilkårene
          </a>{" "}
          og samtykker til behandling av mine personopplysninger.
        </Label>
      </div>

      {feil && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {feil}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={laster || !gdprSamtykke}>
        {laster ? "Oppretter konto..." : "Opprett konto"}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Har du allerede konto?{" "}
        <a href={loggInnUrl} className="text-blue-600 hover:underline">
          Logg inn
        </a>
      </p>
    </form>
  );
}
