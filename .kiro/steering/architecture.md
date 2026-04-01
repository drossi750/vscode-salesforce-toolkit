# Architecture

## Source Layout
```
src/
├── extension.ts        # Entry point: activate(), command registrations, top-level actions
├── orgdataprovider.ts  # TreeDataProvider for the sidebar org explorer
├── orginfopanel.ts     # Webview panel: org details, SOQL, REST API, deploy/retrieve
├── resultspanel.ts     # Webview panel: shows JSON output of operations
├── interfaces.ts       # TypeScript interfaces for SF CLI JSON deserialization
└── utilities.ts        # Helpers: template loading, prompts, notifications, workspace utils

resources/
├── html/               # Webview HTML templates and partials (_scratch-org-info.html, etc.)
│   └── scripts/        # Client-side JS (org_info.js, results_explorer.js, renderjson.js, styles.css)
└── *.png, *.gif        # Icons and screenshots
```

## Key Patterns

### Extension Activation
- Triggered by `workspaceContains:sfdx-project.json` (in `package.json`)
- `activate()` registers all `sftk.*` commands and creates the `OrgDataProvider` tree

### Salesforce CLI Interaction
- All SF operations use `child_process.exec()` calling the `sf` CLI binary
- Commands output `--json` and results are parsed via the interfaces in `interfaces.ts`
- Common pattern: `cp.exec(command, {cwd: workspaceRoot}, callback)` with error/stdout handling

### Webview Panels
- **OrgInfoPanel** and **ResultsPanel** follow the singleton pattern (`createOrShow` static factory)
- HTML is built from template files using `utilities.loadFromTemplate()` which does `${variable}` substitution via `eval()`
- Webview ↔ extension communication via `postMessage` / `onDidReceiveMessage`

### Tree View (Org Explorer)
- `OrgDataProvider` implements `TreeDataProvider<Org>`
- Calls `sf org list --json` to populate the tree
- Org types: Dev Hub, Sandbox, Scratch (with expired/default variants)
- Icons are color-coded: blue=DevHub, green=Sandbox, gray=Scratch, yellow=Default Scratch

### Configuration Settings
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `sftk.scratchOrgTimeoutOnCreate` | integer | 5 | Timeout in minutes for scratch org creation |
| `sftk.showExpiredScratchOrgs` | boolean | false | Show expired scratch orgs in explorer |
| `sftk.enableSysAdminActions` | boolean | false | Enable advanced admin actions (experimental) |
