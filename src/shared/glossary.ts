export type GlossaryEntry = {
  source: string;
  target: string;
  note?: string;
};

const MAX_GLOSSARY_ENTRIES = 200;
const MAX_TERM_LENGTH = 120;
const MAX_NOTE_LENGTH = 160;

export function normalizeGlossaryEntries(value: unknown): GlossaryEntry[] {
  if (!Array.isArray(value)) return [];

  const entries: GlossaryEntry[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!isRecord(item)) continue;

    const source = normalizeGlossaryPart(item.source, MAX_TERM_LENGTH);
    const target = normalizeGlossaryPart(item.target, MAX_TERM_LENGTH);
    if (!source || !target) continue;

    const key = `${source.toLowerCase()}\u001f${target.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const note = normalizeGlossaryPart(item.note, MAX_NOTE_LENGTH);
    entries.push(note ? { source, target, note } : { source, target });
    if (entries.length >= MAX_GLOSSARY_ENTRIES) break;
  }

  return entries;
}

export function glossaryTextToEntries(value: string): GlossaryEntry[] {
  const rows = value
    .split(/\r?\n/)
    .map((row) => parseGlossaryTextRow(row))
    .filter((entry): entry is GlossaryEntry => Boolean(entry));
  return normalizeGlossaryEntries(rows);
}

export function glossaryEntriesToText(entries: readonly GlossaryEntry[]): string {
  return normalizeGlossaryEntries([...entries])
    .map((entry) => `${entry.source} = ${entry.target}${entry.note ? ` # ${entry.note}` : ""}`)
    .join("\n");
}

export function buildGlossarySystemPrompt(basePrompt: string, entries: readonly GlossaryEntry[]): string {
  const glossary = normalizeGlossaryEntries([...entries]);
  if (glossary.length === 0) return basePrompt;

  const lines = glossary.map((entry) => {
    const note = entry.note ? ` (${entry.note})` : "";
    return `- "${entry.source}" => "${entry.target}"${note}`;
  });

  return [
    basePrompt,
    "",
    "Terminology glossary:",
    ...lines,
    "When a glossary source term appears in an item, use the matching target term naturally while preserving the required JSON response format.",
  ].join("\n");
}

function parseGlossaryTextRow(row: string): GlossaryEntry | undefined {
  const trimmed = row.trim();
  if (!trimmed) return undefined;

  const noteParts = splitOnce(trimmed, "#");
  const body = noteParts?.[0] ?? trimmed;
  const rawNote = noteParts?.[1];
  const note = rawNote?.trim();
  const pair = splitTermPair(body.trim());
  if (!pair) return undefined;

  const [source, target] = pair;
  return note ? { source, target, note } : { source, target };
}

function splitTermPair(value: string): [string, string] | undefined {
  for (const separator of ["=>", "=", "\t"]) {
    const pair = splitOnce(value, separator);
    if (!pair) continue;
    const source = pair[0].trim();
    const target = pair[1].trim();
    if (source && target) return [source, target];
  }
  return undefined;
}

function splitOnce(value: string, separator: string): [string, string] | undefined {
  const index = value.indexOf(separator);
  if (index < 0) return undefined;
  return [value.slice(0, index), value.slice(index + separator.length)];
}

function normalizeGlossaryPart(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength).trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
