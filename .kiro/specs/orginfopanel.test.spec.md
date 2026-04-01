# Test Spec: orginfopanel.ts

## Module Under Test
`src/orginfopanel.ts` — Webview panel for org details, SOQL queries, REST API calls, deploy/retrieve operations.

## Dependencies to Mock
- `vscode.window.createWebviewPanel`
- `vscode.WebviewPanel` (webview.html, webview.postMessage, webview.onDidReceiveMessage, reveal, dispose)
- `child_process.exec`
- `request` (HTTP library for REST calls)
- `vscode.workspace.getConfiguration()` — for `sftk.enableSysAdminActions`
- `utilities.loadFromTemplate`
- `extension.getExtensionPath`, `extension.getContext`, `extension.getOrgDataProvider`
- `extension.setScratch`, `extension.executeLocalTests`, `extension.executeDeployment`

## Test Cases

### OrgInfoPanel.createOrShow()

#### TS-OIP-001: Creates new panel when none exists
- **Setup:** `OrgInfoPanel.currentPanel` is `undefined`
- **Expected:** `createWebviewPanel` called, new panel created, HTML set

#### TS-OIP-002: Reuses panel for same org
- **Setup:** Panel already open for orgA, call `createOrShow(orgA)` again
- **Expected:** `panel.reveal()` called, no new panel created

#### TS-OIP-003: Disposes old panel and creates new for different org
- **Setup:** Panel open for orgA, call `createOrShow(orgB)`
- **Expected:** Old panel disposed, new panel created for orgB

#### TS-OIP-004: Panel options set correctly
- **Expected:** Panel created with `enableScripts: true`, `enableFindWidget: true`, `retainContextWhenHidden: true`, `localResourceRoots` pointing to `resources/`

### HTML Generation (_getHtmlForWebview)

#### TS-OIP-010: Dev Hub org type label
- **Setup:** `orgInfo.isDevHub === true`
- **Expected:** `orgType === 'Dev Hub'`, `orgLabelClass === 'label-red'`

#### TS-OIP-011: Scratch Org type label
- **Setup:** `orgInfo.isDevHub === false`, `orgInfo.devHubUsername` is set
- **Expected:** `orgType === 'Scratch Org'`, `orgLabelClass === 'label-blue'`

#### TS-OIP-012: Sandbox type label
- **Setup:** `orgInfo.isDevHub === false`, `orgInfo.devHubUsername` is falsy
- **Expected:** `orgType === 'Sandbox'`, `orgLabelClass === 'label-green'`

#### TS-OIP-013: Scratch org info fragment included for scratch orgs
- **Setup:** `orgInfo.devHubUsername` is set
- **Expected:** `scratchOrgInfoFragment` and `scratchOrgActionsFragment` are populated from templates

#### TS-OIP-014: Scratch org fragments empty for non-scratch orgs
- **Setup:** `orgInfo.devHubUsername` is falsy
- **Expected:** `scratchOrgInfoFragment === ''`, `scratchOrgActionsFragment === ''`

#### TS-OIP-015: Admin actions fragment when enabled
- **Setup:** `sftk.enableSysAdminActions` config returns `true`
- **Expected:** `adminActionsFragment` populated from `_admin-actions.html`

#### TS-OIP-016: Admin actions fragment when disabled
- **Setup:** Config returns `false`
- **Expected:** `adminActionsFragment === ''`

#### TS-OIP-017: REST API section hidden for non-scratch orgs
- **Setup:** `orgInfo.devHubUsername` is falsy
- **Expected:** `restApiSection === 'hidden'`

#### TS-OIP-018: REST API section visible for scratch orgs
- **Setup:** `orgInfo.devHubUsername` is set
- **Expected:** `restApiSection === ''`

#### TS-OIP-019: Expired org shows red status
- **Setup:** `orgInfo.isExpired === true`
- **Expected:** `expirationStatus` contains `red.png` and `Expired`

#### TS-OIP-020: Active org shows green status
- **Setup:** `orgInfo.isExpired === false`
- **Expected:** `expirationStatus` contains `green.png` and `Active`

#### TS-OIP-021: Snapshot defaults to N/A
- **Setup:** `orgInfo.snapshot` is falsy
- **Expected:** `sourceSnapshot === 'N/A'`

### processReceivedMessage() — Command Routing

#### TS-OIP-030: 'open' command
- **Expected:** `vscode.commands.executeCommand('sftk.openOrg', orgInfo)` called

#### TS-OIP-031: 'setup' command
- **Expected:** `vscode.commands.executeCommand('sftk.openOrgSetup', orgInfo)` called

#### TS-OIP-032: 'logout' command
- **Expected:** `vscode.commands.executeCommand('sftk.logout', orgInfo)` called

#### TS-OIP-033: 'delete' command
- **Expected:** `vscode.commands.executeCommand('sftk.deleteScratch', orgInfo)` called

#### TS-OIP-034: 'deploymentStatus' command
- **Expected:** `vscode.commands.executeCommand('sftk.openOrgDeploymentStatus', orgInfo)` called

#### TS-OIP-035: 'runLocalTests' command
- **Expected:** `executeLocalTests(orgInfo)` called

#### TS-OIP-036: 'deploySpecific' command
- **Expected:** `executeDeployment(orgInfo, false)` called

### setOrgAlias()

#### TS-OIP-040: Successful alias change
- **Setup:** Message `{alias: 'new-alias'}`, `cp.exec` succeeds
- **Expected:** `sf alias set new-alias=<username>` executed, `refreshOrgList()` called

#### TS-OIP-041: Alias change for default scratch org
- **Setup:** `orgInfo.defaultMarker === '(U)'`, `getOrgDataProvider().getOrgByUsername()` returns an org
- **Expected:** `setScratch(currentOrg)` called after alias set (to update the default config)

#### TS-OIP-042: Alias change for default scratch — org not found
- **Setup:** `defaultMarker === '(U)'`, `getOrgByUsername()` returns `undefined`
- **Expected:** `showErrorMessage` with "Unexpected error: org ... not found"

#### TS-OIP-043: Alias change error
- **Setup:** `cp.exec` errors
- **Expected:** `showErrorMessage` shown, `refreshOrgList` NOT called

### executeQueryAndShowResults()

#### TS-OIP-050: Successful SOQL query
- **Setup:** Message `{soql: 'SELECT Id FROM Account', limit: '50', format: 'human'}`, `cp.exec` succeeds
- **Expected:**
  - `sf data query -o <username> -q "SELECT Id FROM Account LIMIT 50" -r human` executed
  - `postMessage({command: 'showQueryResults', data: stdout})` called

#### TS-OIP-051: SOQL query with JSON format
- **Setup:** `format: 'json'`
- **Expected:** Command includes `-r json`

#### TS-OIP-052: SOQL query with CSV format
- **Setup:** `format: 'csv'`
- **Expected:** Command includes `-r csv`

#### TS-OIP-053: SOQL query error
- **Setup:** `cp.exec` errors
- **Expected:** `showErrorMessage` called, `postMessage` called with `JSON.stringify(err)`

### deploySource()

#### TS-OIP-060: Deploy with standard options
- **Setup:** Message `{overwrite: 'standard'}`
- **Expected:** `sf project deploy start  -o <username> --json` (no `--ignore-conflicts`)

#### TS-OIP-061: Deploy with overwrite conflicts
- **Setup:** Message `{overwrite: 'overwrite'}`
- **Expected:** Command includes `--ignore-conflicts`

#### TS-OIP-062: Deploy success
- **Setup:** `cp.exec` succeeds
- **Expected:** `promptAndShowInfoResultsPanel` called

#### TS-OIP-063: Deploy error — stderr
- **Setup:** `cp.exec` errors, stderr has content
- **Expected:** `promptAndShowErrorResultsPanel` called with stderr

#### TS-OIP-064: Deploy error — stdout fallback
- **Setup:** `cp.exec` errors, stderr is empty, stdout has error content
- **Expected:** `promptAndShowErrorResultsPanel` called with stdout (the `stderr ? stderr : stdout` fallback)

### retrieveSource()

#### TS-OIP-070: Retrieve with standard options
- **Setup:** Message `{overwrite: 'standard'}`
- **Expected:** `sf project retrieve start  -o <username> --json` (no `--ignore-conflicts`)

#### TS-OIP-071: Retrieve with overwrite
- **Setup:** Message `{overwrite: 'overwrite'}`
- **Expected:** Command includes `--ignore-conflicts`

#### TS-OIP-072: Retrieve success
- **Expected:** `promptAndShowInfoResultsPanel` called

#### TS-OIP-073: Retrieve error
- **Expected:** `promptAndShowErrorResultsPanel` called

### fetchReleaseVersion()

#### TS-OIP-080: Successful version fetch
- **Setup:** Mock `request` to return `[{label: 'Spring 24', version: '60.0', url: '/services/data/v60.0'}]`
- **Expected:** `postMessage({command: 'setRelease', release: 'Spring 24', apiVersion: '60.0', restUrl: '/services/data/v60.0'})` called

#### TS-OIP-081: Version fetch error
- **Setup:** `request` calls back with error
- **Expected:** `promptAndShowErrorLog` called

#### TS-OIP-082: Version fetch after panel disposed
- **Setup:** Panel disposed before callback fires
- **Expected:** `postMessage` NOT called (guarded by `!this.panelDisposed`)

### executeRestCall()

#### TS-OIP-090: Successful REST call
- **Setup:** `sf org display` returns valid `UserDetailResult`, `request` returns body
- **Expected:**
  - URL constructed as `instanceUrl + message.url`
  - Authorization header uses `OAuth <accessToken>`
  - `postMessage({command: 'showRestCallResults', body: body})` called

#### TS-OIP-091: REST call — org display error
- **Setup:** `cp.exec` for `sf org display` errors
- **Expected:** `showErrorMessage` called, no HTTP request made

#### TS-OIP-092: REST call — HTTP error
- **Setup:** `sf org display` succeeds, `request` calls back with error
- **Expected:** `promptAndShowErrorLog` called

#### TS-OIP-093: REST call after panel disposed
- **Setup:** Panel disposed before HTTP callback
- **Expected:** `postMessage` NOT called

### generateAndShowAccessLink()

#### TS-OIP-100: Successful access link generation
- **Setup:** `sf org display` returns `{instanceUrl: 'https://test.salesforce.com', accessToken: 'TOKEN123'}`
- **Expected:** `postMessage({command: 'showAccessLink', accessLinkUrl: 'https://test.salesforce.com/secur/frontdoor.jsp?sid=TOKEN123'})` called

#### TS-OIP-101: Instance URL with trailing slash
- **Setup:** `instanceUrl: 'https://test.salesforce.com/'`
- **Expected:** No double slash: `https://test.salesforce.com/secur/frontdoor.jsp?sid=TOKEN123`

#### TS-OIP-102: Access link generation error
- **Setup:** `cp.exec` errors
- **Expected:** `showErrorMessage` called

### Disposal

#### TS-OIP-110: dispose() cleans up
- **Expected:** `panelDisposed` set to `true`, panel disposed, all disposables disposed

#### TS-OIP-111: disposeIfVisible() when panel exists
- **Expected:** Panel disposed

#### TS-OIP-112: disposeIfVisible() when no panel
- **Expected:** No error thrown
