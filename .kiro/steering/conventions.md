# Coding Conventions

## Style
- TypeScript with JSDoc-style `/** */` comments on all exported functions and classes
- GPL-3.0 license header at the top of every `.ts` source file
- Command prefix: `sftk.*` (e.g., `sftk.createScratch`, `sftk.refreshExplorer`)
- Context values for tree items: `devhub`, `sandbox`, `scratch` with `.selected` suffix for defaults

## SF CLI Commands
- Always use the `sf` CLI (not the deprecated `sfdx`)
- Always pass `--json` for machine-parseable output
- Execute with `{cwd: utilities.getWorkspaceRoot()}`

## Error Handling
- Parse stderr as `ErrorStatus` JSON when CLI commands fail
- Show user-facing errors via `vscode.window.showErrorMessage()`
- Log details to the output channel via `utilities.loggingChannel`
- Offer "Show Logs" or "Show Results" buttons on notifications

## Webview Templates
- HTML templates live in `resources/html/` with partials prefixed by `_` (e.g., `_scratch-org-info.html`)
- Variable substitution uses `${varName}` syntax resolved by `loadFromTemplate()`
- Client-side JS communicates with the extension via `vscode.postMessage()`

## Release Process
1. Merge changes to `master`
2. Update `CHANGELOG.md` — commit as `"Update changelog"`
3. Bump version with `npm version patch --no-git-tag-version` — commit as `"<version>"` (e.g., `"1.3.8"`)
4. Tag as `v<version>` (e.g., `v1.3.8`)
5. Publish with `vsce publish`
6. Push to origin with tags: `git push origin master --tags`
