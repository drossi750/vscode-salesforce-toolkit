# Test Spec: orgdataprovider.ts

## Module Under Test
`src/orgdataprovider.ts` — TreeDataProvider for the sidebar org explorer. Contains `OrgDataProvider`, `Org`, and `IconBuilder` classes.

## Dependencies to Mock
- `child_process.exec` — all `sf org list` calls
- `vscode.workspace.getConfiguration()` — for `sftk.showExpiredScratchOrgs`
- `vscode.window.showErrorMessage`
- `utilities.loggingChannel`

## Test Cases

### OrgDataProvider — Constructor & populateOrgList()

#### TS-ODP-001: Successful org list with mixed org types
- **Setup:** Mock `cp.exec` for `sf org list --json` returning JSON with 1 Dev Hub, 1 Sandbox in `nonScratchOrgs` and 2 Scratch Orgs in `scratchOrgs`
- **Expected:**
  - `orgList` contains 2 entries (Dev Hub + Sandbox)
  - Dev Hub has `type === 'devhub'`, `collapsibleState === Expanded`
  - Sandbox has `type === 'sandbox'`
  - `getChildren()` with no arg returns the 2 top-level orgs
  - `getChildren(devHubOrg)` returns scratch orgs whose `devHubOrgId` matches

#### TS-ODP-002: Org list with --all flag when showExpiredScratchOrgs is true
- **Setup:** Mock config `sftk.showExpiredScratchOrgs` to return `true`
- **Expected:** Command executed is `sf org list --all --json`

#### TS-ODP-003: Org list without --all flag when showExpiredScratchOrgs is false
- **Setup:** Mock config to return `false`
- **Expected:** Command executed is `sf org list  --json`

#### TS-ODP-004: CLI error on org list
- **Setup:** Mock `cp.exec` to call back with `err` set and stderr containing `ErrorStatus` JSON
- **Expected:** `showErrorMessage` called with the error message, org list remains empty

#### TS-ODP-005: Empty org list
- **Setup:** Mock response with `{result: {nonScratchOrgs: [], scratchOrgs: []}}`
- **Expected:** `orgList` is empty, `getChildren()` returns `[]`

#### TS-ODP-006: Default Dev Hub identification
- **Setup:** One Dev Hub org with `isDefaultDevHubUsername: true`
- **Expected:** `getDefaultDevHub()` returns that org, org has `isDefault === true`

#### TS-ODP-007: No default Dev Hub
- **Setup:** Dev Hub with `isDefaultDevHubUsername: false`
- **Expected:** `getDefaultDevHub()` returns `undefined`

### OrgDataProvider — Scratch Org Icon Assignment

#### TS-ODP-008: Expired scratch org
- **Setup:** Scratch org with `isExpired: true`
- **Expected:** Icon is `scratch-ko.png`, `position === 10`, `isDefault === false`

#### TS-ODP-009: Default scratch org
- **Setup:** Scratch org with `isExpired: false`, `defaultMarker: '(U)'`
- **Expected:** Icon is `scratch-default.png`, `position === 20`, `isDefault === true`

#### TS-ODP-010: Regular scratch org
- **Setup:** Scratch org with `isExpired: false`, `defaultMarker: ''`
- **Expected:** Icon is `scratch-ok.png`, `position === 15`, `isDefault === false`

### OrgDataProvider — Sorting

#### TS-ODP-011: Orgs sorted by position
- **Setup:** Mix of Dev Hub (position 1), Sandbox (position 5), Scratch orgs
- **Expected:** `getChildren()` returns orgs sorted ascending by position: Dev Hub first, then Sandbox

### OrgDataProvider — setNewDefault()

#### TS-ODP-012: Set new default scratch org
- **Setup:** Two scratch orgs in the list, call `setNewDefault(org2)`
- **Expected:** `org2.isDefault === true`, `org1.isDefault === false`, `refresh()` fires `_onDidChangeTreeData` event

#### TS-ODP-013: Set new default only affects same type
- **Setup:** One Dev Hub (default), one Sandbox. Call `setNewDefault(sandbox)`
- **Expected:** Dev Hub `isDefault` unchanged, Sandbox `isDefault` set to true

### OrgDataProvider — removeFromTree()

#### TS-ODP-014: Remove org from tree
- **Setup:** 3 orgs in list, call `removeFromTree(org2)`
- **Expected:** `orgList` has 2 entries, `org2` is gone, `refresh()` fires

### OrgDataProvider — Lookup Methods

#### TS-ODP-015: getOrgByAlias — found
- **Setup:** Org with alias `'my-scratch'`
- **Expected:** Returns that org

#### TS-ODP-016: getOrgByAlias — not found
- **Setup:** Search for alias `'nonexistent'`
- **Expected:** Returns `undefined`

#### TS-ODP-017: getOrgByAlias — undefined alias
- **Setup:** Search with `undefined`
- **Expected:** Returns `undefined` (guard clause `alias !== undefined`)

#### TS-ODP-018: getOrgByUsername — found
- **Setup:** Org with username `'test@example.com'`
- **Expected:** Returns that org

#### TS-ODP-019: getOrgByUsername — searches both orgList and scratchOrgs
- **Setup:** Target org is in `scratchOrgs` (not in `orgList`)
- **Expected:** Still found because method concatenates both arrays

### Org Class

#### TS-ORG-001: Constructor sets label and tooltip from alias
- **Input:** `OrgInfo` with `alias: 'my-org'`, `username: 'user@test.com'`
- **Expected:** `label === 'my-org'`, `tooltip === 'my-org'`, `description` contains `[user@test.com]`

#### TS-ORG-002: Description includes star marker for default Dev Hub
- **Setup:** Org with `isDefault: true`, `contextValue: 'devhub.selected'`
- **Expected:** `description` starts with `⭐`

#### TS-ORG-003: updateContextValue — scratch selected
- **Setup:** `type = 'scratch'`, `isDefault = true`
- **Expected:** `contextValue === 'scratch.selected'`

#### TS-ORG-004: updateContextValue — sandbox not selected
- **Setup:** `type = 'sandbox'`, `isDefault = false`
- **Expected:** `contextValue === 'sandbox'`

### IconBuilder

#### TS-ICON-001: Returns correct icon paths for each type
- **Input:** Each of `SCRATCH`, `SANDBOX`, `DEVHUB`, `SCRATCH_DEFAULT`, `SCRATCH_EXPIRED`
- **Expected:** Returns `{light, dark}` object with paths containing the correct PNG filename

#### TS-ICON-002: Unknown type falls back to scratch-expired icon
- **Input:** `getIconFor('unknown')`
- **Expected:** Returns paths containing `scratch-ko.png`
