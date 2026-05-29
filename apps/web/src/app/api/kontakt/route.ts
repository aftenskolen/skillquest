import { Resend } from 'resend';
import { NextRequest } from 'next/server';
import type { KontaktSkjema } from '@/lib/types';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ feil: 'Ugyldig JSON' }, { status: 400 });
  }

  const skjema = body as Partial<KontaktSkjema>;
  if (!skjema.navn || !skjema.epost || !skjema.melding) {
    return Response.json({ feil: 'Mangler påkrevde felt' }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'Aftenskolen Kontakt <kontakt@aftenskolen.no>',
    to: ['post@aftenskolen.no'],
    subject: `Kontaktskjema: ${skjema.emne ?? 'Generelt'}`,
    text: `Fra: ${skjema.navn} <${skjema.epost}>\nEmne: ${skjema.emne ?? 'Generelt'}\n\n${skjema.melding}`,
  });

  if (error) {
    console.error('Resend-feil:', error);
    return Response.json({ feil: 'Kunne ikke sende e-post' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
