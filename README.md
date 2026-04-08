# Canadian Law MCP Server

**The Justice Laws alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fcanadian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/canadian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/canadian-law-mcp?style=social)](https://github.com/Ansvar-Systems/canadian-law-mcp)
[![CI](https://github.com/Ansvar-Systems/canadian-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/canadian-law-mcp/actions/workflows/ci.yml)
[![Provisions](https://img.shields.io/badge/provisions-53%2C954-blue)]()

Query **956 Canadian federal Acts** -- from PIPEDA and the Criminal Code to the Competition Act, Bank Act, Copyright Act, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Canadian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Canadian federal law research means navigating [laws-lois.justice.gc.ca](https://laws-lois.justice.gc.ca), downloading HTML pages across a bilingual site, and manually cross-referencing between Acts and sections. Whether you're:

- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking PIPEDA obligations or CASL requirements
- A **legal tech developer** building tools on Canadian law
- A **researcher** tracing legislative provisions across 956 federal Acts

...you shouldn't need dozens of browser tabs and manual cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Canadian law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://mcp.ansvar.eu/law-ca/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add canadian-law --transport http https://mcp.ansvar.eu/law-ca/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "canadian-law": {
      "type": "url",
      "url": "https://mcp.ansvar.eu/law-ca/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "canadian-law": {
      "type": "http",
      "url": "https://mcp.ansvar.eu/law-ca/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/canadian-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "canadian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/canadian-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "canadian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/canadian-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"What does PIPEDA Section 7 say about consent exceptions?"*
- *"Is CASL still in force?"*
- *"Find provisions about personal information in Canadian law"*
- *"What EU laws does PIPEDA align with?"*
- *"What does Criminal Code s.342.1 say about unauthorized computer use?"*
- *"Search for data breach notification requirements across Canadian statutes"*
- *"Validate the citation 's. 5 PIPEDA'"*
- *"Build a legal stance on competition law enforcement in Canada"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Federal Acts** | 956 statutes | Complete A-Z from Justice Laws Website |
| **Provisions** | 53,954 sections | Full-text searchable with FTS5 |
| **Legal Definitions** | 12,393 definitions | Extracted from all Acts |
| **Database Size** | ~82 MB | Optimized SQLite, portable |
| **Weekly Freshness Checks** | Automated | Drift detection against Justice Laws |

### Largest Acts by Provision Count

| Act | Provisions |
|-----|-----------|
| Criminal Code | 1,644 |
| Bank Act | 1,376 |
| Insurance Companies Act | 1,211 |
| Canada Elections Act | 1,102 |
| Income Tax Act | 760 |
| Excise Tax Act | 683 |
| National Defence Act | 666 |

### Largest Acts by Definition Count

| Act | Definitions |
|-----|------------|
| Income Tax Act | 1,621 |
| Excise Tax Act | 500 |
| Criminal Code | 309 |
| Global Minimum Tax Act | 247 |
| Bank Act | 239 |

**Verified data only** -- every citation is validated against official sources (Department of Justice Canada). Zero LLM-generated content.

---

## Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from the [Justice Laws Website](https://laws-lois.justice.gc.ca) (Department of Justice Canada)
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains statute text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by Act identifier + section number
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
Justice Laws HTML --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                       ^                        ^
                Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search Justice Laws by Act name | Search by plain language: *"personal information consent"* |
| Navigate multi-part statutes manually | Get the exact provision with context |
| Manual cross-referencing between Acts | `build_legal_stance` aggregates across sources |
| "Is this statute still in force?" --> check manually | `check_currency` tool --> answer in seconds |
| Find EU alignment --> dig through EUR-Lex | `get_eu_basis` --> linked EU directives instantly |
| No API, no integration | MCP protocol --> AI-native |

**Traditional:** Search Justice Laws --> Navigate HTML --> Ctrl+F --> Cross-reference between Acts --> Check EUR-Lex for EU adequacy --> Repeat

**This MCP:** *"What are the consent requirements under PIPEDA and how do they align with GDPR?"* --> Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 53,954 provisions with BM25 ranking. Supports quoted phrases, boolean operators, prefix wildcards |
| `get_provision` | Retrieve specific provision by Act identifier + section (e.g., "PIPEDA" + "7", or "Criminal Code" + "342.1") |
| `check_currency` | Check if a statute is in force, amended, or repealed |
| `validate_citation` | Validate citation against database -- zero-hallucination check. Supports "Section 5 PIPEDA", "s. 342.1 Criminal Code" |
| `build_legal_stance` | Aggregate citations from multiple statutes for a legal topic |
| `format_citation` | Format citations per Canadian conventions (full/short/pinpoint) |
| `list_sources` | List all available statutes with metadata, coverage scope, and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### EU/International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations that a Canadian statute aligns with (e.g., PIPEDA-GDPR adequacy) |
| `get_canadian_implementations` | Find Canadian laws aligning with a specific EU act |
| `search_eu_implementations` | Search EU documents with Canadian alignment counts |
| `get_provision_eu_basis` | Get EU law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Canadian statutes against EU directives |

---

## EU Law Integration

Canada is not an EU member state, but certain Canadian laws have significant EU alignment:

- **PIPEDA** has an [EU adequacy decision](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en) for commercial-sector personal data transfers under GDPR (Commission Decision 2002/2/EC, upheld under GDPR Article 45)
- **CASL** aligns with the ePrivacy Directive on commercial electronic messages
- Canada participates in multilateral frameworks (e.g., APEC CBPR, Convention 108+) that share principles with EU data protection

The EU bridge tools allow you to explore these alignment relationships -- checking which Canadian provisions correspond to EU requirements, and vice versa.

> **Note:** EU cross-references reflect alignment and adequacy relationships, not transposition. Canada adopts its own legislative approach, and the EU tools help identify where Canadian and EU law address similar domains.

---

## Data Sources & Freshness

All content is sourced from authoritative Canadian legal databases:

- **[Justice Laws Website](https://laws-lois.justice.gc.ca)** -- Official consolidated Acts and regulations, Department of Justice Canada

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Department of Justice Canada |
| **Retrieval method** | HTML scrape from Justice Laws A-Z index |
| **Languages** | English and French (bilingual -- both official languages) |
| **License** | [Open Government Licence - Canada](https://open.canada.ca/en/open-government-licence-canada) |
| **Coverage** | All 956 consolidated federal Acts |
| **Last ingested** | 2026-02-25 |

### Automated Freshness Checks (Weekly)

A [weekly GitHub Actions workflow](.github/workflows/check-updates.yml) monitors the Justice Laws Website for changes:

| Check | Method |
|-------|--------|
| **Statute amendments** | Drift detection against known provision anchors |
| **New statutes** | Comparison against Justice Laws A-Z index |
| **Repealed statutes** | Status change detection |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from the Justice Laws Website (Department of Justice Canada). However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **EU cross-references** reflect alignment relationships, not transposition
> - **Bilingual system** -- Acts are available in English and French, but only English-language versions were ingested in this release. Verify French text against the official [Justice Laws Website](https://laws-lois.justice.gc.ca)
> - **Provincial and territorial legislation is not included** -- this covers federal Acts only

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/canadian-law-mcp
cd canadian-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest                    # Ingest statutes from Justice Laws
npm run build:db                  # Rebuild SQLite database
npm run drift:detect              # Run drift detection against anchors
npm run check:freshness           # Check for amendments and new Acts
npm run check-updates             # Check for source updates
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~82 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate across 956 Acts

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/automotive-cybersecurity-mcp](https://github.com/Ansvar-Systems/Automotive-MCP)
**Query UNECE R155/R156 and ISO 21434** -- Automotive cybersecurity compliance. `npx @ansvar/automotive-cybersecurity-mcp`

**70+ national law MCPs** covering Australia, Brazil, Canada, China, Denmark, Finland, France, Germany, Ghana, Iceland, India, Ireland, Israel, Italy, Japan, Kenya, Netherlands, Nigeria, Norway, Singapore, Slovenia, South Korea, Sweden, Switzerland, Thailand, UAE, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- French-language provision ingestion
- EU cross-reference expansion (PIPEDA-GDPR mapping)
- Court case law coverage
- Historical statute versions and amendment tracking
- Provincial privacy law summaries (Quebec Law 25, PIPA Alberta/BC)

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (956 Acts, 53,954 provisions, 12,393 definitions)
- [x] EU/international law alignment tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [x] Drift detection and weekly freshness checks
- [ ] French-language provision text
- [ ] Court case law expansion
- [ ] Historical statute versions (amendment tracking)
- [ ] OPC guidance documents
- [ ] Provincial privacy law summaries

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{canadian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Canadian Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/canadian-law-mcp},
  note = {956 Canadian federal Acts with 53,954 provisions and 12,393 definitions}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Department of Justice Canada ([Open Government Licence - Canada](https://open.canada.ca/en/open-government-licence-canada))
- **EU Metadata:** EUR-Lex (EU public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool -- turns out everyone building compliance tools has the same research frustrations.

So we're open-sourcing it. Navigating 956 federal Acts shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
