# Project: VSCode Salesforce Toolkit

## Overview
A VS Code extension that provides a sidebar UI for managing Salesforce DX orgs (Dev Hubs, Sandboxes, Scratch Orgs). Activates when `sfdx-project.json` is present in the workspace.

**Publisher:** `drossi750`  
**Extension ID:** `drossi750.vscode-salesforce-toolkit`  
**License:** GPL-3.0

## Tech Stack
- **Language:** TypeScript, compiled via webpack
- **Runtime:** VS Code Extension API (`^1.74.0`)
- **CLI dependency:** Salesforce CLI (`sf` binary) — must be installed by the user
- **Key deps:** `request` (REST calls), `renderjson` (JSON rendering in webviews)
- **Build:** `webpack --mode production` (output to `dist/`)
- **Tests:** Mocha + Chai

## Repository & Release
- **Repo:** https://github.com/drossi750/vscode-salesforce-toolkit
- **Marketplace:** https://marketplace.visualstudio.com/items?itemName=drossi750.vscode-salesforce-toolkit
- **Publishing tool:** `vsce publish`
