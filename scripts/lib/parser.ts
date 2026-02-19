/**
 * HTML parser for Canadian federal legislation from the Justice Laws Website.
 *
 * Parses the FullText.html pages served by laws-lois.justice.gc.ca into
 * structured provision data. The site uses a well-defined HTML structure
 * with CSS classes for sections, subsections, paragraphs, definitions,
 * marginal notes, and schedules.
 *
 * Key HTML patterns:
 *   - Sections:    <p class="Section"> or <p class="Section ProvisionList">
 *   - Subsections: <p class="Subsection">
 *   - Paragraphs:  <p class="Paragraph">
 *   - Subparagraphs: <p class="Subparagraph">
 *   - Section IDs:   <a class="sectionLabel" id="s-{num}">
 *   - Marginal notes: <p class="MarginalNote">...title...</p>
 *   - Definitions:  <p class="Definition"><span class="DefinedTerm"><dfn>term</dfn></span>...</p>
 *   - Parts:       <h2 class="Part">
 *   - Divisions:   <h3 class="Subheading">
 *   - Schedules:   <div class="Schedule">
 */

export interface ActIndexEntry {
  id: string;
  actPath: string;
  title: string;
  titleFr: string;
  shortName: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issuedDate: string;
  inForceDate: string;
  url: string;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedAct {
  id: string;
  type: 'statute';
  title: string;
  title_en: string;
  short_name: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issued_date: string;
  in_force_date: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

/**
 * Strip HTML tags and decode common entities to plain text.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x00A0;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&eacute;/g, '\u00E9')
    .replace(/&ccedil;/g, '\u00E7')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract the act description from the <title> tag or heading.
 */
function extractDescription(html: string, act: ActIndexEntry): string {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    const titleText = stripHtml(titleMatch[1]);
    return `${titleText} (${act.shortName})`;
  }
  return act.title;
}

/**
 * Extract the last amendment date from the HTML.
 */
function extractCurrentToDate(html: string): string | null {
  const match = html.match(/Act current to\s*(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

/**
 * Build a section-content map from the FullText HTML.
 *
 * Strategy: We find all section anchors (id="s-{num}") and collect
 * all HTML content between consecutive section anchors. Each section's
 * content includes subsections, paragraphs, and provision lists that
 * belong to it.
 */
function extractSections(html: string): Map<string, { title: string; content: string; chapter: string }> {
  const sections = new Map<string, { title: string; content: string; chapter: string }>();

  // Find all section anchor positions: <a class="sectionLabel" id="s-{num}">
  const sectionAnchors: { num: string; pos: number }[] = [];
  const anchorRe = /id="s-(\d+(?:\.\d+)?)">/g;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html)) !== null) {
    sectionAnchors.push({ num: m[1], pos: m.index });
  }

  if (sectionAnchors.length === 0) return sections;

  // Track current chapter (Part / Division) context
  let currentChapter = '';
  const partRe = /<h[23][^>]*class="(?:Part|Subheading)"[^>]*>(.*?)<\/h[23]>/gi;
  const partPositions: { label: string; pos: number }[] = [];
  while ((m = partRe.exec(html)) !== null) {
    const label = stripHtml(m[1]);
    partPositions.push({ label, pos: m.index });
  }

  // Build the marginal notes map: position -> title text
  // MarginalNote appears immediately before the Section element
  const marginalNotes: { title: string; pos: number }[] = [];
  const mnRe = /class="MarginalNote"[^>]*>(?:<span[^>]*>Marginal note:<\/span>)?\s*(.*?)<\/p>/gi;
  while ((m = mnRe.exec(html)) !== null) {
    const title = stripHtml(m[1]);
    if (title && title !== 'Marginal note:') {
      marginalNotes.push({ title, pos: m.index });
    }
  }

  // For each section anchor, extract content until the next section anchor
  for (let i = 0; i < sectionAnchors.length; i++) {
    const anchor = sectionAnchors[i];
    const nextAnchorPos = i + 1 < sectionAnchors.length
      ? sectionAnchors[i + 1].pos
      : html.length;

    // Update current chapter context
    for (const part of partPositions) {
      if (part.pos < anchor.pos) {
        currentChapter = part.label;
      }
    }

    // Find the nearest MarginalNote before this section (within 2000 chars)
    let title = '';
    for (let j = marginalNotes.length - 1; j >= 0; j--) {
      const mn = marginalNotes[j];
      if (mn.pos < anchor.pos && anchor.pos - mn.pos < 2000) {
        title = mn.title;
        break;
      }
    }

    // Extract the raw HTML block for this section
    const sectionHtml = html.substring(anchor.pos, nextAnchorPos);

    // Convert to text content
    // Remove HistoricalNote blocks (amendment history) as they're not part of the law text
    const cleanedHtml = sectionHtml
      .replace(/<div class="HistoricalNote">.*?<\/div>/gs, '')
      .replace(/<ul class="HistoricalNote">.*?<\/ul>/gs, '')
      // Remove MarginalNote paragraphs (they contain section titles, not law text)
      .replace(/<p class="MarginalNote"[^>]*>.*?<\/p>/gs, '')
      // Truncate at the next Part/Division heading (h2/h3 with Part/Subheading class)
      .replace(/<h[23][^>]*class="(?:Part|Subheading)"[^>]*>[\s\S]*$/i, '')
      // Truncate at the next Schedule div
      .replace(/<div class="Schedule"[\s\S]*$/i, '');

    let text = stripHtml(cleanedHtml);

    // Remove the leading anchor residue: id="s-X"> N or id="s-X.Y"> N.Y
    text = text.replace(/^\s*id="s-[\d.]+"\s*>\s*/, '');
    // Clean up leading section number (e.g., "1 " or "4.01 ")
    text = text.replace(/^\s*\d+(?:\.\d+)?\s+/, `${anchor.num} `);
    // Remove any trailing partial HTML tags
    text = text.replace(/<[^>]*$/, '').trim();

    // Skip very short or empty sections
    if (text.length < 10) continue;

    // Cap content at 8000 chars to stay within DB limits
    const content = text.substring(0, 8000);

    sections.set(anchor.num, {
      title,
      content,
      chapter: currentChapter,
    });
  }

  return sections;
}

/**
 * Extract definitions from <p class="Definition"> elements.
 * Each definition has a DefinedTerm span and the rest is the definition text.
 */
function extractDefinitions(html: string, sectionNum: string): ParsedDefinition[] {
  const defs: ParsedDefinition[] = [];
  const defRe = /<p class="Definition"[^>]*>(.*?)<\/p>/gi;
  let m: RegExpExecArray | null;

  while ((m = defRe.exec(html)) !== null) {
    const defHtml = m[1];

    // Extract the term from DefinedTerm > dfn
    const termMatch = defHtml.match(/<dfn>([^<]+)<\/dfn>/);
    if (!termMatch) continue;

    const term = stripHtml(termMatch[1]);
    const definition = stripHtml(defHtml);

    if (term && definition) {
      defs.push({
        term,
        definition,
        source_provision: `s${sectionNum}`,
      });
    }
  }

  return defs;
}

/**
 * Extract Schedule content as provisions.
 * Schedules are in <div class="Schedule"> blocks.
 * Each schedule principle heading is in <p class="SchedHeadL1">.
 */
function extractSchedules(html: string): { provisions: ParsedProvision[]; definitions: ParsedDefinition[] } {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  // Find Schedule blocks
  const scheduleRe = /<div class="Schedule"[^>]*>(.*?)<\/div>\s*(?=<div class="Schedule"|<section|<footer|$)/gis;
  let schedMatch: RegExpExecArray | null;

  while ((schedMatch = scheduleRe.exec(html)) !== null) {
    const scheduleHtml = schedMatch[1];

    // Get schedule label (e.g., "SCHEDULE 1")
    const labelMatch = scheduleHtml.match(/class="scheduleLabel"[^>]*>([^<]+)</);
    if (!labelMatch) continue;
    const scheduleLabel = stripHtml(labelMatch[1]);

    // Get schedule title if present
    const titleMatch = scheduleHtml.match(/class="scheduleTitleText"[^>]*>([^<]+)/);
    const scheduleTitle = titleMatch ? stripHtml(titleMatch[1]) : '';

    // Extract principle headings (SchedHeadL1)
    const headingRe = /<p class="SchedHeadL1"[^>]*>(.*?)<\/p>/gi;
    let hm: RegExpExecArray | null;
    const headingPositions: { title: string; pos: number }[] = [];

    while ((hm = headingRe.exec(scheduleHtml)) !== null) {
      headingPositions.push({
        title: stripHtml(hm[1]),
        pos: hm.index,
      });
    }

    if (headingPositions.length > 0) {
      // Extract content for each principle heading
      for (let i = 0; i < headingPositions.length; i++) {
        const heading = headingPositions[i];
        const nextPos = i + 1 < headingPositions.length
          ? headingPositions[i + 1].pos
          : scheduleHtml.length;

        const blockHtml = scheduleHtml.substring(heading.pos, nextPos);
        const content = stripHtml(blockHtml);

        if (content.length > 10) {
          // Extract provision_ref from heading (e.g., "4.1" from "4.1 Principle 1 -- Accountability")
          const refMatch = heading.title.match(/^(\d+(?:\.\d+)?)\s/);
          const ref = refMatch ? refMatch[1] : heading.title.substring(0, 20);

          provisions.push({
            provision_ref: `sched-${scheduleLabel.toLowerCase().replace(/\s+/g, '')}-${ref}`,
            chapter: scheduleLabel + (scheduleTitle ? ` - ${scheduleTitle}` : ''),
            section: ref,
            title: heading.title,
            content: content.substring(0, 8000),
          });
        }
      }
    } else {
      // No sub-headings; treat the whole schedule as one provision
      const cleanedHtml = scheduleHtml
        .replace(/<div class="HistoricalNote">.*?<\/div>/gs, '');
      const content = stripHtml(cleanedHtml);

      if (content.length > 10) {
        provisions.push({
          provision_ref: `sched-${scheduleLabel.toLowerCase().replace(/\s+/g, '')}`,
          chapter: scheduleLabel + (scheduleTitle ? ` - ${scheduleTitle}` : ''),
          section: scheduleLabel,
          title: scheduleTitle || scheduleLabel,
          content: content.substring(0, 8000),
        });
      }
    }
  }

  return { provisions, definitions };
}

/**
 * Parse a Justice Laws Website FullText.html page into structured act data.
 *
 * Extracts:
 * - All numbered sections (s1, s2, ...) with their subsections
 * - Marginal notes as section titles
 * - Defined terms from Definition elements
 * - Schedule content as additional provisions
 */
export function parseFullTextHtml(html: string, act: ActIndexEntry): ParsedAct {
  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  // Check for 404 / error page
  if (html.includes('Page not Found') || html.includes('Error 404')) {
    console.log(`    WARNING: ${act.shortName} returned a 404 page`);
    return {
      id: act.id,
      type: 'statute',
      title: act.title,
      title_en: act.title,
      short_name: act.shortName,
      status: act.status,
      issued_date: act.issuedDate,
      in_force_date: act.inForceDate,
      url: act.url,
      description: act.title,
      provisions: [],
      definitions: [],
    };
  }

  const description = extractDescription(html, act);
  const currentTo = extractCurrentToDate(html);

  // Extract main body sections
  const sectionMap = extractSections(html);

  for (const [sectionNum, data] of sectionMap) {
    provisions.push({
      provision_ref: `s${sectionNum}`,
      chapter: data.chapter || undefined,
      section: sectionNum,
      title: data.title,
      content: data.content,
    });
  }

  // Extract definitions (find the definition block -- usually in section 2)
  // Definitions appear inside <p class="Definition"> elements
  const allDefs = extractDefinitions(html, '2');
  definitions.push(...allDefs);

  // Extract schedules
  const scheduleData = extractSchedules(html);
  provisions.push(...scheduleData.provisions);
  definitions.push(...scheduleData.definitions);

  return {
    id: act.id,
    type: 'statute',
    title: act.title,
    title_en: act.title,
    short_name: act.shortName,
    status: act.status,
    issued_date: act.issuedDate,
    in_force_date: act.inForceDate,
    url: act.url,
    description: currentTo
      ? `${description}. Current to ${currentTo}.`
      : description,
    provisions,
    definitions,
  };
}

/**
 * Pre-configured list of key Canadian federal Acts to ingest.
 * These are the most important federal Acts for cybersecurity, data protection,
 * privacy, and compliance use cases.
 *
 * Note: UECA (U-0.8) was removed -- returns 404 on the Justice Laws Website.
 * The Uniform Electronic Commerce Act is a model act, not a federal statute.
 */
export const KEY_CANADIAN_ACTS: ActIndexEntry[] = [
  {
    id: 'pipeda',
    actPath: 'P-8.6',
    title: 'Personal Information Protection and Electronic Documents Act',
    titleFr: 'Loi sur la protection des renseignements personnels et les documents electroniques',
    shortName: 'PIPEDA',
    status: 'in_force',
    issuedDate: '2000-04-13',
    inForceDate: '2001-01-01',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/P-8.6/',
  },
  {
    id: 'privacy-act',
    actPath: 'P-21',
    title: 'Privacy Act',
    titleFr: 'Loi sur la protection des renseignements personnels',
    shortName: 'Privacy Act',
    status: 'in_force',
    issuedDate: '1982-07-07',
    inForceDate: '1983-07-01',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/P-21/',
  },
  {
    id: 'casl',
    actPath: 'E-1.6',
    title: "An Act to promote the efficiency and adaptability of the Canadian economy by regulating certain activities that discourage reliance on electronic means of carrying out commercial activities, and to amend the Canadian Radio-television and Telecommunications Commission Act, the Competition Act, the Personal Information Protection and Electronic Documents Act and the Telecommunications Act",
    titleFr: "Loi visant a promouvoir l'efficacite et la capacite d'adaptation de l'economie canadienne",
    shortName: 'CASL',
    status: 'in_force',
    issuedDate: '2010-12-15',
    inForceDate: '2014-07-01',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/E-1.6/',
  },
  {
    id: 'criminal-code',
    actPath: 'C-46',
    title: 'Criminal Code',
    titleFr: 'Code criminel',
    shortName: 'Criminal Code',
    status: 'in_force',
    issuedDate: '1985-01-01',
    inForceDate: '1985-01-01',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/C-46/',
  },
  {
    id: 'cbca',
    actPath: 'C-44',
    title: 'Canada Business Corporations Act',
    titleFr: 'Loi canadienne sur les societes par actions',
    shortName: 'CBCA',
    status: 'in_force',
    issuedDate: '1985-01-01',
    inForceDate: '1985-01-01',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/C-44/',
  },
  {
    id: 'competition-act',
    actPath: 'C-34',
    title: 'Competition Act',
    titleFr: 'Loi sur la concurrence',
    shortName: 'Competition Act',
    status: 'in_force',
    issuedDate: '1985-01-01',
    inForceDate: '1986-06-19',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/C-34/',
  },
  {
    id: 'telecommunications-act',
    actPath: 'T-3.4',
    title: 'Telecommunications Act',
    titleFr: 'Loi sur les telecommunications',
    shortName: 'Telecommunications Act',
    status: 'in_force',
    issuedDate: '1993-06-23',
    inForceDate: '1993-10-25',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/T-3.4/',
  },
  {
    id: 'bank-act',
    actPath: 'B-1.01',
    title: 'Bank Act',
    titleFr: 'Loi sur les banques',
    shortName: 'Bank Act',
    status: 'in_force',
    issuedDate: '1991-12-13',
    inForceDate: '1992-06-01',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/B-1.01/',
  },
  {
    id: 'copyright-act',
    actPath: 'C-42',
    title: 'Copyright Act',
    titleFr: 'Loi sur le droit d\'auteur',
    shortName: 'Copyright Act',
    status: 'in_force',
    issuedDate: '1985-01-01',
    inForceDate: '1985-01-01',
    url: 'https://laws-lois.justice.gc.ca/eng/acts/C-42/',
  },
];
