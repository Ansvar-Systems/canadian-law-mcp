# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-XX-XX
### Added
- Initial release of Canadian Law MCP
- `search_legislation` tool for full-text search across all Canadian federal statutes (EN/FR)
- `get_provision` tool for retrieving specific articles/sections
- `get_provision_eu_basis` tool for EU/international cross-references (PIPEDA-GDPR adequacy)
- `list_acts` tool for browsing available legislation
- `get_act_structure` tool for Act table of contents
- `search_regulations` tool for consolidated federal regulations (Professional tier)
- `get_opc_guidance` tool for OPC guidance documents (Professional tier)
- Contract tests with 12 golden test cases
- Drift detection with 6 stable provision anchors
- Health and version endpoints
- Vercel deployment (dual tier bundled free)
- npm package with stdio transport
- MCP Registry publishing
- Bilingual support (English and French)

[Unreleased]: https://github.com/Ansvar-Systems/canadian-law-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Ansvar-Systems/canadian-law-mcp/releases/tag/v1.0.0
