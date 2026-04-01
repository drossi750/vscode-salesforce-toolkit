# Test Spec: interfaces.ts

## Module Under Test
`src/interfaces.ts` — TypeScript interfaces for SF CLI JSON deserialization.

## Notes
This module contains only interface definitions (no runtime code). Tests here validate that real SF CLI JSON output conforms to the expected shapes.

## Test Cases

### JSON Conformance

#### TS-IF-001: OrgListResult shape
- **Input:** Sample `sf org list --json` output
- **Verify:** Parses into `OrgListResult` with `status: number`, `result.nonScratchOrgs: OrgInfo[]`, `result.scratchOrgs: OrgInfo[]`

#### TS-IF-002: OrgInfo required fields present
- **Input:** Single org entry from `sf org list --json`
- **Verify:** Has `orgId`, `username`, `isDevHub`, `connectedStatus`, `accessToken` fields

#### TS-IF-003: Scratch org specific fields
- **Input:** Scratch org entry
- **Verify:** Has `isExpired`, `expirationDate`, `devHubUsername`, `devHubOrgId`, `defaultMarker`

#### TS-IF-004: ErrorStatus shape
- **Input:** `{"message": "some error", "commandName": "org:list"}`
- **Verify:** Parses with `message` and `commandName` fields

#### TS-IF-005: UserDetailResult shape
- **Input:** Sample `sf org display --verbose --json` output
- **Verify:** Has `status`, `result.username`, `result.accessToken`, `result.instanceUrl`, `result.alias`

#### TS-IF-006: DeploymentResult shape
- **Input:** Sample `sf project deploy start --json` output
- **Verify:** Has `status`, `result.status`, `result.success`, `result.numberComponentsDeployed`, `result.numberTestErrors`

#### TS-IF-007: ReleaseVersionResult shape
- **Input:** Sample `/services/data` REST response entry
- **Verify:** Has `label`, `url`, `version` fields
