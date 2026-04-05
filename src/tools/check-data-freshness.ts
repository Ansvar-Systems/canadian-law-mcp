/**
 * check_data_freshness — Report database freshness and staleness.
 */

import type Database from '@ansvar/mcp-sqlite';
import { readDbMetadata } from '../capabilities.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface CheckDataFreshnessResult {
  database_built_at: string | null;
  days_since_update: number | null;
  status: 'fresh' | 'stale' | 'unknown';
  stale_threshold_days: number;
  upstream_source: string;
  recommendation: string;
}

const STALE_THRESHOLD_DAYS = 30;

export async function checkDataFreshness(
  db: InstanceType<typeof Database>,
): Promise<ToolResponse<CheckDataFreshnessResult>> {
  const meta = readDbMetadata(db);
  const builtAt = meta.built_at ?? null;

  let daysSinceUpdate: number | null = null;
  let status: 'fresh' | 'stale' | 'unknown' = 'unknown';

  if (builtAt) {
    const built = new Date(builtAt);
    const now = new Date();
    daysSinceUpdate = Math.floor((now.getTime() - built.getTime()) / (1000 * 60 * 60 * 24));
    status = daysSinceUpdate > STALE_THRESHOLD_DAYS ? 'stale' : 'fresh';
  }

  const recommendation =
    status === 'stale'
      ? `Database is ${daysSinceUpdate} days old (threshold: ${STALE_THRESHOLD_DAYS} days). Consider refreshing data from the Justice Laws Website.`
      : status === 'fresh'
      ? 'Database is up to date.'
      : 'Could not determine database age. Verify against the Justice Laws Website.';

  return {
    results: {
      database_built_at: builtAt,
      days_since_update: daysSinceUpdate,
      status,
      stale_threshold_days: STALE_THRESHOLD_DAYS,
      upstream_source: 'https://laws-lois.justice.gc.ca',
      recommendation,
    },
    _metadata: generateResponseMetadata(db),
  };
}
