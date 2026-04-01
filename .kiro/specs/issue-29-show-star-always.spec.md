# Spec: Issue #29 — Show the star to set an org as default all the time

GitHub: https://github.com/drossi750/vscode-salesforce-toolkit/issues/29

## Problem

The star icon (⭐) to set an org as default disappears once that org is already the default. This means:
1. If the default org is changed externally (e.g., via `sf config set target-org=...` in the terminal), the tree still shows the old org as default with no star on the actual default — and the user can't re-select the highlighted one.
2. The user cannot "re-confirm" the default by clicking the star on the already-selected org.

The star icon should always be visible so the user can set any org as default at any time.

## Root Cause

In `package.json`, the menu `when` clauses filter out already-selected orgs:

```json
{"command": "sftk.setScratch", "when": "viewItem == scratch"}
{"command": "sftk.setDevHub", "when": "viewItem == devhub"}
```

When an org is the default, `updateContextValue()` in `orgdataprovider.ts` sets `contextValue` to `scratch.selected` or `devhub.selected`, which no longer matches `viewItem == scratch` or `viewItem == devhub`.

Additionally, the tree only refreshes when the extension itself triggers `populateOrgList()`. External changes to the default org (via CLI) are not detected until a manual refresh.

## Affected Code

- `package.json` → `contributes.menus.view/item/context` entries for `sftk.setScratch` and `sftk.setDevHub`
- `src/orgdataprovider.ts` → `updateContextValue()`, `populateOrgList()`

## Required Changes

### 1. Update `when` clauses in package.json

Change the menu visibility conditions to include both selected and unselected states:

```json
{
    "command": "sftk.setScratch",
    "when": "viewItem == scratch || viewItem == scratch.selected",
    "group": "inline"
}
```

```json
{
    "command": "sftk.setDevHub",
    "when": "viewItem == devhub || viewItem == devhub.selected",
    "group": "inline"
}
```

### 2. (Optional enhancement) Detect external default changes on refresh

When `populateOrgList()` runs, it already reads the current defaults from `sf org list --json` output (`defaultMarker`, `isDefaultDevHubUsername`). This is already correct — the tree will reflect external changes after a manual refresh via the refresh button. No code change needed here, but document this behavior.

## Implementation Detail

The fix is a two-line change in `package.json`. No TypeScript changes required.

The `setScratch()` and `setDevHub()` functions in `extension.ts` already handle being called on an already-default org gracefully — they'll just re-run `sf config set target-org=...` which is idempotent.

## Test Cases

### TS-ISS29-001: Star icon visible on non-default scratch org
- **Setup:** Scratch org with `contextValue === 'scratch'`
- **Expected:** `sftk.setScratch` command icon is visible in the tree item inline actions

### TS-ISS29-002: Star icon visible on already-default scratch org
- **Setup:** Scratch org with `contextValue === 'scratch.selected'`
- **Expected:** `sftk.setScratch` command icon is still visible (currently hidden — this is the bug)

### TS-ISS29-003: Star icon visible on non-default Dev Hub
- **Setup:** Dev Hub with `contextValue === 'devhub'`
- **Expected:** `sftk.setDevHub` command icon is visible

### TS-ISS29-004: Star icon visible on already-default Dev Hub
- **Setup:** Dev Hub with `contextValue === 'devhub.selected'`
- **Expected:** `sftk.setDevHub` command icon is still visible (currently hidden — this is the bug)

### TS-ISS29-005: Re-selecting already-default scratch org is idempotent
- **Setup:** Click star on org that is already the default
- **Expected:** `sf config set target-org=<alias>` runs without error, tree refreshes, org remains default

### TS-ISS29-006: Re-selecting already-default Dev Hub is idempotent
- **Setup:** Click star on Dev Hub that is already the default
- **Expected:** `sf config set target-dev-hub=<alias>` runs without error, tree refreshes

### TS-ISS29-007: External default change reflected after refresh
- **Setup:**
  1. Org A is default in the tree
  2. User runs `sf config set target-org=orgB` in terminal (external change)
  3. User clicks the refresh button in the Org Explorer
- **Expected:** After refresh, Org B shows as default (yellow icon, `scratch.selected`), Org A reverts to non-default (gray icon, `scratch`)

### TS-ISS29-008: Sandbox orgs unaffected (no star icon)
- **Setup:** Sandbox org with `contextValue === 'sandbox'`
- **Expected:** No `setScratch` or `setDevHub` star icon shown (sandboxes are not settable as default via these commands — this is existing correct behavior, should not regress)

### TS-ISS29-009: when clause evaluation with viewItem
- **Verify:** The `when` clause `"viewItem == scratch || viewItem == scratch.selected"` is valid VS Code syntax and correctly evaluates for both context values
