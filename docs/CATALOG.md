# Skill Catalog

Orchill's registry is the source of truth for category labels and installation metadata. The catalog currently contains **221 skills** across **20 categories**.

Categories are metadata used by `orchill search`, `orchill list --category`, `orchill categories`, and `orchill install-category`. Each skill's own directory remains intact when installed, including its nested references, scripts, and assets.

> **Imported-skill review status:** 208 skills were imported into the local offline catalog from existing staged skill directories and marketplace imports. Imported instructions are untrusted content. Many imported entries have not had their upstream license, immutable source revision, or security reviewed; a missing license field means unknown, not permission to redistribute. Review before publishing or using with an agent.

## Categories

- **.NET & Build Systems** — 40 skills
- **Accessibility** — 2 skills
- **Agent Tooling & Workflows** — 15 skills
- **AI & Data** — 10 skills
- **Animation & Motion** — 2 skills
- **Backend & APIs** — 12 skills
- **Cloud & DevOps** — 25 skills
- **Content & Marketing** — 19 skills
- **Creative Coding & Media** — 1 skills
- **Design Systems & Components** — 3 skills
- **Developer Tools** — 15 skills
- **Documents & Productivity** — 7 skills
- **Micro-interactions** — 1 skills
- **Mobile Development** — 14 skills
- **Performance & Optimization** — 2 skills
- **React & Frontend** — 8 skills
- **Security** — 5 skills
- **SEO** — 4 skills
- **Testing** — 26 skills
- **UI/UX** — 10 skills

## Skills by category

### .NET & Build Systems

- **Analyzing Dotnet Performance** (`analyzing-dotnet-performance`) — Agent skill for Analyzing Dotnet Performance workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/analyzing-dotnet-performance)

- **Apple Crash Symbolication** (`apple-crash-symbolication`) — Symbolicate .NET runtime frames in Apple platform .ips crash logs (iOS, tvOS, Mac Catalyst, macOS). Extracts UUIDs and addresses from the native backtrace, locates dSYM debug symbols, and runs atos to produce function names with source file and line numbers. Automatically downloads .dwarf symbols from the Microsoft symbol server using Mach-O UUIDs. USE FOR triaging a .NET MAUI or Mono app crash from an .ips file on any Apple platform, resolving native backtrace frames in libcoreclr or libmonosgen-2.0 to .NET runtime source code, retrieving .ips crash logs from a connected iOS device or iPhone, or investigating EXC_CRASH, EXC_BAD_ACCESS, SIGABRT, or SIGSEGV originating from the .NET runtime. DO NOT USE FOR pure Swift/Objective-C crashes with no .NET components, or Android tombstone files. INVOKES Symbolicate-Crash.ps1 script, atos, dwarfdump, idevicecrashreport.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/apple-crash-symbolication)

- **Binlog Failure Analysis** (`binlog-failure-analysis`) — Analyze MSBuild binary logs to diagnose build failures. USE FOR: build errors that are unclear from console output, diagnosing cascading failures across multi-project builds, tracing MSBuild target execution order, and generally any MSBuild build issues. Requires an existing .binlog file. DO NOT USE FOR: generating binlogs (use binlog-generation), binlog MCP startup or connection failures (use troubleshoot-binlog-mcp), non-MSBuild build systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/binlog-failure-analysis)

- **Binlog Generation** (`binlog-generation`) — Generate MSBuild binary logs (binlogs) for build diagnostics and analysis. USE FOR: adding /bl:{} to any dotnet build, test, pack, publish, or restore command to capture a full build execution trace, prerequisite for binlog-failure-analysis and build-perf-diagnostics skills, enabling post-build investigation of errors or performance. Requires MSBuild 17.8+ / .NET 8 SDK+ for {} placeholder; PowerShell must quote the complete switch as '-bl:{}'. DO NOT USE FOR: non-MSBuild build systems (npm, Maven, CMake), analyzing an existing binlog (use binlog-failure-analysis instead), binlog MCP startup failures (use troubleshoot-binlog-mcp).  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/binlog-generation)

- **Build Parallelism** (`build-parallelism`) — Analyze an MSBuild solution, solution filter, or Build.proj that schedules multiple project files. USE FOR: measured idle worker nodes, `-m` that does not scale, a serial ProjectReference critical path, graph builds, or an MSBuild task that builds a Projects list. Requires at least two distinct project files whose scheduling or throughput must be analyzed. DO NOT USE for non-MSBuild build systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/build-parallelism)

- **Build Perf Baseline** (`build-perf-baseline`) — Establish MSBuild/.NET build performance baselines before optimizing. USE FOR: unranked slow builds; cold, warm, incremental or no-op measurements; before/after comparisons; CI output caching; static graph, artifacts output and dependency graph trimming. Start here before build-perf-diagnostics, incremental-build or build-parallelism. DO NOT USE FOR: known repeated-restore fixes (use eliminate-redundant-restores), non-MSBuild builds. For measured target/task/analyzer bottlenecks, use build-perf-diagnostics.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/build-perf-baseline)

- **Build Perf Diagnostics** (`build-perf-diagnostics`) — Diagnose MSBuild bottlenecks from binlog timelines and Target/Task Performance Summaries after build-perf-baseline establishes measurements. USE FOR: unknown build slowness, RAR >5s, analyzers >30% of Csc, one target >50% of build time, node utilization <80%, excessive Copy tasks, finding restore overhead. DO NOT USE FOR: known repeated-restore fixes (use eliminate-redundant-restores), initial baselines (use build-perf-baseline), incremental rebuilds (use incremental-build), parallelism tuning (use build-parallelism), non-MSBuild builds.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/build-perf-diagnostics)

- **Copy To Output Directory** (`copy-to-output-directory`) — Choosing an MSBuild CopyToOutputDirectory / CopyToPublishDirectory mode: Never, PreserveNewest, Always, and IfDifferent (MSBuild 17.13+), plus $(SkipUnchangedFilesOnCopyAlways). USE FOR: removing the per-build Always copy perf hit; resetting output files mutated between builds. DO NOT USE FOR: general incremental-build diagnosis (use incremental-build); non-MSBuild build systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/copy-to-output-directory)

- **Csharp Expert** (`csharp-expert`) — Agent skill for Csharp Expert workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/csharp-expert)

- **Csharp Refactoring** (`csharp-refactoring`) — Safely refactors C#/.NET code without changing behavior. USE FOR any request to refactor, rename, move, extract, inline, merge, consolidate, deduplicate, split, or modernize C# code, including partial/generated declarations, wrappers, public APIs, serialization/reflection/configuration names, friend assemblies, conditional compilation, and multi-targeted projects. Also use when a request calls a feature, bug fix, package/framework upgrade, or public nullability change a refactor and the behavior-changing part must be separated or declined. DO NOT USE FOR ordinary feature or bug fixes not presented as refactoring; standalone upgrades after reclassification (use dotnet-upgrade); adding tests; or formatting-only work.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/csharp-refactoring)

- **Detect Static Dependencies** (`detect-static-dependencies`) — Agent skill for Detect Static Dependencies workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/detect-static-dependencies)

- **Directory Build Organization** (`directory-build-organization`) — USE ONLY for (1) two or more projects with repeated MSBuild policy, targets, or package versions, or (2) an existing Directory.Build.props/targets/rsp hierarchy with an import, placement, or layering defect. A one-project repo without an existing Directory.Build file is outside scope; do not load this skill. Covers centralizing shared policy and targets, Directory.Packages.props across projects, parent hierarchy/import structure, props-versus-targets placement, and folder/project exceptions. An existing hierarchy defect remains in scope when only one project is affected. For property value or condition semantics use property-patterns. Exclude legacy-to-SDK migration and non-MSBuild systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/directory-build-organization)

- **Dotnet Aot Compat** (`dotnet-aot-compat`) — Agent skill for Dotnet Aot Compat workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/dotnet-aot-compat)

- **Dotnet Trace Collect** (`dotnet-trace-collect`) — Guide developers through capturing diagnostic artifacts to diagnose production .NET performance issues. Use when the user needs help choosing diagnostic tools, collecting performance data, or understanding tool trade-offs across different environments (Windows/Linux, .NET Framework/modern .NET, container/non-container).  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/dotnet-trace-collect)

- **Eliminate Redundant Restores** (`eliminate-redundant-restores`) — Remove repeated NuGet restores from multi-step .NET builds safely. USE FOR: build/test/publish steps that each restore, Directory.Build.rsp with -restore, safe restore suppression, NETSDK1004/NETSDK1047 after --no-restore. DO NOT USE FOR: slow first restore, only one restore, version or lock errors, unranked build slowness (use build-perf-baseline).  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/eliminate-redundant-restores)

- **Extension Points** (`extension-points`) — Own MSBuild import and hook discovery. USE FOR: CustomBefore/CustomAfter hooks, ordered wildcard and NuGet auto-imports, control properties, build/buildTransitive packed layout, package ID and file-name matching, per-TFM forwarders, and tracing why assets or hooks are missing, broken, or replaced. An import guard remains in scope when it is one defect in a broader hook/import flow. DO NOT USE for a focused safety verdict on whether one specific Import needs Exists or is an intentionally unguarded package contract; use msbuild-antipatterns. NEVER INVOKE when imports and hook placement already work and the request is only target Inputs/Outputs, incremental skipping, or FileWrites clean tracking; use incremental-build or target-authoring. Exclude props-versus-targets placement and non-MSBuild systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/extension-points)

- **Filter Syntax** (`filter-syntax`) — Reference-only filter syntax for VSTest and MTP with MSTest, NUnit, xUnit v3, and TUnit. Load only after the platform/framework is known and a consumer needs to create or translate a filter. Do not load for unfiltered runs or platform detection. Used by run-tests and mtp-hot-reload; never invoke directly.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/filter-syntax)

- **Including Generated Files** (`including-generated-files`) — Own MSBuild generated-artifact integration. USE FOR: a target that creates or should create source, Content, None, or another physical file but the artifact is missing from compilation or output; target timing; evaluation-time glob misses; $(IntermediateOutputPath) placement; and FileWrites clean tracking. The prompt may describe the generated artifact without naming the producing task. DO NOT USE when the primary defect is general Include/Remove/Update semantics, item metadata or batching, duplicate/overlapping declarations, or a generated-item identity relationship; use item-management. Exclude Roslyn source-generator internals and non-MSBuild systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/including-generated-files)

- **Incremental Build** (`incremental-build`) — Guide for optimizing MSBuild incremental builds. USE FOR: builds slower than expected on subsequent runs, 'nothing changed but it rebuilds anyway', diagnosing why targets re-execute unnecessarily, fixing broken no-op builds. Covers 8 common causes: missing Inputs/Outputs on custom targets, volatile properties in output paths (timestamps/GUIDs), file writes outside tracked Outputs, missing FileWrites registration, glob changes, Visual Studio Fast Up-to-Date Check (FUTDC) issues. Key diagnostic: look for 'Building target completely' vs 'Skipping target' in binlog. DO NOT USE FOR: first-time build slowness (use build-perf-baseline), parallelism issues (use build-parallelism), evaluation-phase slowness (use eval-performance), non-MSBuild build systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/incremental-build)

- **Item Management** (`item-management`) — Own concrete MSBuild ItemGroup and item-expression questions. USE FOR: Include, Remove, Update, item identity and metadata, transforms, filtering, batching, duplicate or overlapping items, and reviews that verify whether those operations are correct. Generated items stay in scope when the central defect is item identity, metadata, batching, duplicate declarations, or glob/Remove/Update semantics. For a generated artifact missing from compilation or output, wrong target timing/path, or FileWrites clean tracking without a broader item-semantics defect, use including-generated-files. The item operation may be broken, suspected, or already correct. Exclude property-only issues, general incrementality with no item question, broad reviews with no concrete item concern, and non-MSBuild systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/item-management)

- **Migrate Dotnet10 To Dotnet11** (`migrate-dotnet10-to-dotnet11`) — Agent skill for Migrate Dotnet10 To Dotnet11 workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/migrate-dotnet10-to-dotnet11)

- **Migrate Dotnet8 To Dotnet9** (`migrate-dotnet8-to-dotnet9`) — Agent skill for Migrate Dotnet8 To Dotnet9 workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/migrate-dotnet8-to-dotnet9)

- **Migrate Dotnet9 To Dotnet10** (`migrate-dotnet9-to-dotnet10`) — Agent skill for Migrate Dotnet9 To Dotnet10 workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/migrate-dotnet9-to-dotnet10)

- **Msbuild** (`msbuild`) — Use only for MSBuild failure investigation, build-performance analysis, or review of existing build XML/extension contracts. A plan to convert a working legacy/non-SDK project to SDK style or migrate packages.config is a project-system migration, NOT a build-file review: do not activate, even to check scope. Framework/API upgrades are also excluded. Activate for advisory Import/Exists hook and NuGet packed-import questions even without a checkout or failed build; .csproj/.fsproj/.vbproj/.props/.targets conditions; custom-target inputs/outputs; .binlog capture/replay; failing dotnet build/restore/pack/publish or MSBuild-based test builds; slow evaluation, compilation, copying, or no-change builds; and controlled timing comparisons. Exclude SDK installation alone, C# refactoring, runtime profiling, assertions after successful builds, and non-MSBuild builds.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/msbuild)

- **Msbuild Antipatterns** (`msbuild-antipatterns`) — DO NOT INVOKE when the primary request explicitly asks to convert, migrate, modernize, or rewrite a legacy/old-style project to SDK style; use msbuild-modernization. Migration prompts often mention ToolsVersion, explicit Compile/Reference entries, packages.config, or Microsoft.CSharp.targets, but merely reviewing or auditing a file that contains those patterns remains in scope here. USE FOR broad review, audit, lint, or maintainability/correctness checks of project/build files, including custom targets; prioritized cross-cutting findings; discrete anti-patterns; F# ordering/FS0039; cross-platform paths; and focused Import safety verdicts. Review/audit is analysis-only unless fixes are requested. For concrete property/item defects use property-patterns/item-management; use target-authoring for implementation and extension-points for NuGet auto-import/layout discovery. Exclude non-MSBuild systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/msbuild-antipatterns)

- **Msbuild Modernization** (`msbuild-modernization`) — Guide for modernizing and migrating MSBuild project files to SDK-style format. USE FOR: converting legacy .csproj/.vbproj with verbose XML to SDK-style, migrating packages.config to PackageReference, removing Properties/AssemblyInfo.cs in favor of auto-generation, eliminating explicit Compile Include lists via implicit globbing, consolidating shared settings into Directory.Build.props. Indicators of legacy projects: ToolsVersion attribute, an Import of Microsoft.CSharp.targets via $(MSBuildToolsPath), .csproj files over 50 lines for simple projects. DO NOT USE FOR: projects already in SDK-style format, non-.NET build systems (npm, Maven, CMake), .NET Framework projects that cannot move to SDK-style.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/msbuild-modernization)

- **Mtp Hot Reload** (`mtp-hot-reload`) — Agent skill for Mtp Hot Reload workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/mtp-hot-reload)

- **Optimizing Ef Core Queries** (`optimizing-ef-core-queries`) — Review and optimize application data access that uses Entity Framework Core (EF Core). Use for EF Core performance and correctness reviews of services, repositories, imports, and background jobs: slow or memory-heavy queries, excessive round-trips, hidden SaveChanges, premature materialization, dynamic query construction, result-graph tracking, bulk writes, DbContext lifetime or overlapping operations, search semantics, paging, raw SQL, and model/index coverage. Use whether or not EF Core owns the schema. For EF Core, not Dapper or raw ADO.NET.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/optimizing-ef-core-queries)

- **Platform Detection** (`platform-detection`) — Agent skill for Platform Detection workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/platform-detection)

- **Property Patterns** (`property-patterns`) — Diagnose and fix concrete MSBuild property defects in projects and existing shared-file hierarchies. USE FOR: conditions, defaults, append versus overwrite, last-write-wins values, OS/TFM checks, portable paths, normalization, and reviews centered on those property defects. Property defects in Directory.Build.* remain in scope, including overwritten values across parent/child imports and conditions that run before TargetFramework is set, even when the fix changes import order or moves a property group to .targets. DO NOT USE FOR: placement-only or import-only requests with no concrete property defect, such as discovering shared files or choosing which file owns a target or customization (use directory-build-organization); item operations; target structure; broad reviews without a concrete property defect; non-MSBuild work.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/property-patterns)

- **Refactor Module** (`refactor-module`) — Transform monolithic Terraform configurations into reusable, maintainable modules following HashiCorp's module design principles and community best practices.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/refactor-module)

- **Resolve Project References** (`resolve-project-references`) — Guide for interpreting ResolveProjectReferences time in MSBuild performance summaries. Activate when ResolveProjectReferences appears as the most expensive target and developers are trying to optimize it directly. Explains that the reported time includes wait time for dependent project builds and is misleading. Guides users to focus on task self-time instead. Do not activate for general build performance -- use build-perf-diagnostics instead.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/resolve-project-references)

- **Setup Local Sdk** (`setup-local-sdk`) — Agent skill for Setup Local Sdk workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/setup-local-sdk)

- **Technology Selection** (`technology-selection`) — Guides technology selection and implementation of AI and ML features in .NET 8+ applications using ML.NET, Microsoft.Extensions.AI (MEAI), Microsoft Agent Framework (MAF), GitHub Copilot SDK, ONNX Runtime, and OllamaSharp. Covers the full spectrum from classic ML through modern LLM orchestration to local inference. Use when adding classification, regression, clustering, anomaly detection, recommendation, LLM integration (text generation, summarization, reasoning), RAG pipelines with vector search, agentic workflows with tool calling, Copilot extensions, or custom model inference via ONNX Runtime to a .NET project. DO NOT USE FOR projects targeting .NET Framework (requires .NET 8+), the task is pure data engineering or ETL with no ML/AI component, or the project needs a custom deep learning training loop (use Python with PyTorch/TensorFlow, then export to ONNX for .NET inference).  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/technology-selection)

- **Template Comparison** (`template-comparison`) — Agent skill for Template Comparison workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/template-comparison)

- **Template Discovery** (`template-discovery`) — Agent skill for Template Discovery workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/template-discovery)

- **Template Instantiation** (`template-instantiation`) — Agent skill for Template Instantiation workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/template-instantiation)

- **Template Smart Defaults** (`template-smart-defaults`) — Agent skill for Template Smart Defaults workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/template-smart-defaults)

- **Template Validation** (`template-validation`) — Agent skill for Template Validation workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/template-validation)

- **Thread Abort Migration** (`thread-abort-migration`) — Agent skill for Thread Abort Migration workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/thread-abort-migration)

### Accessibility

- **Audit Website** (`audit-website`) — Audit a website with the squirrelscan CLI and fix the findings in code. Runs SEO, performance, security, technical, content, accessibility, and 16 other rule categories (300+ rules), returns an LLM-optimized report, then drives an iterative fix loop, mapping issues to source files, applying fixes, and re-auditing until the site scores well. Use to discover and assess website or webapp issues and drive them to fixed.  
  License: See LICENSE file in repository root  
  Source: local import (../.orchill-skills-import/skills/audit-website)

- **Web Design Guidelines** (`web-design-guidelines`) — Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/web-design-guidelines)

### Agent Tooling & Workflows

- **Brainstorming** (`brainstorming`) — You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/brainstorming)

- **Demo Focus Skill** (`demo-focus`) — A minimal example skill that demonstrates Orchill's selective install workflow.  
  License: MIT  
  Source: local import (../examples/demo-focus)

- **Dispatching Parallel Agents** (`dispatching-parallel-agents`) — Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/dispatching-parallel-agents)

- **Executing Plans** (`executing-plans`) — Use when executing an implementation plan in the current session as the implementer yourself — your human partner chose inline execution, or no subagent tool is available  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/executing-plans)

- **Find Skills** (`find-skills`) — Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/find-skills)

- **Firecrawl** (`firecrawl`) — Agent skill for Firecrawl workflows. Review the skill instructions for its exact scope and usage.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/firecrawl)

- **MCP Builder** (`mcp-builder`) — Guidance for designing and implementing Model Context Protocol servers and tools.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Recursive Decomposition** (`recursive-decomposition`) — Decompose dense codebase-wide, multi-document, PDF, and aggregation work even when the input fits the context window, following Recursive Language Models (Zhang, Kraska, Khattab, 2025). Use when the user asks to analyse all files, a whole repo, all docs, large PDFs, or to aggregate or multi-hop across scattered sources. Skip one file, one function, a single needle, or a one-page PDF conversion. Triggers: long context, context rot, large codebase, many files, all files, big document, multi-document, PDF, aggregate, summarize everything, codebase-wide, multi-hop, recursive, sub-agents, map-reduce.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/recursive-decomposition)

- **Skill Builder** (`skill-builder`) — Automatically detect source types and build AI skills using Skill Seekers. Use when the user wants to create skills from documentation, repos, PDFs, videos, or other knowledge sources.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/skill-builder)

- **Skill Creator** (`skill-creator`) — Create, improve, and evaluate agent skills, including descriptions and trigger quality.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Subagent Driven Development** (`subagent-driven-development`) — Use when executing implementation plans with independent tasks in the current session  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/subagent-driven-development)

- **Troubleshoot Binlog Mcp** (`troubleshoot-binlog-mcp`) — Diagnose dotnet-msbuild binlog MCP startup failures. USE FOR: CONNECTION_CLOSED, binlog server won't connect, missing binlog tools, Microsoft.AITools.BinlogMcp not found, dnx launch errors. Checks workspace SDK, feeds, and source mapping without bypassing policy. DO NOT USE FOR: errors inside a binlog (use binlog-failure-analysis), capturing binlogs (use binlog-generation), unrelated MCP servers.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/troubleshoot-binlog-mcp)

- **Using Git Worktrees** (`using-git-worktrees`) — Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/using-git-worktrees)

- **Using Superpowers** (`using-superpowers`) — Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/using-superpowers)

- **Writing Plans** (`writing-plans`) — Use when you have a spec or requirements for a multi-step task, before touching code  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/writing-plans)

### AI & Data

- **Analytics** (`analytics`) — When the user wants to set up, improve, or audit analytics tracking and measurement. Also use when the user mentions "set up tracking," "GA4," "Google Analytics," "event tracking," "UTM parameters," "tag manager," "GTM," "analytics implementation," "tracking plan," "how do I measure this," "Mixpanel," "Segment," "are my events firing," or "analytics isn't working." Use this whenever someone asks how to know if something is working or wants to measure marketing results. For getting conversions into ad platforms (pixels, conversion tags, CAPI, server-side) and verifying they arrived, see conversion-tracking. For choosing attribution models, comparing multi-touch/MMM/incrementality, or reconciling conflicting numbers across tools, see attribution. For A/B test measurement, see ab-testing. Rate metrics divide matching closed windows — never full-period spend by partial-period results.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/analytics)

- **Create Datadriven Aspnetcore** (`create-datadriven-aspnetcore`) — Generate or scaffold ASP.NET Core code — Razor Pages, Blazor components, MVC controllers, views, and Minimal API endpoints — without using ASP.NET Core CLI scaffolding/code-generation tools. Use when (1) adding CRUD pages, views, or API endpoints backed by Entity Framework (EF Core) and a database, (2) generating code to create, read, update, and delete data using a DbContext, (3) scaffolding UI components that match the project's existing CSS framework and coding patterns, or (4) creating data-driven forms, tables, and navigation for a model class. Do not use for non-ASP.NET projects or when CLI-based scaffolding is preferred.  
  License: not verified in catalog  
  Source: local import (../.orchill-marketplace-import-fixed/skills/create-datadriven-aspnetcore)

- **Deep Research** (`deep-research`) — Execute autonomous multi-step research using Google Gemini Deep Research Agent. Use for: market analysis, competitive landscaping, literature reviews, technical research, due diligence. Takes 2-10 minutes but produces detailed, cited reports. Costs $2-5 per task.  
  License: Apache-2.0  
  Source: local import (../.orchill-skills-import/skills/deep-research)

- **Huggingface Community Evals** (`huggingface-community-evals`) — Run evaluations for Hugging Face Hub models using inspect-ai and lighteval on local hardware. Use for backend selection, local GPU evals, and choosing between vLLM / Transformers / accelerate. Not for HF Jobs orchestration, model-card PRs, .eval_results publication, or community-evals automation.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/huggingface-community-evals)

- **Huggingface Datasets** (`huggingface-datasets`) — Use this skill for Hugging Face Dataset Viewer API workflows that fetch subset/split metadata, paginate rows, search text, apply filters, download parquet URLs, and read size or statistics.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/huggingface-datasets)

- **Huggingface Llm Trainer** (`huggingface-llm-trainer`) — Train or fine-tune language and vision models using TRL (Transformer Reinforcement Learning) or Unsloth with Hugging Face Jobs infrastructure. Covers SFT, DPO, GRPO and reward modeling training methods, plus GGUF conversion for local deployment. Includes guidance on the TRL Jobs package, UV scripts with PEP 723 format, dataset preparation and validation, hardware selection, cost estimation, Trackio monitoring, Hub authentication, model selection/leaderboards and model persistence. Use for tasks involving cloud GPU training, GGUF conversion, or when users mention training on Hugging Face Jobs without local GPU setup.  
  License: Complete terms in LICENSE.txt  
  Source: local import (../.orchill-skills-import/skills/huggingface-llm-trainer)

- **Huggingface Trackio** (`huggingface-trackio`) — Track and visualize ML training experiments with Trackio. Use when logging metrics during training (Python API), firing alerts for training diagnostics, or retrieving/analyzing logged metrics (CLI). Supports real-time dashboard visualization, alerts with webhooks, HF Space syncing, and JSON output for automation.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/huggingface-trackio)

- **Imagegen** (`imagegen`) — Generate or edit raster images when the task benefits from AI-created bitmap visuals such as photos, illustrations, textures, sprites, mockups, or transparent-background cutouts. Use when Codex should create a brand-new image, transform an existing image, or derive visual variants from references, and the output should be a bitmap asset rather than repo-native code or vector. Do not use when the task is better handled by editing existing SVG/vector/code-native assets, extending an established icon or logo system, or building the visual directly in HTML/CSS/canvas.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/imagegen)

- **Jupyter Notebook** (`jupyter-notebook`) — Use when the user asks to create, scaffold, or edit Jupyter notebooks (`.ipynb`) for experiments, explorations, or tutorials; prefer the bundled templates and run the helper script `new_notebook.py` to generate a clean starting notebook.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/jupyter-notebook)

- **Sentry** (`sentry`) — Use when the user asks to inspect Sentry issues or events, summarize recent production errors, or pull basic Sentry health data via the Sentry CLI; perform read-only queries using the `sentry` command.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/sentry)

### Animation & Motion

- **Remotion Best Practices** (`remotion-best-practices`) — Router for all Remotion skills  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/remotion-best-practices)

- **Vercel React View Transitions** (`vercel-react-view-transitions`) — Guide for implementing smooth, native-feeling animations using React's View Transition API (`<ViewTransition>` component, `addTransitionType`, and CSS view transition pseudo-elements). Use this skill whenever the user wants to add page transitions, animate route changes, create shared element animations, animate enter/exit of components, animate list reorder, implement directional (forward/back) navigation animations, or integrate view transitions in Next.js. Also use when the user mentions view transitions, `startViewTransition`, `ViewTransition`, transition types, or asks about animating between UI states in React without third-party animation libraries.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/vercel-react-view-transitions)

### Backend & APIs

- **Better Auth Best Practices** (`better-auth-best-practices`) — Configure Better Auth server and client, set up database adapters, manage sessions, add plugins, and handle environment variables. Use when users mention Better Auth, betterauth, auth.ts, or need to set up TypeScript authentication with email/password, OAuth, or plugin configuration.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/better-auth-best-practices)

- **Claude API** (`claude-api`) — Reference and implementation guidance for the Claude API and Anthropic SDKs, including tool use and streaming.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Dotnet Webapi** (`dotnet-webapi`) — Agent skill for Dotnet Webapi workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/dotnet-webapi)

- **Neon Postgres** (`neon-postgres`) — Agent skill for Neon Postgres workflows. Review the skill instructions for its exact scope and usage.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/neon-postgres)

- **Postgres** (`postgres`) — Execute read-only SQL queries against multiple PostgreSQL databases. Use when: (1) querying PostgreSQL databases, (2) exploring database schemas/tables, (3) running SELECT queries for data analysis, (4) checking database contents. Supports multiple database connections with descriptions for intelligent auto-selection. Blocks all write operations (INSERT, UPDATE, DELETE, DROP, etc.) for safety.  
  License: Apache-2.0  
  Source: local import (../.orchill-skills-import/skills/postgres)

- **Resend** (`resend`) — Use when working with the Resend email API — sending transactional emails (single or batch), receiving inbound emails via webhooks, managing email templates, tracking delivery events, managing domains, contacts, broadcasts, webhooks, API keys, inboxes (threads, labels, drafts, replies), automations, events, viewing API request logs, checking account usage and quotas, or setting up the Resend SDK. Always use this skill when the user mentions Resend, even for simple tasks like "send an email with Resend" — the skill contains critical gotchas (idempotency keys, webhook verification, template variable syntax) that prevent common production issues.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/resend)

- **Sanity Best Practices** (`sanity-best-practices`) — Sanity development best practices for schema design, GROQ queries, TypeGen, Visual Editing, images, Portable Text, Studio structure, localization, migrations, Sanity Functions, webhooks, Blueprints, and framework integrations such as Next.js, Nuxt, Astro, Remix, SvelteKit, Angular, Hydrogen, the App SDK, and Studios or apps running in the Sanity Dashboard (defineApplication). Use this skill whenever working with Sanity schemas, defineType or defineField, GROQ or defineQuery, content modeling, Presentation or preview setups, Sanity-powered frontend integrations, event-driven content automation, documentEventHandler, defineDocumentFunction, defineMediaLibraryAssetFunction, @sanity/functions, @sanity/blueprints, sanity.blueprint.ts, event-driven content automation, or when reviewing and fixing a Sanity codebase.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/sanity-best-practices)

- **Supabase Postgres Best Practices** (`supabase-postgres-best-practices`) — Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns (including choosing column types), schema design, migrations and declarative schema files, RLS policies and the tests that verify them, indexes, triggers, database functions, queues and scheduled jobs (pg_cron, pgmq), vector/semantic search (pgvector), and restoring dumps (pg_restore) or importing data. Also load it when diagnosing slow queries, high CPU, timeouts, EXPLAIN plans, connection exhaustion, locking, bloat, or rows visible to the wrong user or tenant. This is not just a performance guide — schema, migration, security, and SQL authoring tasks need these rules too, even for a one-column change or a single query.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/supabase-postgres-best-practices)

- **Target Authoring** (`target-authoring`) — Canonical patterns for writing custom MSBuild targets. USE FOR: diagnosing and fixing custom target authoring anti-patterns; broken SDK target chains across files (e.g., Directory.Build.targets silently redefining SDK targets); targets that replace CompileDependsOn instead of extending it with $(CompileDependsOn); query targets returning stale results from Outputs vs Returns misuse; missing Inputs/Outputs causing unnecessary rebuilds; missing FileWrites registration. Covers DependsOnTargets vs BeforeTargets vs AfterTargets, the Build→CoreBuild three-level pattern, and the $(XxxDependsOn) chain-extension pattern. DO NOT USE FOR: incremental build tuning (use incremental-build), parallelization (use build-parallelism), general anti-patterns (use msbuild-antipatterns), non-MSBuild build systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/target-authoring)

- **Template Authoring** (`template-authoring`) — Agent skill for Template Authoring workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/template-authoring)

- **Tinybird** (`tinybird`) — Tinybird file formats, SQL rules, optimization patterns, and best practices for datasources, pipes, endpoints, and materialized views.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/tinybird)

- **Varlock** (`varlock`) — Secure environment variable management with Varlock. Use when handling secrets, API keys, credentials, or any sensitive configuration. Ensures secrets are never exposed in terminals, logs, traces, or Claude's context. Trigger phrases include "environment variables", "secrets", ".env", "API key", "credentials", "sensitive", "Varlock".  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/varlock)

### Cloud & DevOps

- **Azure App Service** (`azure-app-service`) — Expert knowledge for Azure App Service development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when configuring App Service plans, deployment slots, VNet integration, Entra auth, or managed identities, and other Azure App Service related development tasks. Not for Azure Functions (use azure-functions), Azure Container Apps (use azure-container-apps), Azure Spring Apps (use azure-spring-apps), Azure Static Web Apps (use azure-static-web-apps).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-app-service)

- **Azure Blob Storage** (`azure-blob-storage`) — Expert knowledge for Azure Blob Storage development including troubleshooting, best practices, decision making, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when using tiers/archival, NFS/SFTP/BlobFuse mounts, immutability/WORM, lifecycle policies, or Storage Mover, and other Azure Blob Storage related development tasks. Not for Azure Files (use azure-files), Azure Queue Storage (use azure-queue-storage), Azure Table Storage (use azure-table-storage), Azure Cosmos DB (use azure-cosmos-db).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-blob-storage)

- **Azure Cognitive Search** (`azure-cognitive-search`) — Expert knowledge for Azure AI Search development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when configuring data sources, skillsets, vector/semantic search, indexers, or multi-region search architectures, and other Azure AI Search related development tasks. Not for Azure Cosmos DB (use azure-cosmos-db), Azure Data Explorer (use azure-data-explorer), Azure Synapse Analytics (use azure-synapse-analytics).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-cognitive-search)

- **Azure Container Apps** (`azure-container-apps`) — Expert knowledge for Azure Container Apps development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when configuring ACA auth/networking, workload profiles/GPUs, CI/CD deployments, KEDA/Dapr scaling, or Java microservices, and other Azure Container Apps related development tasks. Not for Azure App Service (use azure-app-service), Azure Functions (use azure-functions), Azure Kubernetes Service (AKS) (use azure-kubernetes-service), Azure Spring Apps (use azure-spring-apps).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-container-apps)

- **Azure Cosmos Db** (`azure-cosmos-db`) — Expert knowledge for Azure Cosmos DB development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when using NoSQL/Mongo/Cassandra/Gremlin/PostgreSQL APIs, change feed, vector search, multi-region HA, or bulk ops, and other Azure Cosmos DB related development tasks. Not for Azure Table Storage (use azure-table-storage), Azure SQL Database (use azure-sql-database), Azure SQL Managed Instance (use azure-sql-managed-instance), Azure Virtual Machines (use azure-virtual-machines).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-cosmos-db)

- **Azure Databricks** (`azure-databricks`) — Expert knowledge for Azure Databricks development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when using Unity Catalog, Lakeflow pipelines, Lakebase, AI Runtime/agents, or external connectors/BI tools, and other Azure Databricks related development tasks. Not for Azure Synapse Analytics (use azure-synapse-analytics), Azure HDInsight (use azure-hdinsight), Azure Data Factory (use azure-data-factory), Azure Machine Learning (use azure-machine-learning).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-databricks)

- **Azure Devops** (`azure-devops`) — Expert knowledge for Azure DevOps development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when managing org/projects, repos, pipelines, work items, dashboards/analytics, or Azure DevOps Server deployments, and other Azure DevOps related development tasks. Not for Azure Boards (use azure-boards), Azure Pipelines (use azure-pipelines), Azure Repos (use azure-repos), Azure Test Plans (use azure-test-plans).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-devops)

- **Azure Functions** (`azure-functions`) — Expert knowledge for Azure Functions development including troubleshooting, best practices, decision making, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when wiring Functions to HTTP/storage/queues, using bindings, VNet/private endpoints, managed identity, or CI/CD deploys, and other Azure Functions related development tasks. Not for Azure App Service (use azure-app-service), Azure Logic Apps (use azure-logic-apps), Azure Container Apps (use azure-container-apps), Azure Kubernetes Service (AKS) (use azure-kubernetes-service).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-functions)

- **Azure Key Vault** (`azure-key-vault`) — Expert knowledge for Azure Key Vault development including troubleshooting, best practices, decision making, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when managing secrets/keys, Private Link, Entra ID auth, BYOK/HSM, or ARM/Bicep/Terraform deployments, and other Azure Key Vault related development tasks. Not for Azure Cloud Hsm (use azure-cloud-hsm), Azure Dedicated HSM (use azure-dedicated-hsm), Azure Payment Hsm (use azure-payment-hsm), Azure Attestation (use azure-attestation).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-key-vault)

- **Azure Kubernetes Service** (`azure-kubernetes-service`) — Expert knowledge for Azure Kubernetes Service (AKS) development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when securing AKS with Entra/RBAC, configuring Fleet, GPUs or KEDA, or running AI/ML, Wasm, or PCI workloads, and other Azure Kubernetes Service (AKS) related development tasks. Not for Azure Container Apps (use azure-container-apps), Azure Container Instances (use azure-container-instances), Azure Container Registry (use azure-container-registry), Azure Red Hat OpenShift (use azure-redhat-openshift).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-kubernetes-service)

- **Azure Machine Learning** (`azure-machine-learning`) — Expert knowledge for Azure Machine Learning development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when using AutoML, Prompt Flow, online/batch endpoints, vector stores/RAG, or Model Catalog in Azure ML, and other Azure Machine Learning related development tasks. Not for Azure Databricks (use azure-databricks), Azure Synapse Analytics (use azure-synapse-analytics), Azure Data Science Virtual Machines (use azure-data-science-vm), Azure HDInsight (use azure-hdinsight).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-machine-learning)

- **Azure Monitor** (`azure-monitor`) — Expert knowledge for Azure Monitor development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when configuring AMA/DCR pipelines, Log Analytics, App Insights, Container/VM monitoring, or Prometheus/OpenTelemetry, and other Azure Monitor related development tasks. Not for Azure Network Watcher (use azure-network-watcher), Azure Service Health (use azure-service-health), Azure Defender For Cloud (use azure-defender-for-cloud), Cost Management (use azure-cost-management).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-monitor)

- **Azure Pipelines** (`azure-pipelines`) — Expert knowledge for Azure Pipelines development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when configuring YAML pipelines, agents, service connections, Key Vault secrets, or Kubernetes/web app deployments, and other Azure Pipelines related development tasks. Not for Azure DevOps (use azure-devops), Azure Boards (use azure-boards), Azure Repos (use azure-repos), Azure Test Plans (use azure-test-plans).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-pipelines)

- **Azure Sql Database** (`azure-sql-database`) — Expert knowledge for Azure SQL Database development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when choosing DTU/vCore tiers, configuring serverless or Hyperscale, geo-replication/DR, CI/CD, or Terraform, and other Azure SQL Database related development tasks. Not for Azure SQL Managed Instance (use azure-sql-managed-instance), SQL Server on Azure Virtual Machines (use azure-sql-virtual-machines), Azure Cosmos DB (use azure-cosmos-db), Azure Data Factory (use azure-data-factory).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-sql-database)

- **Cloudflare** (`cloudflare`) — Discover and choose Cloudflare products for apps, APIs, AI agents, storage, networking, and security. Use for architecture and product selection, including when the user describes a need without naming a Cloudflare product; then find the relevant skill or documentation.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/cloudflare)

- **Cloudflare Deploy** (`cloudflare-deploy`) — Deploy applications and infrastructure to Cloudflare using Workers, Pages, and related platform services. Use when the user asks to deploy, host, publish, or set up a project on Cloudflare.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/cloudflare-deploy)

- **Deploy To Vercel** (`deploy-to-vercel`) — Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push this live", or "create a preview deployment".  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/deploy-to-vercel)

- **Durable Objects** (`durable-objects`) — Build, debug, or review Cloudflare Durable Objects code for persistent state and coordination.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/durable-objects)

- **Netlify Deploy** (`netlify-deploy`) — Deploy web projects to Netlify using the Netlify CLI (`npx netlify`). Use when the user asks to deploy, host, publish, or link a site/repo on Netlify, including preview and production deploys.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/netlify-deploy)

- **Provider Resources** (`provider-resources`) — Agent skill for Provider Resources workflows. Review the skill instructions for its exact scope and usage.  
  License: MPL-2.0  
  Source: local import (../.orchill-skills-import/skills/provider-resources)

- **Render Deploy** (`render-deploy`) — Deploy applications to Render by analyzing codebases, generating render.yaml Blueprints, and providing Dashboard deeplinks. Use when the user wants to deploy, host, publish, or set up their application on Render's cloud platform.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/render-deploy)

- **Terraform Skill** (`terraform-skill`) — Use when writing, reviewing, or debugging Terraform/OpenTofu modules, tests, CI, scans, or state ops - diagnoses failure mode (identity churn, secrets, blast radius, CI drift, state corruption) with version-aware guards.  
  License: Apache-2.0  
  Source: local import (../.orchill-skills-import/skills/terraform-skill)

- **Terraform Style Guide** (`terraform-style-guide`) — Generate Terraform HCL code following HashiCorp's official style conventions and best practices. Use when writing, reviewing, or generating Terraform configurations.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/terraform-style-guide)

- **Vercel Cli With Tokens** (`vercel-cli-with-tokens`) — Deploy and manage projects on Vercel using token-based authentication. Use when working with Vercel CLI using access tokens rather than interactive login — e.g. "deploy to vercel", "set up vercel", "add environment variables to vercel".  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/vercel-cli-with-tokens)

- **Wrangler** (`wrangler`) — Run or troubleshoot Wrangler CLI commands in projects that have a wrangler.jsonc, wrangler.json, or wrangler.toml file, including local development, Previews, deployment, and resource management. For new projects and projects without a Wrangler configuration file, use the cf CLI instead.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/wrangler)

### Content & Marketing

- **Content Research Writer** (`content-research-writer`) — Assists in writing high-quality content by conducting research, adding citations, improving hooks, iterating on outlines, and providing real-time feedback on each section. Transforms your writing process from solo effort to collaborative partnership.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/content-research-writer)

- **Content Strategy** (`content-strategy`) — When the user wants to plan a content strategy, decide what content to create, or figure out what topics to cover. Also use when the user mentions "content strategy," "what should I write about," "content ideas," "blog strategy," "topic clusters," "content planning," "editorial calendar," "content marketing," "content roadmap," "what content should I create," "blog topics," "content pillars," or "I don't know what to write." Use this whenever someone needs help deciding what content to produce, not just writing it. For writing individual pieces, see copywriting. For SEO-specific audits, see seo-audit. For social media content specifically, see social.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/content-strategy)

- **Copy Editing** (`copy-editing`) — When the user wants to edit, review, or improve existing marketing copy, or refresh outdated content. Also use when the user mentions 'edit this copy,' 'review my copy,' 'copy feedback,' 'proofread,' 'polish this,' 'make this better,' 'copy sweep,' 'tighten this up,' 'this reads awkwardly,' 'clean up this text,' 'too wordy,' 'sharpen the messaging,' 'refresh this content,' 'update this page,' 'this content is outdated,' or 'content audit,' 'this sounds like AI,' 'AI slop,' 'de-slop this,' or 'make it sound human.' Use this when the user already has copy and wants it improved or refreshed rather than rewritten from scratch. Every edit removes AI tells such as 'it's not X, it's Y' reveals, 'no X, no Y, no Z' lists, and sentences that trail into extra comma clauses. A request to fix one line gets a point edit that changes only that line. For writing new copy, see copywriting.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/copy-editing)

- **Copywriting** (`copywriting`) — When the user wants to write, rewrite, or improve marketing copy for any page, including homepage, landing pages, pricing pages, feature pages, about pages, or product pages. Also use when the user says "write copy for," "improve this copy," "rewrite this page," "marketing copy," "headline help," "CTA copy," "value proposition," "tagline," "hero section copy," "this copy is weak," "this sounds like AI," "AI slop," "make it sound human," or "help me describe my product." Drafts never use AI tells like "it's not X, it's Y" reveals, "no X, no Y, no Z" lists, or sentences that trail into extra comma clauses. For email copy, see emails. For popup copy, see popups. For editing existing copy, see copy-editing. For the offer underneath the copy (bonuses, guarantees, value framing), see offers. Claims must be supportable, and a declined claim names the evidence that would unlock it. Diagnoses the input first (blank brief, real voice, or point edit) and changes only what it calls for.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/copywriting)

- **Cro** (`cro`) — When the user wants to optimize, improve, or increase conversions on any marketing page or form — including homepage, landing pages, pricing pages, feature pages, lead capture forms, or contact forms. Also use when the user says 'CRO,' 'conversion rate optimization,' 'this page isn't converting,' 'improve conversions,' 'why isn't this page working,' 'my landing page sucks,' 'form abandonment,' 'nobody's converting,' 'low conversion rate,' or 'this page needs work.' Use this even if the user just shares a URL and asks for feedback. For signup/registration flows, see signup. For post-signup activation, see onboarding. For popups/modals, see popups.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/cro)

- **Internal Communications** (`internal-comms`) — Draft internal communications such as status reports, leadership updates, FAQs, and incident reports.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Launch** (`launch`) — When the user wants to plan a product launch, feature announcement, or release strategy. Also use when the user mentions 'launch,' 'Product Hunt,' 'feature release,' 'announcement,' 'go-to-market,' 'beta launch,' 'early access,' 'waitlist,' 'product update,' 'how do I launch this,' 'site launch,' 'go live,' 'pre-launch QA,' 'launch checklist,' 'GTM plan,' 'we're about to ship,' 'changelog,' 'release notes,' or 'what did we ship this week.' Use this whenever someone is preparing to release something publicly. For ongoing marketing after launch, see marketing-ideas. For the offer being launched (bonuses, guarantees, scarcity, naming), see offers.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/launch)

- **Marketing Ideas** (`marketing-ideas`) — When the user needs marketing ideas, inspiration, or strategies for their SaaS or software product. Also use when the user asks for 'marketing ideas,' 'growth ideas,' 'how to market,' 'marketing strategies,' 'marketing tactics,' 'ways to promote,' 'ideas to grow,' 'what else can I try,' 'I don't know how to market this,' 'brainstorm marketing,' or 'what marketing should I do.' Use this as a starting point whenever someone is stuck or looking for inspiration on how to grow. For specific channel execution, see the relevant skill (ads, social, emails, etc.).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/marketing-ideas)

- **Marketing Psychology** (`marketing-psychology`) — When the user wants to apply psychological principles, mental models, or behavioral science to marketing. Also use when the user mentions 'psychology,' 'mental models,' 'cognitive bias,' 'persuasion,' 'behavioral science,' 'why people buy,' 'decision-making,' 'consumer behavior,' 'anchoring,' 'social proof,' 'scarcity,' 'loss aversion,' 'framing,' or 'nudge.' Use this whenever someone wants to understand or leverage how people think and make decisions in a marketing context. For applying psychology to specific pages, see cro; for pricing tactics, see pricing; for copy framing, see copywriting.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/marketing-psychology)

- **Microbenchmarking** (`microbenchmarking`) — Agent skill for Microbenchmarking workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/microbenchmarking)

- **Microsoft Foundry** (`microsoft-foundry`) — Expert knowledge for Microsoft Foundry (aka Azure AI Foundry) development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when building Foundry agents with Azure OpenAI, voice/telephony, Realtime, MCP tools, or LangChain integrations, and other Microsoft Foundry related development tasks. Not for Content Safety in Foundry Control Plane (use azure-content-safety), Azure Content Understanding in Foundry Tools (use azure-content-understanding), Azure Speech in Foundry Tools (use azure-speech), Microsoft Foundry Classic (use microsoft-foundry-classic).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/microsoft-foundry)

- **Microsoft Foundry Classic** (`microsoft-foundry-classic`) — Expert knowledge for Microsoft Foundry Classic (aka Azure AI Foundry classic) development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when configuring Foundry agents, model routing, Azure OpenAI/RAG, multi-agent apps, or secure on-your-data tools, and other Microsoft Foundry Classic related development tasks. Not for Microsoft Foundry (use microsoft-foundry), Microsoft Foundry Local (use microsoft-foundry-local), Content Safety in Foundry Control Plane (use azure-content-safety), Azure Speech in Foundry Tools (use azure-speech).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/microsoft-foundry-classic)

- **Microsoft Foundry Local** (`microsoft-foundry-local`) — Expert knowledge for Microsoft Foundry Local (aka Azure AI Foundry Local) development including best practices, decision making, configuration, and integrations & coding patterns. Use when compiling HF models with Olive, using Foundry Local CLI, embeddings/chat/audio APIs, or OpenAI-style integrations, and other Microsoft Foundry Local related development tasks. Not for Microsoft Foundry (use microsoft-foundry), Microsoft Foundry Classic (use microsoft-foundry-classic), Azure Local (use azure-local), Azure Content Understanding in Foundry Tools (use azure-content-understanding).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/microsoft-foundry-local)

- **Microsoft Foundry Tools** (`microsoft-foundry-tools`) — Expert knowledge for Microsoft Foundry Tools (aka Azure AI services, Azure Cognitive Services) development including troubleshooting, best practices, decision making, architecture & design patterns, limits & quotas, security, configuration, and integrations & coding patterns. Use when using Content Moderator, Content Safety, Content Understanding analyzers, REST/.NET APIs, or document extraction workloads, and other Microsoft Foundry Tools related development tasks. Not for Microsoft Foundry (use microsoft-foundry), Microsoft Foundry Classic (use microsoft-foundry-classic), Microsoft Foundry Local (use microsoft-foundry-local).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/microsoft-foundry-tools)

- **Pricing** (`pricing`) — When the user wants help with pricing decisions, packaging, or monetization strategy. Also use when the user mentions 'pricing,' 'pricing tiers,' 'freemium,' 'free trial,' 'packaging,' 'price increase,' 'value metric,' 'Van Westendorp,' 'willingness to pay,' 'monetization,' 'how much should I charge,' 'my pricing is wrong,' 'pricing page,' 'annual vs monthly,' 'per seat pricing,' 'should I offer a free plan,' 'pricing page teardown,' 'pricing page audit,' 'is my pricing page AI-readable,' or 'can AI read my pricing.' Use this whenever someone is figuring out what to charge, how to structure their plans, or wants to audit a pricing page (for humans and for the AI agents that shortlist tools). For in-app upgrade screens, see paywalls. For offer construction (bonuses, guarantees, value framing, naming) on services/courses/coaching/high-ticket B2B, see offers.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/pricing)

- **Product Marketing** (`product-marketing`) — When the user wants to create or update their product marketing context document. Also use when the user mentions 'product context,' 'marketing context,' 'set up context,' 'positioning,' 'who is my target audience,' 'describe my product,' 'ICP,' 'ideal customer profile,' 'brand voice,' 'tone of voice,' 'brand guidelines,' 'what have we learned,' 'log this learning,' or wants to avoid repeating foundational information across marketing tasks. Use this at the start of any new project before using other marketing skills — it creates `.agents/product-marketing.md` that all other skills reference for product, audience, and positioning context.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/product-marketing)

- **Slack GIF Creator** (`slack-gif-creator`) — Create and validate animated GIFs optimized for Slack constraints and workflows.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Social** (`social`) — When the user wants help creating, scheduling, or optimizing social media content for LinkedIn, Twitter/X, Instagram, TikTok, or Facebook, or wants to do social listening and engagement triage. Also use when the user mentions 'LinkedIn post,' 'Twitter thread,' 'social media,' 'content calendar,' 'social scheduling,' 'engagement,' 'viral content,' 'what should I post,' 'repurpose this content,' 'tweet ideas,' 'LinkedIn carousel,' 'social media strategy,' 'grow my following,' 'TikTok video,' 'Reels,' 'Shorts,' 'video script,' 'video hook,' 'short-form video,' 'create a reel,' 'social listening,' 'brand mentions,' 'competitor monitoring,' 'top posts to comment on,' 'find people asking for,' 'carousel,' 'slide-by-slide,' or 'document post.' Use this for social content, repurposing, scheduling, video scripts, and listening. Posts avoid AI tells like 'it's not X, it's Y' reveals and broetry. For broader content strategy, see content-strategy. For paid ads, see ad-creative. For earned media, see public-relations.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/social)

- **X Article Publisher** (`x-article-publisher`) — Agent skill for X Article Publisher workflows. Review the skill instructions for its exact scope and usage.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/x-article-publisher)

### Creative Coding & Media

- **Algorithmic Art** (`algorithmic-art`) — Create original algorithmic art with p5.js, seeded randomness, and interactive parameter exploration.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

### Design Systems & Components

- **Shadcn** (`shadcn`) — Manages shadcn components and projects — adding, searching, fixing, debugging, styling, and composing UI, including chat interfaces. Provides project context, component docs, and usage examples. Applies when working with shadcn/ui, component registries, presets, --preset codes, or any project with a components.json file. Also triggers for "shadcn init", "create an app with --preset", "switch to --preset", and for building a design system or applying a DESIGN.md or brand spec to shadcn/ui.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/shadcn)

- **Tailwind Design System** (`tailwind-design-system`) — Build scalable design systems with Tailwind CSS v4, design tokens, component libraries, and responsive patterns. Use when creating component libraries, implementing design systems, or standardizing UI patterns.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/tailwind-design-system)

- **Theme Factory** (`theme-factory`) — Apply reusable themes with colors and fonts to slides, documents, reports, and HTML landing pages.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

### Developer Tools

- **Agents Sdk** (`agents-sdk`) — Build, debug, or review Cloudflare Agents SDK applications using the agents package.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/agents-sdk)

- **Check Bin Obj Clash** (`check-bin-obj-clash`) — Detects MSBuild projects with conflicting OutputPath or IntermediateOutputPath. USE FOR: builds failing with 'Cannot create a file when that file already exists', 'The process cannot access the file because it is being used by another process', intermittent build failures that succeed on retry, or missing/overwritten outputs in multi-project or multi-targeting builds where bin/obj (or project.assets.json) collide. Common causes: shared OutputPath, missing AppendTargetFrameworkToOutputPath, extra global properties (e.g. PublishReadyToRun), or SetTargetFramework on a ProjectReference to a single-targeting project. DO NOT USE FOR: file access errors unrelated to MSBuild (OS-level locking), single-project single-TFM builds, non-MSBuild build systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/check-bin-obj-clash)

- **Code Review** (`code-review`) — Perform code reviews following Sentry engineering practices. Use when reviewing pull requests, examining code changes, or providing feedback on code quality. Covers security, performance, testing, and design review.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/code-review)

- **Convert To Cpm** (`convert-to-cpm`) — Agent skill for Convert To Cpm workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/convert-to-cpm)

- **Differential Review** (`differential-review`) — Performs security-focused differential review of code changes. Adapts analysis depth to codebase size, uses git blame for context, calculates blast radius by counting callers, checks test coverage of modified code, and generates a markdown report. Use when reviewing a PR, commit, or diff for security vulnerabilities, checking whether a change re-introduces a previously fixed bug, asking what else a change could break, or finding which modified code has no test covering it.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/differential-review)

- **Dump Collect** (`dump-collect`) — Configure and collect crash dumps for modern .NET applications. USE FOR: enabling automatic crash dumps for CoreCLR or NativeAOT, capturing dumps from running .NET processes, setting up dump collection in Docker or Kubernetes, using dotnet-dump collect or createdump. DO NOT USE FOR: analyzing or debugging dumps, post-mortem investigation with lldb/windbg/dotnet-dump analyze, profiling or tracing, or for .NET Framework processes.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/dump-collect)

- **Gh Address Comments** (`gh-address-comments`) — Help address review/issue comments on the open GitHub PR for the current branch using gh CLI; verify gh auth first and prompt the user to authenticate if not logged in.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/gh-address-comments)

- **Gh Fix Ci** (`gh-fix-ci`) — Use when a user asks to debug or fix failing GitHub PR checks that run in GitHub Actions; use `gh` to inspect checks and logs, summarize failure context, draft a fix plan, and implement only after explicit approval. Treat external providers (for example Buildkite) as out of scope and report only the details URL.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/gh-fix-ci)

- **Hf Cli** (`hf-cli`) — Hugging Face Hub CLI (`hf`) for downloading, uploading, and managing models, datasets, spaces, buckets, repos, papers, jobs, and more on the Hugging Face Hub. Use when: handling authentication; managing local cache; managing Hugging Face Buckets; running or scheduling jobs on Hugging Face infrastructure; managing Hugging Face repos; discussions and pull requests; browsing models, datasets and spaces; reading, searching, or browsing academic papers; managing collections; querying datasets; configuring spaces; setting up webhooks; or deploying and managing HF Inference Endpoints. Make sure to use this skill whenever the user mentions 'hf', 'huggingface', 'Hugging Face', 'huggingface-cli', or 'hugging face cli', or wants to do anything related to the Hugging Face ecosystem and to AI and ML in general. Also use for cloud storage needs like training checkpoints, data pipelines, or agent traces. Use even if the user doesn't explicitly ask for a CLI command. Replaces the deprecated `huggingface-cli`.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/hf-cli)

- **Migrate Nullable References** (`migrate-nullable-references`) — Agent skill for Migrate Nullable References workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/migrate-nullable-references)

- **Migrate Static To Wrapper** (`migrate-static-to-wrapper`) — Agent skill for Migrate Static To Wrapper workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/migrate-static-to-wrapper)

- **Modern Python** (`modern-python`) — Configures Python projects with modern tooling (uv, ruff, ty). Use when creating projects, writing standalone scripts, or migrating from pip/Poetry/mypy/black.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/modern-python)

- **Receiving Code Review** (`receiving-code-review`) — Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/receiving-code-review)

- **Requesting Code Review** (`requesting-code-review`) — Use when completing tasks, implementing major features, or before merging to verify work meets requirements  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/requesting-code-review)

- **Verification Before Completion** (`verification-before-completion`) — Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/verification-before-completion)

### Documents & Productivity

- **Docx** (`docx`) — Use this skill whenever the user wants to create, read, edit, or manipulate Word documents (.docx files) or Word templates (.dotx files). Triggers include: any mention of 'Word doc', 'word document', '.docx', '.dotx', or requests to produce professional documents with formatting like tables of contents, headings, page numbers, or letterheads. Also use when extracting or reorganizing content from .docx or .dotx files, inserting or replacing images in documents, performing find-and-replace in Word files, working with tracked changes or comments, or converting content into a polished Word document. If the user asks for a 'report', 'memo', 'letter', 'template', or similar deliverable as a Word or .docx file, use this skill. Do NOT use for PDFs, spreadsheets, Google Docs, or general coding tasks unrelated to document generation.  
  License: Proprietary. LICENSE.txt has complete terms  
  Source: local import (../.orchill-skills-import/skills/docx)

- **Linear** (`linear`) — Manage issues, projects & team workflows in Linear. Use when the user wants to read, create or updates tickets in Linear.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/linear)

- **Notion Knowledge Capture** (`notion-knowledge-capture`) — Capture conversations and decisions into structured Notion pages; use when turning chats/notes into wiki entries, how-tos, decisions, or FAQs with proper linking.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/notion-knowledge-capture)

- **Openai Docs** (`openai-docs`) — Use when the user asks how to build with OpenAI products or APIs, asks about Codex itself or choosing Codex surfaces, needs up-to-date official documentation with citations, help choosing the latest model for a use case, or model upgrade and prompt-upgrade guidance; use OpenAI docs MCP tools for non-Codex docs questions, use the Codex manual helper first for broad Codex self-knowledge, and restrict fallback browsing to official OpenAI domains.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/openai-docs)

- **Pdf** (`pdf`) — Use this skill whenever the user wants to do anything with PDF files. This includes reading or extracting text/tables from PDFs, combining or merging multiple PDFs into one, splitting PDFs apart, rotating pages, adding watermarks, creating new PDFs, filling PDF forms, encrypting/decrypting PDFs, extracting images, and OCR on scanned PDFs to make them searchable. If the user mentions a .pdf file or asks to produce one, use this skill.  
  License: Proprietary. LICENSE.txt has complete terms  
  Source: local import (../.orchill-skills-import/skills/pdf)

- **Pptx** (`pptx`) — Use this skill any time a .pptx or .potx file is involved in any way — as input, output, or both. This includes: creating slide decks, pitch decks, or presentations; reading, parsing, or extracting text from any .pptx or .potx file (even if the extracted content will be used elsewhere, like in an email or summary); editing, modifying, or updating existing presentations; combining or splitting slide files; working with templates (.potx), layouts, speaker notes, or comments. Trigger whenever the user mentions \"deck,\" \"slides,\" \"presentation,\" or references a .pptx or .potx filename, regardless of what they plan to do with the content afterward. If a .pptx or .potx file needs to be opened, created, or touched, use this skill.  
  License: Proprietary. LICENSE.txt has complete terms  
  Source: local import (../.orchill-skills-import/skills/pptx)

- **Xlsx** (`xlsx`) — Use this skill any time a spreadsheet file is the primary input or output. This means any task where the user wants to: open, read, edit, or fix an existing .xlsx, .xlsm, .xltx, .csv, or .tsv file (e.g., adding columns, computing formulas, formatting, charting, cleaning messy data); create a new spreadsheet from scratch or from other data sources; or convert between tabular file formats. Trigger especially when the user references a spreadsheet file by name or path — even casually (like \"the xlsx in my downloads\") — and wants something done to it or produced from it. Also trigger for cleaning or restructuring messy tabular data files (malformed rows, misplaced headers, junk data) into proper spreadsheets. The deliverable must be a spreadsheet file. Do NOT trigger when the primary deliverable is a Word document, HTML report, standalone Python script, database pipeline, or Google Sheets API integration, even if tabular data is involved.  
  License: Proprietary. LICENSE.txt has complete terms  
  Source: local import (../.orchill-skills-import/skills/xlsx)

### Micro-interactions

- **Emil Design Eng** (`emil-design-eng`) — This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/emil-design-eng)

### Mobile Development

- **Android Tombstone Symbolication** (`android-tombstone-symbolication`) — Symbolicate the .NET runtime frames in an Android tombstone file. Extracts BuildIds and PC offsets from the native backtrace, downloads debug symbols from the Microsoft symbol server, and runs llvm-symbolizer to produce function names with source file and line numbers. USE FOR triaging a .NET MAUI or Mono Android app crash from a tombstone, resolving native backtrace frames in libmonosgen-2.0.so or libcoreclr.so to .NET runtime source code, or investigating SIGABRT, SIGSEGV, or other native signals originating from the .NET runtime on Android. DO NOT USE FOR pure Java/Kotlin crashes, managed .NET exceptions that are already captured in logcat, or iOS crash logs. INVOKES Symbolicate-Tombstone.ps1 script, llvm-symbolizer, Microsoft symbol server.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/android-tombstone-symbolication)

- **Dotnet Maui Doctor** (`dotnet-maui-doctor`) — Agent skill for Dotnet Maui Doctor workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/dotnet-maui-doctor)

- **Eas App Stores** (`eas-app-stores`) — Build and submit iOS and Android apps with EAS to TestFlight, the App Store, or Google Play. Supports Expo and other React Native projects, plus existing native apps. Use for eas.json setup, release pipelines, signing, app versions and build numbers, store submissions, and listing metadata. For Expo websites and API routes, use eas-hosting; for adding React Native screens to a native app, use expo-brownfield.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/eas-app-stores)

- **Expo Native Ui** (`expo-native-ui`) — Build beautiful, native-feeling Expo screens. Covers Apple HIG styling, semantic colors, native controls, SF Symbols, media, visual effects, gradients, storage, and responsive layout. For routing and navigation, use the expo-router skill; for motion and animation, use the expo-animation skill.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/expo-native-ui)

- **Expo Upgrade** (`expo-upgrade`) — Guidelines for upgrading Expo SDK versions and fixing dependency issues  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/expo-upgrade)

- **Ios Simulator Skill** (`ios-simulator-skill`) — Build, test, and drive iOS apps in the Simulator with 30 token-efficient scripts. Use when asked to build or test an Xcode project, launch an app on a simulator, tap/type/swipe through its UI by accessibility label, take screenshots or visual diffs, audit accessibility, read logs or diagnose hangs, or manage simulators (boot, erase, permissions, location, push, appearance). macOS only; needs Xcode, Python 3.12+ and idb.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/ios-simulator-skill)

- **Maui App Lifecycle** (`maui-app-lifecycle`) — Agent skill for Maui App Lifecycle workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/maui-app-lifecycle)

- **Maui Collectionview** (`maui-collectionview`) — Agent skill for Maui Collectionview workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/maui-collectionview)

- **Maui Data Binding** (`maui-data-binding`) — Agent skill for Maui Data Binding workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/maui-data-binding)

- **Maui Dependency Injection** (`maui-dependency-injection`) — Agent skill for Maui Dependency Injection workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/maui-dependency-injection)

- **Maui Safe Area** (`maui-safe-area`) — Agent skill for Maui Safe Area workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/maui-safe-area)

- **Maui Shell Navigation** (`maui-shell-navigation`) — Agent skill for Maui Shell Navigation workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/maui-shell-navigation)

- **Maui Theming** (`maui-theming`) — Agent skill for Maui Theming workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/maui-theming)

- **Swiftui Expert Skill** (`swiftui-expert-skill`) — Use when writing, reviewing, or refactoring SwiftUI code for iOS or macOS, including state and `@Observable` data flow, view composition, resizable layouts, safe areas, display scale, performance, lists, environment, localization, animation, Liquid Glass, and API migration. Also use for iPhone Duo, foldable, or large-display layouts (`NavigationSplitView` on large displays, iPhone tab sidebar, two-column reflow, foldable grids, `ArrangementView`, `ReservedRegion`), hinge effects, vertical bars, `@State` initialization or synthesized-property diagnostics, `@ContentBuilder` ambiguity, `reorderable` drag/drop, custom `AsyncImage` `URLSession`, swipe actions outside List, item-bound `alert`/`confirmationDialog`, `ToolbarOverflowMenu`, `AnimatableValues`, Document APIs (`Document`/`DocumentReader`), and Instruments `.trace` capture or analysis.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/swiftui-expert-skill)

### Performance & Optimization

- **Eval Performance** (`eval-performance`) — Guide for diagnosing and improving MSBuild project evaluation performance. USE FOR: builds slow before any compilation starts, high evaluation time in binlog analysis, expensive glob patterns walking large directories (node_modules, .git, bin/obj), deep import chains (>20 levels), preprocessed output >10K lines indicating heavy evaluation, property functions with file I/O ($([System.IO.File]::ReadAllText(...))), multiple evaluations per project. Covers the 5 MSBuild evaluation phases, glob optimization via DefaultItemExcludes, import chain analysis with /pp preprocessing. DO NOT USE FOR: compilation-time slowness (use build-perf-diagnostics), incremental build issues (use incremental-build), non-MSBuild build systems.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/eval-performance)

- **Web Perf** (`web-perf`) — Audit, diagnose, or optimize website loading and interaction performance, Core Web Vitals, and Lighthouse performance scores.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/web-perf)

### React & Frontend

- **Azure Static Web Apps** (`azure-static-web-apps`) — Expert knowledge for Azure Static Web Apps development including troubleshooting, decision making, limits & quotas, security, configuration, integrations & coding patterns, and deployment. Use when wiring SWA APIs to Azure DBs, configuring custom domains/backends, Entra auth, CI/CD, or plan limits, and other Azure Static Web Apps related development tasks. Not for Azure App Service (use azure-app-service), Azure Functions (use azure-functions), Azure Container Apps (use azure-container-apps), Azure Web Application Firewall (use azure-web-application-firewall).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/azure-static-web-apps)

- **Convert Blazor Server To Webapp** (`convert-blazor-server-to-webapp`) — Agent skill for Convert Blazor Server To Webapp workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/convert-blazor-server-to-webapp)

- **Vercel Composition Patterns** (`vercel-composition-patterns`) — Description requires review; imported from vercel-labs/agent-skills.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/vercel-composition-patterns)

- **Vercel React Best Practices** (`vercel-react-best-practices`) — React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/vercel-react-best-practices)

- **Vercel React Native Skills** (`vercel-react-native-skills`) — Description requires review; imported from vercel-labs/agent-skills.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/vercel-react-native-skills)

- **Web Artifacts Builder** (`web-artifacts-builder`) — Build elaborate multi-component React, Tailwind, and shadcn/ui artifacts with state and routing.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Wp Block Development** (`wp-block-development`) — Use when developing WordPress (Gutenberg) blocks: block.json metadata, register_block_type(_from_metadata), attributes/serialization, supports, dynamic rendering (render.php/render_callback), deprecations/migrations, viewScript vs viewScriptModule, and @wordpress/scripts/@wordpress/create-block build and test workflows.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/wp-block-development)

- **Wp Block Themes** (`wp-block-themes`) — Use when developing WordPress block themes: theme.json (global settings/styles), templates and template parts, patterns, style variations, and Site Editor troubleshooting (style hierarchy, overrides, caching).  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/wp-block-themes)

### Security

- **Clawsec Clawhub Checker** (`clawsec-clawhub-checker`) — ClawHub reputation checker for clawsec-suite. Adds a standalone reputation gate before guarded skill installation.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/clawsec-clawhub-checker)

- **Security Best Practices** (`security-best-practices`) — Perform language and framework specific security best-practice reviews and suggest improvements. Trigger only when the user explicitly requests security best practices guidance, a security review/report, or secure-by-default coding help. Trigger only for supported languages (python, javascript/typescript, go). Do not trigger for general code review, debugging, or non-security tasks.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/security-best-practices)

- **Security Threat Model** (`security-threat-model`) — Repository-grounded threat modeling that enumerates trust boundaries, assets, attacker capabilities, abuse paths, and mitigations, and writes a concise Markdown threat model. Trigger only when the user explicitly asks to threat model a codebase or path, enumerate threats/abuse paths, or perform AppSec threat modeling. Do not trigger for general architecture summaries, code review, or non-security design work.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/security-threat-model)

- **Semgrep Rule Creator** (`semgrep-rule-creator`) — Creates custom Semgrep rules for detecting security vulnerabilities, bug patterns, and code patterns. Use when writing Semgrep rules or building custom static analysis detections.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/semgrep-rule-creator)

- **Variant Analysis** (`variant-analysis`) — Hunts for the other instances of a bug already found — the variants of one root cause across a codebase. Use immediately after a vulnerability, logic bug, or bad pattern turns up in a specific file and the question becomes where else it occurs, including the bare conversational form ("are there others like this?", "is this the same bug?"). Also for generalizing one known instance into a CodeQL or Semgrep query for its whole pattern family, and for triaging a set of look-alike candidates against a known root cause. Not for initial discovery with no bug in hand.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/variant-analysis)

### SEO

- **Programmatic Seo** (`programmatic-seo`) — When the user wants to create SEO-driven pages at scale using templates and data. Also use when the user mentions "programmatic SEO," "template pages," "pages at scale," "directory pages," "location pages," "[keyword] + [city] pages," "comparison pages," "integration pages," "building many pages for SEO," "pSEO," "generate 100 pages," "data-driven pages," "templated landing pages," or "which CMS for pSEO." Use this whenever someone wants to create many similar pages targeting different keywords or locations. For auditing existing SEO issues, see seo-audit. For content strategy planning, see content-strategy.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/programmatic-seo)

- **Schema** (`schema`) — When the user wants to add, fix, or optimize schema markup and structured data on their site. Also use when the user mentions "schema markup," "structured data," "JSON-LD," "rich snippets," "schema.org," "FAQ schema," "product schema," "review schema," "breadcrumb schema," "Google rich results," "knowledge panel," "star ratings in search," or "add structured data." Use this whenever someone wants their pages to show enhanced results in Google. For broader SEO issues, see seo-audit. For AI search optimization, see ai-seo.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/schema)

- **Seo Aeo Best Practices** (`seo-aeo-best-practices`) — SEO and AEO best practices for metadata, Open Graph, sitemaps, robots.txt, hreflang, JSON-LD structured data, EEAT, and content optimized for search engines and AI answer surfaces. Use this skill when implementing page SEO, technical SEO, schema markup, international SEO, AI-overview readiness, or improving content for Google, ChatGPT, Perplexity, and similar assistants.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/seo-aeo-best-practices)

- **Seo Audit** (`seo-audit`) — When the user wants to audit, review, or diagnose SEO issues on their site. Also use when the user mentions "SEO audit," "technical SEO," "why am I not ranking," "SEO issues," "on-page SEO," "meta tags review," "SEO health check," "my traffic dropped," "lost rankings," "not showing up in Google," "site isn't ranking," "Google update hit me," "page speed," "core web vitals," "crawl errors," "indexing issues," "stuck on page 2," "striking distance keywords," "title tag rewrite," "low CTR," "local SEO," "Google Business Profile," or "map pack." Use this even if the user just says something vague like "my SEO is bad" or "help with SEO" — start with an audit. For building pages at scale to target keywords, see programmatic-seo. For adding structured data, see schema. For AI search optimization, see ai-seo.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/seo-audit)

### Testing

- **Assertion Quality** (`assertion-quality`) — Analyze assertion quality, depth, variety, and false confidence in existing tests. ALWAYS USE when asked about weak, shallow, trivial, always-true, self-referential, assertion-free, presence/truthiness-only, or insufficiently diverse assertions, including MSTest, Jest, pytest, and Go. DO NOT USE for direct fixes: writing-mstest-tests owns supplied MSTest assertions; code-testing owns new cases. Use test-gap-analysis when asked whether tests would catch a production change, and test-anti-patterns for general severity-ranked audits.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/assertion-quality)

- **Clr Activation Debugging** (`clr-activation-debugging`) — Agent skill for Clr Activation Debugging workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/clr-activation-debugging)

- **Code Testing** (`code-testing`) — Agent skill for Code Testing workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/code-testing)

- **Code Testing Agent** (`code-testing-agent`) — Agent skill for Code Testing Agent workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/code-testing-agent)

- **Code Testing Extensions** (`code-testing-extensions`) — Agent skill for Code Testing Extensions workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/code-testing-extensions)

- **Coverage Analysis** (`coverage-analysis`) — Agent skill for Coverage Analysis workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/coverage-analysis)

- **Crap Score** (`crap-score`) — Agent skill for Crap Score workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/crap-score)

- **Find Bugs** (`find-bugs`) — Find bugs, security vulnerabilities, and code quality issues in local branch changes. Use when asked to review changes, find bugs, security review, or audit code on the current branch.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/find-bugs)

- **Find Untested Sources** (`find-untested-sources`) — Agent skill for Find Untested Sources workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/find-untested-sources)

- **Generate Testability Wrappers** (`generate-testability-wrappers`) — Agent skill for Generate Testability Wrappers workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/generate-testability-wrappers)

- **Grade Tests** (`grade-tests`) — Agent skill for Grade Tests workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/grade-tests)

- **Playwright Skill** (`playwright-skill`) — Complete browser automation with Playwright. Auto-detects dev servers, writes reusable test scripts, and supports screenshots, responsive checks, UX validation, login flows, link checks, and arbitrary browser automation. Use when the user wants to test a website, automate browser interactions, validate web functionality, or perform browser-based testing.  
  License: MIT  
  Source: local import (../.orchill-skills-import/skills/playwright-skill)

- **Property Based Testing** (`property-based-testing`) — Writes, reviews, and debugs property-based tests — Hypothesis, fast-check, proptest, jqwik, rapid, and Echidna or Medusa for Solidity invariants. Use whenever tests should cover a whole input domain instead of a hand-picked list of examples: encode/decode and serialize/deserialize pairs, parsers, canonicalizers and normalizers, validators, numeric and Decimal types, comparators and sort order, data structures, and smart-contract state invariants. Also use when adding cases to an existing @given, fast-check, or proptest suite, when judging whether existing property tests assert anything real, and when a generator has shrunk a counterexample and you need to tell a wrong property from a genuine bug. Not for coverage-guided binary fuzzing (libFuzzer, AFL), mutation-testing campaigns, static analysis, benchmarking, or end-to-end UI tests.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/property-based-testing)

- **Run Tests** (`run-tests`) — Agent skill for Run Tests workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/run-tests)

- **Scaffold Dotnet Test Project** (`scaffold-dotnet-test-project`) — Agent skill for Scaffold Dotnet Test Project workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/scaffold-dotnet-test-project)

- **Systematic Debugging** (`systematic-debugging`) — Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/systematic-debugging)

- **Test Analysis Extensions** (`test-analysis-extensions`) — Agent skill for Test Analysis Extensions workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/test-analysis-extensions)

- **Test Anti Patterns** (`test-anti-patterns`) — Agent skill for Test Anti Patterns workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/test-anti-patterns)

- **Test Driven Development** (`test-driven-development`) — Use when implementing any feature or bugfix, before writing implementation code  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/test-driven-development)

- **Test Gap Analysis** (`test-gap-analysis`) — Agent skill for Test Gap Analysis workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/test-gap-analysis)

- **Test Smell Detection** (`test-smell-detection`) — Agent skill for Test Smell Detection workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/test-smell-detection)

- **Test Tagging** (`test-tagging`) — Agent skill for Test Tagging workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/test-tagging)

- **Test Value Evidence** (`test-value-evidence`) — Agent skill for Test Value Evidence workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/test-value-evidence)

- **Testability Obstacle** (`testability-obstacle`) — Agent skill for Testability Obstacle workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/testability-obstacle)

- **Web App Testing** (`webapp-testing`) — Test local web applications with Playwright, inspect browser logs, and capture screenshots.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Writing Mstest Tests** (`writing-mstest-tests`) — Agent skill for Writing Mstest Tests workflows. Review the skill instructions for its exact scope and usage.  
  License: MIT  
  Source: local import (../.orchill-marketplace-import-fixed/skills/writing-mstest-tests)

### UI/UX

- **Brand Guidelines** (`brand-guidelines`) — Apply Anthropic's official brand colors and typography to artifacts that need Anthropic styling.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Canvas Design** (`canvas-design`) — Create original static visual designs, posters, and art for PNG or PDF outputs.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Design Taste Frontend** (`design-taste-frontend`) — Agent skill for Design Taste Frontend workflows. Review the skill instructions for its exact scope and usage.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/design-taste-frontend)

- **Figma** (`figma`) — Use the Figma MCP server to fetch design context, screenshots, variables, and assets from Figma, and to translate Figma nodes into production code. Trigger when a task involves Figma URLs, node IDs, design-to-code implementation, or Figma MCP setup and troubleshooting.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/figma)

- **Figma Implement Design** (`figma-implement-design`) — Translates Figma designs into production-ready application code with 1:1 visual fidelity. Use when implementing UI code from Figma files, when user mentions "implement design", "generate code", "implement component", provides Figma URLs, or asks to build components matching Figma specs. For Figma canvas writes via `use_figma`, use `figma-use`.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/figma-implement-design)

- **Frontend Design** (`frontend-design`) — Guidance for distinctive, intentional visual design, aesthetic direction, typography, and polished interfaces.  
  License: Apache-2.0  
  Source: https://github.com/anthropics/skills.git @ dbd4588f9e1033efb41dad4bef2f7947c8993d44

- **Interface Review** (`interface-review`) — Reviews a branch, pull request or uncommitted change for the interface problems it introduced or regressed, across accessibility, layout, writing, typography, color and UI.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/interface-review)

- **Landing Page Design** (`landing-page-design`) — Complete system for building high converting landing pages: intake questions, page structure, layout selection, conversion copywriting, SEO, plus strict visual rules for typography, spacing, corner radius, backgrounds, hero layout, icons, and motion. Use this skill whenever building, editing, styling, reviewing, or writing copy for ANY landing page, marketing site, web UI, page section, component, or prototype, even when the user does not mention design, conversion, tokens, or a design system. Always consult it before choosing page sections, headlines, CTAs, fonts, font sizes, spacing values, border radii, background colors, icons, or transitions.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/landing-page-design)

- **Ui Ux Pro Max** (`ui-ux-pro-max`) — UI/UX design intelligence for web, mobile, and desktop. This skill should be used when designing, building, reviewing, or fixing interfaces, including pages, components, design systems, accessibility, interaction, responsive layout, typography, color, charts, and stack-specific UI implementation. Searchable local data: 79 searchable styles (50 active), 192 product palettes and reasoning profiles, 74 font pairings, 119 UX guidelines, 105 icons, 17 GSAP presets, 25 chart types, and 22 stacks.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/ui-ux-pro-max)

- **Web Design Engineer** (`web-design-engineer`) — Build or redesign polished browser-rendered visual artifacts with HTML/CSS/JavaScript/React: pages, dashboards, prototypes, slide decks, animations, UI mockups, and data visualizations. Use for visual front-end creation, design-system exploration, design critique, or explicit browser acceptance / QA of a web artifact. Not for back-end, CLI, non-visual coding, source-to-longform article conversion, or narration-driven click-through video presentations.  
  License: not verified in catalog  
  Source: local import (../.orchill-skills-import/skills/web-design-engineer)

## Category behavior

- Install one skill with `orchill install <id>`.
- Preview a category with `orchill list --category "<category>"` or `orchill categories`.
- Install every skill in a category with `orchill install-category "<category>"`; Orchill displays the plan and asks for confirmation.
- Use `--yes` only after reviewing the full category plan.
- Orchill copies the complete skill folder. It does not flatten or discard nested files.
