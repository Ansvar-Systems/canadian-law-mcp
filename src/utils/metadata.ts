/**
 * Response metadata utilities for Canadian Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'Justice Laws Website (laws-lois.justice.gc.ca) — Department of Justice Canada',
    jurisdiction: 'CA',
    disclaimer:
      'This data is sourced from the Justice Laws Website under the Open Government Licence - Canada. ' +
      'Both English and French texts are official. ' +
      'Always verify with the official Justice Laws Website portal.',
    freshness,
  };
}
