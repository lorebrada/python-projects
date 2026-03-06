import type { RightType } from "@/types";

export const RIGHT_TYPE_LABELS: Record<RightType, string> = {
  access: "Access",
  erasure: "Erasure",
  portability: "Portability",
  rectification: "Rectification",
  restriction: "Restriction",
  objection: "Objection",
};

export const RIGHT_TYPE_DESCRIPTIONS: Record<RightType, string> = {
  access: "I want a copy of my data.",
  erasure: "I want my data deleted.",
  portability: "I want my data in a downloadable format.",
  rectification: "I want to correct my data.",
  restriction: "I want to restrict how you use my data.",
  objection: "I want to object to how you use my data.",
};

export const GDPR_RIGHT_REFERENCES: Record<
  RightType,
  { article: string; summary: string }
> = {
  access: {
    article: "Article 15",
    summary:
      "Right of access: the data subject can obtain confirmation and a copy of the personal data being processed.",
  },
  rectification: {
    article: "Article 16",
    summary:
      "Right to rectification: inaccurate or incomplete personal data must be corrected without undue delay.",
  },
  erasure: {
    article: "Article 17",
    summary:
      "Right to erasure: the data subject can request deletion of personal data where legal grounds apply.",
  },
  restriction: {
    article: "Article 18",
    summary:
      "Right to restriction: processing may need to be paused while a dispute or verification issue is resolved.",
  },
  portability: {
    article: "Article 20",
    summary:
      "Right to data portability: the data subject can obtain their data in a structured, machine-readable format.",
  },
  objection: {
    article: "Article 21",
    summary:
      "Right to object: processing based on legitimate interests or direct marketing may need to stop.",
  },
};

export const DPA_DIRECTORY: Record<
  string,
  { name: string; url: string; shortUrl: string }
> = {
  IT: {
    name: "Garante per la Protezione dei Dati Personali",
    url: "https://www.garante.it",
    shortUrl: "garante.it",
  },
  DE: {
    name: "Bundesbeauftragte fur den Datenschutz (BfDI)",
    url: "https://www.bfdi.bund.de",
    shortUrl: "bfdi.bund.de",
  },
  FR: {
    name: "Commission Nationale Informatique et Libertes (CNIL)",
    url: "https://www.cnil.fr",
    shortUrl: "cnil.fr",
  },
  ES: {
    name: "Agencia Espanola de Proteccion de Datos (AEPD)",
    url: "https://www.aepd.es",
    shortUrl: "aepd.es",
  },
  NL: {
    name: "Autoriteit Persoonsgegevens",
    url: "https://autoriteitpersoonsgegevens.nl",
    shortUrl: "autoriteitpersoonsgegevens.nl",
  },
  IE: {
    name: "Data Protection Commission",
    url: "https://www.dataprotection.ie",
    shortUrl: "dataprotection.ie",
  },
  EU: {
    name: "European Data Protection Board",
    url: "https://www.edpb.europa.eu",
    shortUrl: "edpb.europa.eu",
  },
};

export function getDpaForCountry(country?: string | null) {
  if (!country) {
    return DPA_DIRECTORY.EU;
  }

  return DPA_DIRECTORY[country.toUpperCase()] ?? DPA_DIRECTORY.EU;
}
