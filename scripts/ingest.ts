#!/usr/bin/env tsx
/**
 * Canadian Law MCP — Ingestion Pipeline
 *
 * Fetches Canadian federal legislation from Justice Laws Website (laws-lois.justice.gc.ca).
 * Downloads the FullText.html page for each Act and parses the structured HTML
 * into provision-level JSON seed files.
 *
 * Usage:
 *   npm run ingest                    # Full ingestion
 *   npm run ingest -- --limit 5       # Test with 5 acts
 *   npm run ingest -- --skip-fetch    # Reuse cached pages
 *
 * Data is sourced under the Open Government Licence - Canada.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { fetchActFullText } from './lib/fetcher.js';
import { parseFullTextHtml, KEY_CANADIAN_ACTS, type ActIndexEntry, type ParsedAct } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');

function parseArgs(): { limit: number | null; skipFetch: boolean } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let skipFetch = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--skip-fetch') {
      skipFetch = true;
    }
  }

  return { limit, skipFetch };
}

async function fetchAndParseActs(acts: ActIndexEntry[], skipFetch: boolean): Promise<void> {
  console.log(`\nProcessing ${acts.length} federal Acts...\n`);

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let totalProvisions = 0;
  let totalDefinitions = 0;

  const report: { act: string; provisions: number; definitions: number; status: string }[] = [];

  for (const act of acts) {
    const sourceFile = path.join(SOURCE_DIR, `${act.id}.html`);
    const seedFile = path.join(SEED_DIR, `${act.id}.json`);

    // Skip if seed already exists and we're in skip-fetch mode
    if (skipFetch && fs.existsSync(seedFile)) {
      const existing = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as ParsedAct;
      report.push({
        act: act.shortName,
        provisions: existing.provisions.length,
        definitions: existing.definitions.length,
        status: 'cached',
      });
      totalProvisions += existing.provisions.length;
      totalDefinitions += existing.definitions.length;
      skipped++;
      processed++;
      continue;
    }

    try {
      let html: string;

      if (fs.existsSync(sourceFile) && skipFetch) {
        html = fs.readFileSync(sourceFile, 'utf-8');
        console.log(`  Using cached ${act.shortName} (${act.actPath})`);
      } else {
        process.stdout.write(`  Fetching ${act.shortName} (${act.actPath})...`);
        const result = await fetchActFullText(act.actPath);

        if (result.status !== 200) {
          console.log(` HTTP ${result.status} -- SKIPPED`);
          report.push({ act: act.shortName, provisions: 0, definitions: 0, status: `HTTP ${result.status}` });
          failed++;
          processed++;
          continue;
        }

        // Check if we got the 404 error page (server returns 200 for soft 404s)
        if (result.body.includes('Page not Found') || result.body.includes('Error 404')) {
          console.log(` SOFT 404 -- SKIPPED`);
          report.push({ act: act.shortName, provisions: 0, definitions: 0, status: 'soft 404' });
          failed++;
          processed++;
          continue;
        }

        html = result.body;
        fs.writeFileSync(sourceFile, html);
        console.log(` OK (${(html.length / 1024).toFixed(0)} KB)`);
      }

      const parsed = parseFullTextHtml(html, act);
      fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2));

      totalProvisions += parsed.provisions.length;
      totalDefinitions += parsed.definitions.length;

      report.push({
        act: act.shortName,
        provisions: parsed.provisions.length,
        definitions: parsed.definitions.length,
        status: 'OK',
      });

      console.log(`    -> ${parsed.provisions.length} provisions, ${parsed.definitions.length} definitions`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ERROR parsing ${act.shortName}: ${msg}`);
      report.push({ act: act.shortName, provisions: 0, definitions: 0, status: `ERROR: ${msg}` });
      failed++;
    }

    processed++;
  }

  // Print summary report
  console.log(`\n${'='.repeat(70)}`);
  console.log('INGESTION REPORT');
  console.log('='.repeat(70));
  console.log(`${'Act'.padEnd(25)} ${'Provisions'.padEnd(12)} ${'Definitions'.padEnd(12)} Status`);
  console.log('-'.repeat(70));

  for (const r of report) {
    console.log(
      `${r.act.padEnd(25)} ${String(r.provisions).padEnd(12)} ${String(r.definitions).padEnd(12)} ${r.status}`
    );
  }

  console.log('-'.repeat(70));
  console.log(`${'TOTAL'.padEnd(25)} ${String(totalProvisions).padEnd(12)} ${String(totalDefinitions).padEnd(12)}`);
  console.log(`\n  Acts processed: ${processed}`);
  console.log(`  Acts cached:    ${skipped}`);
  console.log(`  Acts failed:    ${failed}`);
  console.log(`  Total provisions:  ${totalProvisions}`);
  console.log(`  Total definitions: ${totalDefinitions}`);
}

async function main(): Promise<void> {
  const { limit, skipFetch } = parseArgs();

  console.log('Canadian Law MCP -- Ingestion Pipeline');
  console.log('======================================\n');
  console.log(`  Source:  Justice Laws Website (laws-lois.justice.gc.ca)`);
  console.log(`  Method:  FullText.html (structured HTML)`);
  console.log(`  License: Open Government Licence - Canada`);

  if (limit) console.log(`  --limit ${limit}`);
  if (skipFetch) console.log(`  --skip-fetch`);

  const acts = limit ? KEY_CANADIAN_ACTS.slice(0, limit) : KEY_CANADIAN_ACTS;
  await fetchAndParseActs(acts, skipFetch);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
