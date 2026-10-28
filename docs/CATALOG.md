# Default Orchill catalog

The catalog is a small, versioned index. Orchill does **not** clone every source when listing or searching. A source directory is fetched only when a user explicitly installs that skill or its category.

- Registry file: [registry/skills.json](../registry/skills.json)
- Schema: [registry/skills.schema.json](../registry/skills.schema.json)
- Upstream source commit for external entries: [anthropics/skills @ dbd4588f9e1033efb41dad4bef2f7947c8993d44](https://github.com/anthropics/skills/commit/dbd4588f9e1033efb41dad4bef2f7947c8993d44)
- License recorded for external entries: Apache-2.0 per skill directory. The skill folder, including its LICENSE.txt and nested files, is copied during installation.

The upstream repository is an external source, not an Orchill-owned project. License verification is not a security review. Read skill instructions and inspect referenced scripts before allowing an agent to use them.

## API & Backend

- **Claude API** (`claude-api`) — Reference and implementation guidance for the Claude API and Anthropic SDKs, including tool use and streaming.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/claude-api)

## Content & Social Media

- **Internal Communications** (`internal-comms`) — Draft internal communications such as status reports, leadership updates, FAQs, and incident reports.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/internal-comms)
- **Slack GIF Creator** (`slack-gif-creator`) — Create and validate animated GIFs optimized for Slack constraints and workflows.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/slack-gif-creator)

## Creative Coding

- **Algorithmic Art** (`algorithmic-art`) — Create original algorithmic art with p5.js, seeded randomness, and interactive parameter exploration.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/algorithmic-art)

## Design Systems & Components

- **Theme Factory** (`theme-factory`) — Apply reusable themes with colors and fonts to slides, documents, reports, and HTML landing pages.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/theme-factory)

## Frontend & React

- **Web Artifacts Builder** (`web-artifacts-builder`) — Build elaborate multi-component React, Tailwind, and shadcn/ui artifacts with state and routing.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/web-artifacts-builder)

## Testing & Quality

- **Web App Testing** (`webapp-testing`) — Test local web applications with Playwright, inspect browser logs, and capture screenshots.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/webapp-testing)

## Tooling & MCP Development

- **Demo Focus Skill** (`demo-focus`) — A minimal example skill that demonstrates Orchill's selective install workflow.  
  License: MIT · Bundled example
- **MCP Builder** (`mcp-builder`) — Guidance for designing and implementing Model Context Protocol servers and tools.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/mcp-builder)
- **Skill Creator** (`skill-creator`) — Create, improve, and evaluate agent skills, including descriptions and trigger quality.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/skill-creator)

## UI/UX Design

- **Brand Guidelines** (`brand-guidelines`) — Apply Anthropic's official brand colors and typography to artifacts that need Anthropic styling.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/brand-guidelines)
- **Canvas Design** (`canvas-design`) — Create original static visual designs, posters, and art for PNG or PDF outputs.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/canvas-design)
- **Frontend Design** (`frontend-design`) — Guidance for distinctive, intentional visual design, aesthetic direction, typography, and polished interfaces.  
  License: Apache-2.0 · [upstream folder](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design)

