"use client";

import type { TekstBlokkData } from "@novolms/db/types";

interface Props {
  data: TekstBlokkData;
}

export function BlokkTekst({ data }: Props) {
  return (
    <div
      className="text-gray-700 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1"
      dangerouslySetInnerHTML={{ __html: data.innhold.no }}
    />
  );
}
