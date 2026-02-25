#!/usr/bin/env tsx
/**
 * Canadian Law MCP — Census Script
 *
 * Enumerates ALL consolidated federal Acts from the Justice Laws Website
 * (laws-lois.justice.gc.ca) by scraping the alphabetical index pages (A.html–Z.html).
 *
 * Writes data/census.json in golden standard format.
 *
 * Usage:
 *   npx tsx scripts/census.ts
 *
 * The index pages list acts as:
 *   <li><span class="objTitle"><a class="TocTitle" href="{actPath}/index.html">Title</a></span>
 *   ...
 *   <span class="htmlLink">R.S.C., 1985, c. A-1</span>
 *
 * Data sourced under Open Government Licence - Canada.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRateLimit } from './lib/fetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const CENSUS_PATH = path.join(DATA_DIR, 'census.json');

const BASE_URL = 'https://laws-lois.justice.gc.ca/eng/acts/';

// All active alphabetical index page letters (X and Z are disabled on the main page)
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWY'.split('');

interface CensusAct {
  id: string;
  actPath: string;
  title: string;
  citation: string;
  url: string;
  classification: 'ingestable' | 'inaccessible' | 'metadata_only';
}

interface CensusOutput {
  generated_at: string;
  source: string;
  description: string;
  stats: {
    total: number;
    class_ingestable: number;
    class_inaccessible: number;
    class_metadata_only: number;
  };
  ingestion?: {
    completed_at: string;
    total_laws: number;
    total_provisions: number;
    coverage_pct: string;
  };
  laws: CensusAct[];
}

/**
 * Generate a kebab-case ID from the act path.
 * e.g. "A-1" -> "a-1", "P-8.6" -> "p-8-6", "C-46" -> "c-46"
 */
function actPathToId(actPath: string): string {
  return actPath
    .toLowerCase()
    .replace(/\./g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse a single alphabetical index page and extract all Act entries.
 */
function parseIndexPage(html: string, letter: string): CensusAct[] {
  const acts: CensusAct[] = [];

  // Match each <a class="TocTitle" href="{actPath}/index.html"> pattern
  // The title follows on subsequent lines (may contain whitespace/newlines)
  const tocRe = /<a\s+class="TocTitle"\s+href="([^"]+)\/index\.html">\s*([\s\S]*?)\s*<\/a>/gi;
  let match: RegExpExecArray | null;

  // Also build a map of citation info from htmlLink spans
  // Pattern: <span class="htmlLink">R.S.C., 1985, c. A-1</span>
  // These appear after each TocTitle link in the same <li> block

  while ((match = tocRe.exec(html)) !== null) {
    const actPath = match[1].trim();
    const rawTitle = match[2]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#x00A0;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&eacute;/g, '\u00E9')
      .replace(/&ccedil;/g, '\u00E7')
      .replace(/&rsquo;/g, '\u2019')
      .replace(/&ldquo;/g, '\u201C')
      .replace(/&rdquo;/g, '\u201D')
      .replace(/&mdash;/g, '\u2014')
      .replace(/&ndash;/g, '\u2013')
      .replace(/\s+/g, ' ')
      .trim();

    if (!actPath || !rawTitle) continue;

    // Find the citation text in the htmlLink span after this match
    const afterMatch = html.substring(match.index, match.index + 1500);
    const citationMatch = afterMatch.match(/<span\s+class="htmlLink"[^>]*>([\s\S]*?)<\/span>/i);
    let citation = '';
    if (citationMatch) {
      citation = citationMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const id = actPathToId(actPath);
    const url = `https://laws-lois.justice.gc.ca/eng/acts/${actPath}/`;

    acts.push({
      id,
      actPath,
      title: rawTitle,
      citation,
      url,
      classification: 'ingestable',
    });
  }

  return acts;
}

async function main(): Promise<void> {
  console.log('Canadian Law MCP — Census');
  console.log('=========================\n');
  console.log('  Source:  Justice Laws Website (laws-lois.justice.gc.ca)');
  console.log('  Method:  Alphabetical index page scrape (A.html–Y.html)');
  console.log('  License: Open Government Licence - Canada\n');

  const allActs: CensusAct[] = [];
  const seen = new Set<string>();

  for (const letter of LETTERS) {
    const url = `${BASE_URL}${letter}.html`;
    process.stdout.write(`  Fetching ${letter}.html...`);

    try {
      const result = await fetchWithRateLimit(url);

      if (result.status !== 200) {
        console.log(` HTTP ${result.status} — skipped`);
        continue;
      }

      if (result.body.includes('Page not Found') || result.body.includes('Error 404')) {
        console.log(' soft 404 — skipped');
        continue;
      }

      const acts = parseIndexPage(result.body, letter);

      // Deduplicate (some acts appear on multiple pages due to alternate titles)
      let added = 0;
      for (const act of acts) {
        if (!seen.has(act.actPath)) {
          seen.add(act.actPath);
          allActs.push(act);
          added++;
        }
      }

      console.log(` ${acts.length} acts found (${added} new)`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(` ERROR: ${msg}`);
    }
  }

  // Also scrape the main index page for "Frequently Accessed Acts" that might not appear on letter pages
  process.stdout.write('  Fetching main index...');
  try {
    const mainResult = await fetchWithRateLimit(BASE_URL);
    if (mainResult.status === 200) {
      // Frequently accessed acts have href="/eng/acts/{path}/index.html"
      const freqRe = /href="\/eng\/acts\/([^"]+)\/index\.html"/gi;
      let fm: RegExpExecArray | null;
      let freqCount = 0;
      while ((fm = freqRe.exec(mainResult.body)) !== null) {
        const actPath = fm[1];
        if (!seen.has(actPath)) {
          // We need to get the title too
          const titleRe = new RegExp(`href="/eng/acts/${actPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/index\\.html">\\s*([^<]+)`, 'i');
          const titleMatch = mainResult.body.match(titleRe);
          const title = titleMatch ? titleMatch[1].trim() : actPath;
          seen.add(actPath);
          allActs.push({
            id: actPathToId(actPath),
            actPath,
            title,
            citation: '',
            url: `https://laws-lois.justice.gc.ca/eng/acts/${actPath}/`,
            classification: 'ingestable',
          });
          freqCount++;
        }
      }
      console.log(` ${freqCount} additional acts from frequently accessed`);
    }
  } catch {
    console.log(' skipped (non-critical)');
  }

  // Sort by actPath for deterministic output
  allActs.sort((a, b) => a.actPath.localeCompare(b.actPath));

  // Build census output
  const census: CensusOutput = {
    generated_at: new Date().toISOString(),
    source: 'laws-lois.justice.gc.ca (Consolidated Acts A-Z index)',
    description: 'Full census of Canadian federal consolidated legislation',
    stats: {
      total: allActs.length,
      class_ingestable: allActs.filter(a => a.classification === 'ingestable').length,
      class_inaccessible: allActs.filter(a => a.classification === 'inaccessible').length,
      class_metadata_only: allActs.filter(a => a.classification === 'metadata_only').length,
    },
    laws: allActs,
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2) + '\n');

  console.log(`\n${'='.repeat(50)}`);
  console.log('CENSUS COMPLETE');
  console.log('='.repeat(50));
  console.log(`  Total Acts discovered: ${allActs.length}`);
  console.log(`  Ingestable:            ${census.stats.class_ingestable}`);
  console.log(`  Inaccessible:          ${census.stats.class_inaccessible}`);
  console.log(`  Metadata only:         ${census.stats.class_metadata_only}`);
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
