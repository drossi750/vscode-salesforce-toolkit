# Test Spec: extension.ts

## Module Under Test
`src/extension.ts` — Extension entry point. Registers all `sftk.*` commands and implements top-level org actions.

## Dependencies to Mock
- `child_process.exec`
- `vscode.window` (showWarningMessage, showErrorMessage, showInformationMessage, showInputBox, showQuickPick, withProgress)
- `vscode.workspace` (getConfiguration, findFiles, workspaceFolders)
- `OrgDataProvider` (populateOrgList, getOrgByAlias, removeFromTree, setNewDefault)
- `OrgInfoPanel.disposeIfVisible`
- `utilities.loggingChannel`
- `utilities.getDefaultPackageDirectory`

## Test Cases

### activate()

#### TS-EXT-001: Registers all expected commands
- **Setup:** Call `activate()` with a mock `ExtensionContext`
- **Expected:** The following commands are registered in `context.subscriptions`:
  - `sftk.createScratch`, `sftk.createScratchPalette`
  - `sftk.deleteScratch`, `sftk.deleteScratchPalette`
  - `sftk.openOrg`, `sftk.openOrgSetup`
  - `sftk.logout`
  - `sftk.openOrgDeploymentStatus`
  - `sftk.setScratch`, `sftk.setDevHub`
  - `sftk.purgeExpiredScratchOrgs`
  - `sftk.showOrgInfo`
  - `sftk.refreshExplorer`

#### TS-EXT-002: Sets sftkEnabled context
- **Expected:** `vscode.commands.executeCommand('setContext', 'sftkEnabled', true)` is called

#### TS-EXT-003: Creates OrgDataProvider and registers tree view
- **Expected:** `vscode.window.registerTreeDataProvider('connected-orgs', ...)` is called

### createScratch()

#### TS-EXT-010: No config files found
- **Setup:** `vscode.workspace.findFiles` returns `[]`
- **Expected:** No further prompts shown, function returns early

#### TS-EXT-011: User cancels config file selection
- **Setup:** `findFiles` returns files, `showQuickPick` resolves with `undefined`
- **Expected:** Returns early, no alias prompt shown

#### TS-EXT-012: User cancels alias input
- **Setup:** Config file selected, `showInputBox` for alias resolves with `undefined`
- **Expected:** Returns early, no duration prompt shown

#### TS-EXT-013: Alias already in use
- **Setup:** `orgDataProvider.getOrgByAlias('existing')` returns an org
- **Expected:** `showErrorMessage` shown with "Alias existing is already in use", re-prompts for alias

#### TS-EXT-014: Alias sanitization
- **Setup:** User enters `'my org!'`
- **Expected:** Alias sent to CLI is `'my_org_'` (non-alphanumeric/dash replaced with `_`)

#### TS-EXT-015: User cancels duration input
- **Setup:** Alias provided, `showInputBox` for duration resolves with `undefined`
- **Expected:** Returns early, no CLI command executed

#### TS-EXT-016: Successful scratch org creation
- **Setup:** All inputs provided, `cp.exec` calls back with no error and valid JSON stdout
- **Expected:**
  - `sf org create scratch -f config/<file> -a <alias> -y <days> --json -w <timeout>` executed
  - `orgDataProvider.populateOrgList()` called
  - Info notification shown

#### TS-EXT-017: Failed scratch org creation
- **Setup:** `cp.exec` calls back with `err` set, stderr contains `ErrorStatus` JSON
- **Expected:** Error notification shown, `populateOrgList` NOT called

#### TS-EXT-018: Timeout from configuration
- **Setup:** `sftk.scratchOrgTimeoutOnCreate` config returns `10`
- **Expected:** Command includes `-w 10`

### deleteScratch()

#### TS-EXT-020: User cancels deletion confirmation
- **Setup:** `showWarningMessage` resolves with `undefined`
- **Expected:** No CLI command executed

#### TS-EXT-021: Successful deletion
- **Setup:** User confirms with `'Delete'`, `cp.exec` succeeds
- **Expected:**
  - `sf org delete scratch --target-org <username> -p --json` executed
  - `orgDataProvider.removeFromTree(org)` called before exec
  - `orgDataProvider.populateOrgList()` called after success
  - Info message shown

#### TS-EXT-022: Failed deletion
- **Setup:** User confirms, `cp.exec` calls back with error
- **Expected:** `showErrorMessage` called, `populateOrgList` NOT called

### purgeScratchOrgs()

#### TS-EXT-030: User cancels purge confirmation
- **Setup:** `showWarningMessage` resolves with `undefined`
- **Expected:** No CLI command executed

#### TS-EXT-031: Successful purge
- **Setup:** User confirms with `'Yes'`, `cp.exec` succeeds
- **Expected:**
  - `sf org list --clean --json` executed
  - Info message shown
  - `populateOrgList()` called

#### TS-EXT-032: Failed purge
- **Setup:** `cp.exec` errors
- **Expected:** `showErrorMessage` called

### openOrg()

#### TS-EXT-040: Open org homepage
- **Setup:** Call with org, no path arg
- **Expected:** `sf org open -o <username>` executed (no `--path`)

#### TS-EXT-041: Open org at specific path
- **Setup:** Call with org and path `'/lightning/setup/SetupOneHome/home'`
- **Expected:** `sf org open -o <username> --path /lightning/setup/SetupOneHome/home` executed

#### TS-EXT-042: Open org error
- **Setup:** `cp.exec` errors
- **Expected:** `showErrorMessage` called

### logout()

#### TS-EXT-050: Successful logout
- **Setup:** `cp.exec` succeeds
- **Expected:**
  - `sf org logout --no-prompt --target-org <username>` executed
  - `OrgInfoPanel.disposeIfVisible()` called
  - `orgDataProvider.populateOrgList()` called

#### TS-EXT-051: Failed logout
- **Setup:** `cp.exec` errors
- **Expected:** `showErrorMessage` called, panel NOT disposed

### setScratch()

#### TS-EXT-060: Set default using alias (when alias exists)
- **Setup:** Org with `alias: 'my-scratch'`
- **Expected:** `sf config set target-org=my-scratch` executed

#### TS-EXT-061: Set default using username (when no alias)
- **Setup:** Org with `alias: undefined`, `username: 'test@example.com'`
- **Expected:** `sf config set target-org=test@example.com` executed

#### TS-EXT-062: setNewDefault called before exec
- **Expected:** `orgDataProvider.setNewDefault(org)` called before CLI command

#### TS-EXT-063: populateOrgList called after exec
- **Expected:** `orgDataProvider.populateOrgList()` called in callback

### setDevHub()

#### TS-EXT-070: Set default Dev Hub using alias
- **Setup:** Org with `alias: 'my-hub'`
- **Expected:** `sf config set target-dev-hub=my-hub` executed

#### TS-EXT-071: Set default Dev Hub using username
- **Setup:** Org with no alias
- **Expected:** `sf config set target-dev-hub=<username>` executed

### executeDeployment()

#### TS-EXT-080: User cancels warning
- **Setup:** `showWarningMessage` resolves with `undefined`
- **Expected:** No CLI command executed

#### TS-EXT-081: Test-only deployment (RunLocalTests)
- **Setup:** User confirms, `testOnly: true`
- **Expected:** Command includes `-c` flag: `sf project deploy start -d <dir> -l RunLocalTests -o <username> -c -w 90 --json`

#### TS-EXT-082: Real deployment
- **Setup:** User confirms, `testOnly: false`
- **Expected:** Command does NOT include `-c` flag

#### TS-EXT-083: Successful deployment
- **Setup:** `cp.exec` returns valid `DeploymentResult` JSON with `status: 'Succeeded'`
- **Expected:** Info notification shown with status

#### TS-EXT-084: Failed deployment (CLI error)
- **Setup:** `cp.exec` errors with `ErrorStatus` JSON in stderr
- **Expected:** Error notification shown

#### TS-EXT-085: Failed deployment (JSON parse error)
- **Setup:** `cp.exec` succeeds but stdout is not valid JSON
- **Expected:** Error notification "Error during JSON output parsing."

#### TS-EXT-086: Uses default package directory from sfdx-project.json
- **Setup:** `getDefaultPackageDirectory()` returns `'force-app'`
- **Expected:** Command includes `-d force-app`

### selectConfigFile()

#### TS-EXT-090: Shows quick pick with provided files
- **Setup:** `configFiles = ['dev-scratch-def.json', 'qa-scratch-def.json']`
- **Expected:** `showQuickPick` called with those files

#### TS-EXT-091: Returns selected file
- **Setup:** User selects `'dev-scratch-def.json'`
- **Expected:** Returns `'dev-scratch-def.json'`

### refreshOrgList()

#### TS-EXT-100: Delegates to orgDataProvider.populateOrgList()
- **Expected:** `orgDataProvider.populateOrgList()` called
