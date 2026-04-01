# Spec: Issue #35 — Fix Change Alias option

GitHub: https://github.com/drossi750/vscode-salesforce-toolkit/issues/35

## Problem

When changing an org's alias via the Org Info Panel, the extension runs `sf alias set newAlias=username` but never removes the old alias. This causes:
- Both old and new aliases point to the same org
- `SFDX: Set a Default Org` shows the org as `old_name.new_name`
- The VS Code status bar still shows the original alias

## Root Cause

`OrgInfoPanel.setOrgAlias()` in `src/orginfopanel.ts` (line ~235) only runs:
```
sf alias set ${message.alias}=${this._orgInfo.username}
```
It never runs `sf alias unset ${oldAlias}` to remove the previous alias.

## Affected Code

- `src/orginfopanel.ts` → `setOrgAlias()` method
- `src/orginfopanel.ts` → `_getHtmlForWebview()` (the alias input field is pre-populated with `orgInfo.alias`)

## Required Changes

### 1. Unset old alias before setting new one

In `setOrgAlias()`, before running `sf alias set`, run `sf alias unset ${oldAlias}` if the org already has an alias and the new alias differs from the old one.

The old alias is available as `this._orgInfo.alias`.

### 2. Update the in-memory orgInfo alias

After a successful alias change, update `this._orgInfo.alias` to the new value so subsequent alias changes within the same panel session also unset correctly.

### 3. Skip if alias unchanged

If `message.alias === this._orgInfo.alias`, do nothing (no CLI calls needed).

## Implementation Detail

```typescript
// In setOrgAlias(), before the existing sf alias set command:
const oldAlias = this._orgInfo.alias;
const newAlias = message.alias;

if (oldAlias === newAlias) {
    return; // no change
}

// Unset old alias first (if one exists)
let unsetCommand = oldAlias ? `sf alias unset ${oldAlias}` : null;
// Then set new alias
let setCommand = `sf alias set ${newAlias}=${this._orgInfo.username}`;

// After success, update in-memory state:
this._orgInfo.alias = newAlias;
```

The unset and set can be chained sequentially (unset first, then set in its callback), or combined as `sf alias unset ${oldAlias} && sf alias set ${newAlias}=${username}`.

## Test Cases

### TS-ISS35-001: Rename alias — old alias is unset
- **Setup:** Org has `alias: 'old-name'`, user enters `'new-name'`
- **Mock:** `cp.exec` succeeds for both commands
- **Expected:**
  - `sf alias unset old-name` executed
  - `sf alias set new-name=<username>` executed
  - `refreshOrgList()` or `setScratch()` called after

### TS-ISS35-002: Set alias on org with no previous alias
- **Setup:** Org has `alias: undefined` or `alias: ''`, user enters `'my-alias'`
- **Expected:**
  - No `sf alias unset` command executed
  - `sf alias set my-alias=<username>` executed

### TS-ISS35-003: Alias unchanged — no-op
- **Setup:** Org has `alias: 'same'`, user enters `'same'`
- **Expected:** No CLI commands executed, no notifications

### TS-ISS35-004: Unset fails — set not attempted
- **Setup:** `sf alias unset` callback returns error
- **Expected:** `showErrorMessage` shown, `sf alias set` NOT executed, alias unchanged

### TS-ISS35-005: Unset succeeds, set fails
- **Setup:** Unset succeeds, set callback returns error
- **Expected:** `showErrorMessage` shown. Old alias is already gone — this is a partial failure state. Log the error.

### TS-ISS35-006: In-memory alias updated after success
- **Setup:** Successful rename from `'old'` to `'new'`
- **Expected:** `this._orgInfo.alias` is `'new'`. A subsequent rename from the same panel session will unset `'new'` (not `'old'`).

### TS-ISS35-007: Default scratch org alias rename updates config
- **Setup:** Org is the default scratch (`defaultMarker === '(U)'`), alias changed from `'old'` to `'new'`
- **Expected:** After alias set, `setScratch(currentOrg)` called with the updated alias so `sf config set target-org=new` runs (not the old alias)

### TS-ISS35-008: Alias sanitization still applies
- **Setup:** User enters `'my org!'`
- **Expected:** Alias sanitized to `'my_org_'` before both unset check and set command

### TS-ISS35-009: Webview alias input reflects new alias
- **Setup:** After successful rename, panel is re-rendered (via `onDidChangeViewState`)
- **Expected:** The alias input field shows the new alias value
