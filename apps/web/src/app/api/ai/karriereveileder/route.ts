import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic();

// Enkel in-memory rate-limiter (20 kall/time per IP)
const rateLimit = new Map<string, { count: number; reset: number }>();

function sjekkRateLimit(ip: string): boolean {
  const na = Date.now();
  const post = rateLimit.get(ip);
  if (!post || na > post.reset) {
    rateLimit.set(ip, { count: 1, reset: na + 3_600_000 });
    return true;
  }
  if (post.count >= 20) return false;
  post.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'ukjent';

  if (!sjekkRateLimit(ip)) {
    return new Response('For mange forespørsler. Prøv igjen om en time.', { status: 429 });
  }

  let melding: string;
  try {
    const body = await req.json() as { melding?: unknown };
    if (typeof body.melding !== 'string' || !body.melding.trim()) {
      return new Response('Mangler melding', { status: 400 });
    }
    melding = body.melding.trim();
  } catch {
    return new Response('Ugyldig JSON', { status: 400 });
  }

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system:
      'Du er en karriereveileder for Aftenskolen. Hjelp brukeren å finne riktig kurs basert på deres interesser og mål. ' +
      'Aftenskolen tilbyr: norskopplæring (A1-B2), fagbrev (BUA, HEA), arbeidsliv og etterutdanning. ' +
      'Svar kort og vennlig på norsk. Still ett oppfølgingsspørsmål hvis nødvendig.',
    messages: [{ role: 'user', content: melding }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
