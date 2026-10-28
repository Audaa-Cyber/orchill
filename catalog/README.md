# Orchill Skill Catalog

This directory is the human-browsable catalogue generated from the canonical registry at [`registry/skills.json`](../registry/skills.json).

- **221 skills** across **20 categories**
- [Browse all skills](CATALOG.md)
- [Category manifest](categories.json)
- [Browse category folders](categories/)

## Structure

    └── net-and-build-systems/README.md  # .NET & Build Systems (40)
    └── accessibility/README.md  # Accessibility (2)
    └── agent-tooling-and-workflows/README.md  # Agent Tooling & Workflows (15)
    └── ai-and-data/README.md  # AI & Data (10)
    └── animation-and-motion/README.md  # Animation & Motion (2)
    └── backend-and-apis/README.md  # Backend & APIs (12)
    └── cloud-and-devops/README.md  # Cloud & DevOps (25)
    └── content-and-marketing/README.md  # Content & Marketing (19)
    └── creative-coding-and-media/README.md  # Creative Coding & Media (1)
    └── design-systems-and-components/README.md  # Design Systems & Components (3)
    └── developer-tools/README.md  # Developer Tools (15)
    └── documents-and-productivity/README.md  # Documents & Productivity (7)
    └── micro-interactions/README.md  # Micro-interactions (1)
    └── mobile-development/README.md  # Mobile Development (14)
    └── performance-and-optimization/README.md  # Performance & Optimization (2)
    └── react-and-frontend/README.md  # React & Frontend (8)
    └── security/README.md  # Security (5)
    └── seo/README.md  # SEO (4)
    └── testing/README.md  # Testing (26)
    └── ui-ux/README.md  # UI/UX (10)

Each category folder contains a sorted index of skills and links to the canonical payload under `skills/<category-slug>/<skill-id>/`. The registry is the source of truth; this catalogue is generated for browsing.

Regenerate after editing the registry with `npm run catalog:generate`.
