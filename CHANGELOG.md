# Change Log

## 1.4.3

* Fix all GitHub security advisories:
  - @babel/core: arbitrary file read via sourceMappingURL (GHSA-4x5r-pxfx-6jf8)
  - brace-expansion: DoS via exponential-time expansion (GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg)
  - fast-uri: host confusion vulnerabilities (GHSA-v2hh-gcrm-f6hx, GHSA-4c8g-83qw-93j6)
  - js-yaml: quadratic DoS in merge key handling (GHSA-h67p-54hq-rp68, GHSA-52cp-r559-cp3m)
* Removed deprecated `tslint` dependency
* Upgraded `glob` to v11 with updated test runner
* Added brace-expansion override to 5.0.9 for transitive dependencies

## 1.4.2

* Fix uuid vulnerability (GHSA-w5hq-g745-h8pq) — override uuid to 11.1.1

## 1.4.1

* Dependabot bump (fast-uri 3.1.0 → 3.1.2)

## 1.4.0

* Fix #29: Star icon to set default org now visible on already-selected orgs
* Fix #35: Change Alias now properly removes old alias before setting new one
* Replaced deprecated `request` package with Node built-in `https` — resolves all known vulnerabilities
* Removed deprecated `vscode` and `vscode-test` dev dependencies
* Updated mocha, added npm overrides for transitive dependency security

## 1.3.9

* Dependabot bumps (ajv, picomatch)
* Added full test coverage (72 tests)
* Updated test infrastructure (@vscode/test-electron)

## 1.3.8

* Dependabot bumps (lodash, js-yaml, webpack)

## 1.3.6

* Update with new cli binary 'sf'
* Dependabot bumps
* Code refactoring and cleanup

## 1.3.5

* Realign Marketplace version numbering

## 1.3.4

* Optimisation of PNG image file sizes

## 1.3.3

* Update VS Code Marketplace badge url

## 1.3.2 - not released

* Fix TS update issues

## 1.3.1 - not released

* Dependabot bumps
* Other dependencies updates, backward compatible

## 1.3.0

* Dependabot bumps
* Enhancement #18: Check for sfdx-project instead of force-app + deploy default path

## 1.2.4

* Dependabot bumps

## 1.2.3

* Dependabot bumps
* Fixed broken link issue #6

## 1.2.2

* Fixed issue: inline treeview icons showing in other extensions

## 1.2.1

* Fixed issue: blank result view screen on push to scratch org failure

## 1.2.0

* Introduced Results Viewer to show the output of operations
* Refactored resources and methods to improve code reusability

## 1.1.0

* Added GPL license info

## 1.0.0

* Initial release
