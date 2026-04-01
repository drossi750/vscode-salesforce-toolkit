# Test Spec: utilities.ts

## Module Under Test
`src/utilities.ts` — Helper functions for template loading, user prompts, notifications, and workspace utilities.

## Current Coverage
- `loadFromTemplate()` — basic variable substitution (1 test)
- `getExtension()` — identity check (1 test)

## Test Cases

### loadFromTemplate()

#### TS-UTIL-001: Simple variable substitution
- **Input:** Template with `${var1}`, varWrapper `{var1: 'hello'}`
- **Expected:** `${var1}` replaced with `hello`
- **Status:** Covered

#### TS-UTIL-002: Nested object variable substitution
- **Input:** Template with `${obj.prop}`, varWrapper `{obj: {prop: 'value'}}`
- **Expected:** `${obj.prop}` replaced with `value`
- **Status:** Covered

#### TS-UTIL-003: Multiple occurrences of the same variable
- **Input:** Template containing `${var1}` twice, varWrapper `{var1: 'X'}`
- **Expected:** Only the first occurrence is replaced (current behavior uses `String.replace()` not `replaceAll()`)
- **Verify:** Confirm this is intentional or a bug — the `forEach` loop calls `replace()` per match found by the regex, so if the regex finds both, both get replaced in separate iterations

#### TS-UTIL-004: Template with no variables
- **Input:** Template with plain HTML, no `${}` expressions
- **Expected:** Returns the template content unchanged

#### TS-UTIL-005: Variable resolving to undefined
- **Input:** Template with `${missing}`, varWrapper `{}`
- **Expected:** `eval('_varWrapper.missing')` returns `undefined`, so the placeholder is replaced with the string `"undefined"`
- **Verify:** Document this behavior

#### TS-UTIL-006: Variable resolving to empty string
- **Input:** Template with `${var1}`, varWrapper `{var1: ''}`
- **Expected:** Placeholder replaced with empty string

#### TS-UTIL-007: Variable containing HTML special characters
- **Input:** varWrapper `{var1: '<script>alert("xss")</script>'}`
- **Expected:** Value is inserted as-is (no escaping). Document this as a known behavior since webviews use `localResourceRoots` for security.

#### TS-UTIL-008: File not found
- **Input:** Non-existent template path
- **Expected:** `readFileSync` throws an error

### getWorkspaceRoot()

#### TS-UTIL-009: Workspace with folders
- **Setup:** Mock `vscode.workspace.workspaceFolders` with one entry
- **Expected:** Returns `fsPath` of the first workspace folder

#### TS-UTIL-010: No workspace folders
- **Setup:** Mock `vscode.workspace.workspaceFolders` as `undefined`
- **Expected:** Returns empty string `''`, logs "No active workspace found"

### getDefaultPackageDirectory()

#### TS-UTIL-011: Valid sfdx-project.json with default package directory
- **Setup:** Mock `readFileSync` to return `{"packageDirectories": [{"path": "force-app", "default": true}]}`
- **Expected:** Returns `"force-app"`

#### TS-UTIL-012: sfdx-project.json with multiple package directories
- **Setup:** `{"packageDirectories": [{"path": "other", "default": false}, {"path": "force-app", "default": true}]}`
- **Expected:** Returns `"force-app"` (the one with `default: true`)

#### TS-UTIL-013: sfdx-project.json with no default directory
- **Setup:** `{"packageDirectories": [{"path": "force-app"}]}`
- **Expected:** Returns `undefined` (no entry has `default: true`)

#### TS-UTIL-014: Missing sfdx-project.json
- **Setup:** `readFileSync` throws ENOENT
- **Expected:** Error propagates

### getExtension()

#### TS-UTIL-015: Extension found
- **Status:** Covered

#### TS-UTIL-016: Extension not found
- **Setup:** Mock `vscode.extensions.getExtension` to return `undefined`
- **Expected:** Throws `Error('Extension was not found.')`

### promptAndShowErrorLog() / promptAndShowInfoLog()

#### TS-UTIL-017: User clicks "Show Logs"
- **Setup:** Mock `showErrorMessage` to resolve with `'Show Logs'`
- **Expected:** `loggingChannel.show()` is called

#### TS-UTIL-018: User clicks "Close"
- **Setup:** Mock `showErrorMessage` to resolve with `'Close'`
- **Expected:** `loggingChannel.show()` is NOT called

#### TS-UTIL-019: User dismisses notification
- **Setup:** Mock `showErrorMessage` to resolve with `undefined`
- **Expected:** `loggingChannel.show()` is NOT called

### promptAndShowErrorResultsPanel() / promptAndShowInfoResultsPanel()

#### TS-UTIL-020: User clicks "Show Results"
- **Setup:** Mock `showErrorMessage` to resolve with `'Show Results'`
- **Expected:** `ResultsPanel.createOrShow()` is called with the operation and results args

#### TS-UTIL-021: User dismisses
- **Setup:** Mock to resolve with `undefined`
- **Expected:** `ResultsPanel.createOrShow()` is NOT called

### promptUserInput()

#### TS-UTIL-022: User provides input
- **Setup:** Mock `showInputBox` to resolve with `'my-alias'`
- **Expected:** Returns `'my-alias'`

#### TS-UTIL-023: User cancels input
- **Setup:** Mock `showInputBox` to resolve with `undefined`
- **Expected:** Returns `undefined`
