/**
 * Statute ID resolution for Canadian Law MCP.
 *
 * Resolves fuzzy document references (titles, Act short titles) to database document IDs.
 */

import type Database from '@ansvar/mcp-sqlite';

/**
 * Resolve a document identifier to a database document ID.
 * Supports:
 * - Direct ID match (e.g., "pipeda")
 * - Act chapter match (e.g., "P-8.6", "C-46")
 * - Title substring match (e.g., "Personal Information Protection", "PIPEDA")
 */
export function resolveDocumentId(
  db: InstanceType<typeof Database>,
  input: string,
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct ID match
  const directMatch = db.prepare(
    'SELECT id FROM legal_documents WHERE id = ?'
  ).get(trimmed) as { id: string } | undefined;
  if (directMatch) return directMatch.id;

  // Act chapter match (e.g., "P-8.6", "C-46", "E-1.6")
  const chapterMatch = trimmed.match(/^([A-Z]-[\d.]+)$/i);
  if (chapterMatch) {
    const chapter = chapterMatch[1].toUpperCase();
    const chapterResult = db.prepare(
      "SELECT id FROM legal_documents WHERE id LIKE ? OR short_name LIKE ? LIMIT 1"
    ).get(`%${chapter.toLowerCase().replace(/\./g, '-')}%`, `%${chapter}%`) as { id: string } | undefined;
    if (chapterResult) return chapterResult.id;
  }

  // Title/short_name fuzzy match
  const titleResult = db.prepare(
    "SELECT id FROM legal_documents WHERE title LIKE ? OR short_name LIKE ? OR title_en LIKE ? LIMIT 1"
  ).get(`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`) as { id: string } | undefined;
  if (titleResult) return titleResult.id;

  // Case-insensitive fallback
  const lowerResult = db.prepare(
    "SELECT id FROM legal_documents WHERE LOWER(title) LIKE LOWER(?) OR LOWER(short_name) LIKE LOWER(?) OR LOWER(title_en) LIKE LOWER(?) LIMIT 1"
  ).get(`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`) as { id: string } | undefined;
  if (lowerResult) return lowerResult.id;

  return null;
}
