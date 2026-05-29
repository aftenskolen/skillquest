export function formatNok(oere: number): string {
  const kroner = Math.floor(oere / 100);
  return `kr ${kroner.toLocaleString("nb-NO")}`;
}

export function formatDato(dato: string): string {
  return new Date(dato).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const KURSTYPE_LABELS: Record<string, string> = {
  sprak: "Språk",
  kreativ: "Kreativ",
  teknologi: "Teknologi",
  helse: "Helse og velvære",
  kultur: "Kultur",
  business: "Business",
  hobby: "Hobby",
};

export const CEFR_LABELS: Record<string, string> = {
  A1: "Nybegynner",
  A2: "Grunnleggende",
  B1: "Mellomnivå",
  B2: "Høyt mellomnivå",
  C1: "Avansert",
  C2: "Ekspertnivå",
};
