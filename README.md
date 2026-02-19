# Canadian Law MCP

Canadian federal law database for the [Model Context Protocol](https://modelcontextprotocol.io/), covering privacy (PIPEDA), anti-spam (CASL), cybercrime, competition, corporate governance, and public sector privacy legislation with bilingual (EN/FR) full-text search.

**MCP Registry:** `eu.ansvar/canadian-law-mcp`
**npm:** `@ansvar/canadian-law-mcp`
**License:** Apache-2.0

---

## Deployment Tier

**MEDIUM** -- dual tier, free database bundled in npm package.

| Tier | Platform | Database | Content |
|------|----------|----------|---------|
| **Free** | Vercel (Hobby) / npm (stdio) | Core federal statutes (~100-180 MB) | Key federal Acts (PIPEDA, CASL, Criminal Code, Privacy Act, Competition Act), FTS search, EU/international cross-references |
| **Professional** | Azure Container Apps / Docker / Local | Full database (~500-800 MB) | + All consolidated Acts and regulations, OPC guidance, provincial privacy law summaries (Quebec Law 25, PIPA Alberta) |

The full database is larger due to the comprehensive scope of consolidated federal legislation and supplementary regulatory guidance. The free tier contains all key cybersecurity, privacy, and commercial legislation from the Justice Laws Website.

---

## Data Sources

| Source | Authority | Method | Update Frequency | License | Coverage |
|--------|-----------|--------|-----------------|---------|----------|
| [Justice Laws Website](https://laws-lois.justice.gc.ca) | Department of Justice Canada | XML Download | Weekly | Open Government Licence - Canada | All consolidated federal Acts and regulations |
| [OPC Guidance](https://www.priv.gc.ca) | Office of the Privacy Commissioner | HTML Scrape | Monthly | Open Government Licence - Canada | PIPEDA interpretation, breach notification guidance |

> Full provenance metadata: [`sources.yml`](./sources.yml)

---

## Quick Start

### Claude Desktop / Cursor (stdio)

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

### Vercel Streamable HTTP (ChatGPT / Claude.ai)

Once deployed, the public endpoint will be available at:

```
https://canadian-law-mcp.vercel.app/api/mcp
```

---

## Tools

| Tool | Description | Free Tier | Professional |
|------|-------------|-----------|-------------|
| `get_provision` | Retrieve a specific section/article from a Canadian federal Act | Yes | Yes |
| `search_legislation` | Full-text search across all federal legislation (EN/FR) | Yes | Yes |
| `list_acts` | List all available Acts with metadata | Yes | Yes |
| `get_act_structure` | Get table of contents / structure of an Act | Yes | Yes |
| `get_provision_eu_basis` | Cross-reference Canadian law to EU/international equivalents | Yes | Yes |
| `search_regulations` | Search consolidated federal regulations | No (upgrade) | Yes |
| `get_opc_guidance` | Retrieve OPC guidance and policy positions on PIPEDA | No (upgrade) | Yes |

---

## Key Legislation Covered

| Act | Domain | Key Topics |
|-----|--------|------------|
| **Personal Information Protection and Electronic Documents Act (PIPEDA)** | Data Protection | Personal information, consent, accountability principles, breach notification, EU adequacy |
| **Consumer Privacy Protection Act (CPPA/Bill C-27)** | Data Protection (proposed) | PIPEDA replacement, AIDA (AI regulation), enhanced enforcement, privacy tribunal |
| **Canada's Anti-Spam Legislation (CASL)** | Electronic Commerce | Commercial electronic messages, consent, unsubscribe mechanism, penalties |
| **Criminal Code (cybercrime provisions)** | Cybercrime | Unauthorized use of computer (s.342.1), mischief to data (s.430), interception (s.184) |
| **Privacy Act** | Public Sector Privacy | Government institutions, personal information, access rights |
| **Canada Business Corporations Act** | Corporate Law | Corporate governance, directors duties, shareholder rights |
| **Competition Act** | Competition Law | Anti-competitive practices, mergers, deceptive marketing |
| **Telecommunications Act** | Communications | Carrier regulation, CRTC powers, network security |

---

## Database Estimates

| Component | Free Tier | Full (Professional) |
|-----------|-----------|---------------------|
| Core federal Acts | ~80-120 MB | ~80-120 MB |
| All consolidated regulations | -- | ~250-400 MB |
| OPC guidance & findings | -- | ~50-80 MB |
| Provincial privacy law summaries | -- | ~30-50 MB |
| Cross-references & metadata | ~5 MB | ~15 MB |
| **Total** | **~100-180 MB** | **~500-800 MB** |

**Delivery strategy:** Free-tier DB bundled in npm package (Strategy A -- fits within Vercel 250 MB function limit). If final size exceeds 250 MB after ingestion, switch to Strategy B (runtime download from GitHub Releases).

---

## Development

```bash
# Clone the repository
git clone https://github.com/Ansvar-Systems/canadian-law-mcp.git
cd canadian-law-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run contract tests
npm run test:contract

# Build database (requires raw data in data/ directory)
npm run build:db

# Build free-tier database
npm run build:db:free

# Run drift detection
npm run drift:detect

# Full validation
npm run validate
```

---

## Architecture

```
canadian-law-mcp/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Test + lint + security scan
│   │   ├── publish.yml               # npm publish on version tags
│   │   ├── check-source-updates.yml  # Data freshness monitoring
│   │   └── drift-detect.yml          # Upstream drift detection
│   ├── SECURITY.md
│   ├── SECURITY-SETUP.md
│   └── ISSUE_TEMPLATE/
│       └── data-error.md
├── data/
│   └── .gitkeep
├── fixtures/
│   ├── golden-tests.json             # 12 contract tests
│   ├── golden-hashes.json            # 6 drift detection anchors
│   └── README.md
├── scripts/
│   ├── build-db.ts
│   ├── build-db-free.ts
│   ├── download-free-db.sh
│   ├── ingest.ts
│   ├── drift-detect.ts
│   └── check-source-updates.ts
├── src/
│   ├── server.ts
│   ├── db.ts
│   └── tools/
│       ├── get-provision.ts
│       ├── search-legislation.ts
│       ├── list-acts.ts
│       ├── get-act-structure.ts
│       ├── get-provision-eu-basis.ts
│       ├── search-regulations.ts
│       └── get-opc-guidance.ts
├── __tests__/
│   ├── unit/
│   ├── contract/
│   │   └── golden.test.ts
│   └── integration/
├── sources.yml
├── server.json
├── package.json
├── tsconfig.json
├── vercel.json
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## Notes on Canadian Privacy Reform

Canada is undergoing major privacy reform. **Bill C-27** (Digital Charter Implementation Act, 2022) proposes three new acts:

1. **Consumer Privacy Protection Act (CPPA)** -- would replace Part 1 of PIPEDA with stronger consent rules, enhanced enforcement powers, and a new Privacy Tribunal
2. **Artificial Intelligence and Data Act (AIDA)** -- would regulate high-impact AI systems
3. **Personal Information and Data Protection Tribunal Act** -- would establish a new administrative tribunal

**Quebec's Law 25** (2023) is currently the strictest provincial privacy law in Canada and has influenced the federal reform process.

This MCP will track both current law and proposed legislation as it progresses through Parliament.

---

## Related Documents

- [MCP Quality Standard](../../mcp-quality-standard.md) -- quality requirements for all Ansvar MCPs
- [MCP Infrastructure Blueprint](../../mcp-infrastructure-blueprint.md) -- infrastructure implementation templates
- [MCP Deployment Tiers](../../mcp-deployment-tiers.md) -- free vs. professional tier strategy
- [MCP Server Registry](../../mcp-server-registry.md) -- operational registry of all MCPs
- [MCP Remote Access](../../mcp-remote-access.md) -- public Vercel endpoint URLs

---

## Security

Report vulnerabilities to **security@ansvar.eu** (48-hour acknowledgment SLA).

See [SECURITY.md](.github/SECURITY.md) for full disclosure policy.

---

**Maintained by:** Ansvar Systems Engineering
**Contact:** hello@ansvar.eu
