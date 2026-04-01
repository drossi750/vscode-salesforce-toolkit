# Test Spec: resultspanel.ts

## Module Under Test
`src/resultspanel.ts` — Webview panel for displaying JSON output of SF CLI operations.

## Dependencies to Mock
- `vscode.window.createWebviewPanel`
- `vscode.WebviewPanel` (webview.html, reveal, dispose, onDidDispose, onDidChangeViewState, onDidReceiveMessage)
- `utilities.loadFromTemplate`
- `extension.getExtensionPath`, `extension.getContext`

## Test Cases

### ResultsPanel.createOrShow()

#### TS-RP-001: Creates new panel
- **Setup:** `ResultsPanel.currentPanel` is `undefined`
- **Expected:** `createWebviewPanel` called with viewType `'results'`, title `'Results'`

#### TS-RP-002: Disposes previous panel and creates new
- **Setup:** Panel already exists, call `createOrShow` with different operation/results
- **Expected:** Old panel disposed, new panel created (always replaces — no reuse logic unlike OrgInfoPanel)

#### TS-RP-003: Panel options
- **Expected:** `enableScripts: true`, `enableFindWidget: true`, `retainContextWhenHidden: true`

### HTML Generation

#### TS-RP-010: Template receives correct variables
- **Setup:** `createOrShow('sf project deploy start ...', '{"status":0}')`
- **Expected:** `loadFromTemplate` called with varWrapper containing:
  - `cssFile` — URI to `styles.css`
  - `renderjsonFile` — URI to `renderjson.js`
  - `jsFile` — URI to `results_explorer.js`
  - `operation` — the command string
  - `results` — the JSON string

#### TS-RP-011: HTML re-rendered on view state change (panel becomes visible)
- **Setup:** Trigger `onDidChangeViewState` with `panel.visible === true`
- **Expected:** `webview.html` is reassigned

### Disposal

#### TS-RP-020: dispose() cleans up disposables
- **Expected:** Panel disposed, all disposables in `_disposables` array disposed

#### TS-RP-021: disposeIfVisible() when panel exists
- **Expected:** Panel disposed, `currentPanel` cleaned up

#### TS-RP-022: disposeIfVisible() when no panel
- **Expected:** No error thrown

### processReceivedMessage()

#### TS-RP-030: Unknown command
- **Setup:** Send message `{command: 'anything'}`
- **Expected:** Logs 'NOT SUPPORTED' to logging channel (falls through to default case)
