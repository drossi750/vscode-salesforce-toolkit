// Copyright (C) 2020 Davide Rossi
// 
// This file is part of vscode-salesforce-toolkit.
// 
// vscode-salesforce-toolkit is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// vscode-salesforce-toolkit is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with vscode-salesforce-toolkit.  If not, see <http://www.gnu.org/licenses/>.

import * as vscode from 'vscode';
import { window } from 'vscode';
import { OrgDataProvider, Org } from './orgdataprovider';
import { isNullOrUndefined } from 'util';
import { ErrorStatus, OrgListResult, OrgInfo, DeploymentResult } from './interfaces';
import { OrgInfoPanel } from './orginfopanel';

export const loggingChannel = vscode.window.createOutputChannel('Salesforce Toolkit Logs');
export var _extensionPath: string;
let orgDataProvider: OrgDataProvider;
let _context: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
	loggingChannel.append("Initializing Salesforce Toolkit (SFTK) Extension...");
	_extensionPath = context.extensionPath;
	_context = context;
	// Org explorer data provider for treeview
	orgDataProvider = new OrgDataProvider(getWorkspaceRoot(), getExtensionPath());
	vscode.window.registerTreeDataProvider('connected-orgs', orgDataProvider);
	let createScratchFromExplorer = vscode.commands.registerCommand('sftk.createScratch', createScratch());
	context.subscriptions.push(createScratchFromExplorer);
	let createScratchFromPalette = vscode.commands.registerCommand('sftk.createScratchPalette', createScratch());
	context.subscriptions.push(createScratchFromPalette);
	// Delete single scratch org
	let deleteScratchFromExplorer = vscode.commands.registerCommand('sftk.deleteScratch', (node: Org) => deleteScratch(node));
	context.subscriptions.push(deleteScratchFromExplorer);
	let deleteScratchFromPalette = vscode.commands.registerCommand('sftk.deleteScratchPalette', () => {
		vscode.window.showInformationMessage('Not yet implemented.\nUse the Org Explorer!', 'Accept it', 'Deal with it');
	});
	context.subscriptions.push(deleteScratchFromPalette);
	// Open org
	let openOrgFromExplorer = vscode.commands.registerCommand('sftk.openOrg', (node: Org) => openOrg(node));
	context.subscriptions.push(openOrgFromExplorer);
	let openOrgSetupFromExplorer = vscode.commands.registerCommand('sftk.openOrgSetup', (node: Org) => openOrg(node, '/lightning/setup/SetupOneHome/home'));
	context.subscriptions.push(openOrgSetupFromExplorer);
	// Logout from Org
	let logoutFromOrg = vscode.commands.registerCommand('sftk.logout', (node: Org) => logout(node));
	context.subscriptions.push(logoutFromOrg);
	// Open deployment status page
	let openOrgDeploymentStatusFromExplorer = vscode.commands.registerCommand('sftk.openOrgDeploymentStatus', (node: Org) => openOrg(node, '/lightning/setup/DeployStatus/home'));
	context.subscriptions.push(openOrgDeploymentStatusFromExplorer);
	// Set default scratch org and dev hub
	let setScratchFromExplorer = vscode.commands.registerCommand('sftk.setScratch', (node: Org) => setScratch(node));
	context.subscriptions.push(setScratchFromExplorer);
	let setDevHubFromExplorer = vscode.commands.registerCommand('sftk.setDevHub', (node: Org) => setDevHub(node));
	context.subscriptions.push(setDevHubFromExplorer);
	// Purge all expired scratch orgs
	let purgeExpiredScratchOrgs = vscode.commands.registerCommand('sftk.purgeExpiredScratchOrgs', purgeScratchOrgs());
	context.subscriptions.push(purgeExpiredScratchOrgs);
	let showOrgInfoFromView = vscode.commands.registerCommand('sftk.showOrgInfo', (info: OrgInfo) => showOrgInfo(info));
	context.subscriptions.push(showOrgInfoFromView);
	// Refresh tree view
	let refreshExplorer = vscode.commands.registerCommand('sftk.refreshExplorer', async () => {
		refreshOrgList();
	});
	context.subscriptions.push(refreshExplorer);
	// Activate the custom tree
	vscode.commands.executeCommand('setContext', 'sftkEnabled', true);
}

export function deactivate() { }

export function getExtensionPath() {
	return _extensionPath;
}

export function getContext() {
	return _context;
}

/**
 * Triggers the refresh of the treeview, using the data already in the orgdataprovider (no new dx execution)
 */
export function refreshOrgList() {
	orgDataProvider.populateOrgList();
}

/**
 * Returns the OrgDataProvider instance
 */
export function getOrgDataProvider() {
	return orgDataProvider;
}

/**
 * Create a new Scratch Org from. Requires user input.
 */
function createScratch(): (...args: any[]) => any {
	return async () => {
		const timeout = vscode.workspace.getConfiguration().get('sftk.scratchOrgTimeoutOnCreate');
		const scratchOrgConfigFiles = await vscode.workspace.findFiles('config/*', '', 5);
		let configFiles: string[] = [];
		if (scratchOrgConfigFiles !== null) {
			scratchOrgConfigFiles.forEach(f => {
				let configFile = f.path.substring(f.path.lastIndexOf('/') + 1);
				configFiles.push(configFile);
			});
			let configFile = await selectConfigFile(configFiles);
			if (isNullOrUndefined(configFile) || configFile === '') {
				return;
			}
			let alias;
			let aliasProvided = false;

			while (!aliasProvided) {
				alias = await promptUserInput('Scratch Org Alias');
				if (isNullOrUndefined(alias) || alias === '') {
					return;
				}
				alias = alias.replace(/[^A-Za-z0-9-]/g, "_");
				let orgByAlias = orgDataProvider.getOrgByAlias(alias);
				if (orgByAlias !== undefined) {
					vscode.window.showErrorMessage(`Alias ${alias} is already in use for '${orgByAlias.username}'.`);
				} else {
					aliasProvided = true;
				}
			}

			let durationDays = await promptUserInput('Duration (in days)');
			if (isNullOrUndefined(durationDays) || durationDays === '') {
				return;
			}
			let cp = require('child_process');
			const command = `sfdx force:org:create -f config/${configFile} --setalias ${alias} --durationdays ${durationDays} --setdefaultusername --json --loglevel fatal --wait ${timeout}`;
			loggingChannel.appendLine(command);

			window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Creating Scratch Org from config/${configFile}`,
				cancellable: true
			}, (_progress, _token) => {
				var p = new Promise(resolve => {
					cp.exec(command, { cwd: getWorkspaceRoot() }, (err: string, stdout: string, stderr: string) => {
						if (err) {
							let errorStatus: ErrorStatus = JSON.parse(stderr);
							loggingChannel.appendLine(errorStatus.message);
							// purgeOrphanedScratchOrgs();
							resolve();
							promptAndShowErrorLog("Error during Scratch Org creation.");
						}
						else {
							let result: OrgListResult = JSON.parse(stdout);
							loggingChannel.appendLine('' + result.status);
							orgDataProvider.populateOrgList();
							resolve();
							promptAndShowInfoLog("Scratch Org created successfully.");
						}
					});
				});
				return p;
			});
		}
		else {
			loggingChannel.appendLine('No scratch org configuration files found.');
		}
	};
}

/**
 * Deletes the ScratchOrgInfo entries for the given user, which are not retrieved with the sfdx force:org:list command.
 * NOTE: if a developer uses two different machines to create scratch orgs, this will delete orgs used in the other machine!
 * May be mitigated by introducing an additional check on last used day (e.g. delete only those older than 3 days or so).
 */
async function purgeOrphanedScratchOrgs() {
	return async () => {
		const purgeActivated = vscode.workspace.getConfiguration().get('sftk.purgeUnlinkedScratchOrgs');
		if (purgeActivated) {
			orgDataProvider.populateOrgList();
			const devHub = orgDataProvider.getDefaultDevHub();
			if (devHub) {
				const cp = require('child_process');
				let command = `sfdx force:data:soql:query  -u ${devHub.username} -q "SELECT Id,LoginUrl,SignupUsername FROM ScratchOrgInfo WHERE Status != 'Deleted' AND SignupEmail = ${devHub.username}" --json`;
				loggingChannel.appendLine(command);
				await cp.exec(command, { cwd: getWorkspaceRoot() }, (err: string, stdout: string, stderr: string) => {
					if (err) {
						let errorStatus: ErrorStatus = JSON.parse(stderr);
						vscode.window.showErrorMessage(errorStatus.message);
						loggingChannel.appendLine(errorStatus.message);
					}
					else {
						//command = `sfdx force:data:record:delete -u ${devHub.username} -s ScratchOrgInfo -i ${}"`;
						//let result: OrgListResult = JSON.parse(stdout);
						//loggingChannel.appendLine('' + result.status);
						loggingChannel.appendLine('' + stdout);
					}
				});
			}
		}
	};
}

/**
 * Executes unit tests "RunLocalTests" with a simulated deployment, against the target org.
 * 
 * @param orgInfo the org against which execute the local tests.
 */
export async function executeLocalTests(orgInfo: OrgInfo): Promise<void> {
	return executeDeployment(orgInfo, true);
}

/**
 * Executes unit tests "RunLocalTests" with a simulated deployment, against the target org.
 *
 * @param orgInfo the org against which execute the local tests.
 * @param testOnly whether to execute a real deployment or just simulate one
 */
export async function executeDeployment(orgInfo: OrgInfo, testOnly: boolean): Promise<void> {
	let userChoice: string | undefined = await window.showWarningMessage(`Execution of Test or Deployment on a shared sandbox will impact the queue.\nThis may have side effects CI/CD systems using that org. Are you sure you want to proceed?`, { modal: true }, 'Yes');
	if (userChoice === 'Yes') {
		let operationTitle = `${testOnly ? 'Unit Test' : 'Deployment'} -> ${orgInfo.alias ? orgInfo.alias : orgInfo.orgId}`;
		window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: operationTitle,
			cancellable: false
		}, (_progress, _token) => {
			var p = new Promise(resolve => {
				loggingChannel.appendLine(`Executing RunLocalTests on org ${orgInfo.orgId} with user ${orgInfo.username}`);
				_progress.report({ message: `Executing ${testOnly ? 'Unit Test' : 'Deployment'}...` });
				let cp = require('child_process');
				let command = `sfdx force:source:deploy -p force-app/ -l RunLocalTests -u ${orgInfo.username} ${testOnly ? '-c' : ''} -w 90 --loglevel=trace --json`;
				loggingChannel.appendLine(command);
				cp.exec(command, (err: string, stdout: string, stderr: string) => {
					if (err) {
						let errorStatus: ErrorStatus = JSON.parse(stderr);
						loggingChannel.appendLine(errorStatus.message);
						resolve();
						promptAndShowErrorLog("Error during Unit Test execution: Check logs.");
					}
					else {
						try {
							let result: DeploymentResult = JSON.parse(stdout);
							loggingChannel.appendLine('Test execution: ' + result.result.status);
							promptAndShowInfoLog(`Unit Tests result: ${result.result.status}`);
						}
						catch (exc) {
							promptAndShowErrorLog("Error during JSON output parsing.");
							loggingChannel.appendLine(stdout);
						}
						resolve();
					}
				});
			});
			return p;
		});
	}
}

/**
 * Delete a Scratch Org. May require input.
 */
async function deleteScratch(org: Org): Promise<void> {
	let userChoice: string | undefined = await window.showWarningMessage(`Are you sure you want to delete the org ${org.alias} [${org.username}]?`, { modal: true }, 'Delete');
	if (userChoice === 'Delete') {
		loggingChannel.appendLine(`Deleted ${org.username}`);
		let cp = require('child_process');
		const command = `sfdx force:org:delete -u ${org.username} -p --json`;
		loggingChannel.appendLine(command);
		orgDataProvider.removeFromTree(org);
		await cp.exec(command, { cwd: getWorkspaceRoot() }, (err: string, _stdout: string, stderr: string) => {
			if (err) {
				vscode.window.showErrorMessage(`Error during deletion of Scratch Org '${org.username}'.`);
				loggingChannel.appendLine(stderr);
			}
			else {
				vscode.window.showInformationMessage(`Scratch Org '${org.username}' deleted.`);
				orgDataProvider.populateOrgList();
			}
		});
	}
}

/**
 * Asynchronously delete all the expired scratch orgs
 */
function purgeScratchOrgs(): (...args: any[]) => any {
	return async () => {
		let userChoice: string | undefined = await window.showWarningMessage(`This action will disconnect the scratch orgs marked as expired. Do you want to proceed?`, { modal: true }, 'Yes');
		if (userChoice === 'Yes') {
			let cp = require('child_process');
			const command = `sfdx force:org:list --clean -p --json`;
			loggingChannel.appendLine(command);
			await cp.exec(command, { cwd: getWorkspaceRoot() }, (err: string, _stdout: string, stderr: string) => {
				if (err) {
					vscode.window.showErrorMessage(`Error during cleanup of expired Scratch Orgs.`);
					loggingChannel.appendLine(stderr);
				}
				else {
					vscode.window.showInformationMessage(`Expired Scratch Orgs purged.`);
					orgDataProvider.populateOrgList();
				}
			});
		}
	};
}

/**
 * Open the org selected in the browser
 */
async function openOrg(org: Org, path?: string): Promise<void> {
	let cp = require('child_process');
	const openPath = path ? `--path ${path}` : '';
	const command = `sfdx force:org:open -u ${org.username} ${openPath}`;
	loggingChannel.appendLine(command);
	await cp.exec(command, { cwd: getWorkspaceRoot() }, (err: string, _stdout: string, stderr: string) => {
		if (err) {
			vscode.window.showErrorMessage(`Error opening Org '${org.username}'.`);
			loggingChannel.appendLine(stderr);
		}
	});
}


/**
 * Logout from the selected org
 */
async function logout(org: Org): Promise<void> {
	let cp = require('child_process');
	const command = `sfdx force:auth:logout -p -u ${org.username}`;
	loggingChannel.appendLine(command);
	await cp.exec(command, { cwd: getWorkspaceRoot() }, (err: string, _stdout: string, stderr: string) => {
		if (err) {
			vscode.window.showErrorMessage(`Error during logout for '${org.username}'.`);
			loggingChannel.appendLine(stderr);
		} else {
			loggingChannel.appendLine(_stdout);
			OrgInfoPanel.disposeIfVisible();
			orgDataProvider.populateOrgList();
		}
	});
}

/**
 * Set the scratch org selected as default org
 */
export async function setScratch(org: Org): Promise<void> {
	let cp = require('child_process');
	const command = `sfdx force:config:set defaultusername=${org.alias ? org.alias : org.username}`;
	loggingChannel.appendLine(command);
	orgDataProvider.setNewDefault(org);
	await cp.exec(command, { cwd: getWorkspaceRoot() }, (err: string, stdout: string, stderr: string) => {
		if (err) {
			vscode.window.showErrorMessage(`Error setting default scratch org '${org.username}'.`);
			loggingChannel.appendLine(stderr);
		}
		loggingChannel.appendLine(stdout);
		orgDataProvider.populateOrgList();
	});
}

/**
 * Set the Dev Hub selected as default Dev Hub org
 */
async function setDevHub(org: Org): Promise<void> {
	let cp = require('child_process');
	const command = `sfdx force:config:set defaultdevhubusername=${org.alias ? org.alias : org.username}`;
	loggingChannel.appendLine(command);
	orgDataProvider.setNewDefault(org);
	await cp.exec(command, { cwd: getWorkspaceRoot() }, (err: string, stdout: string, stderr: string) => {
		if (err) {
			vscode.window.showErrorMessage(`Error setting default dev hub '${org.username}'.`);
			loggingChannel.appendLine(stderr);
		}
		loggingChannel.appendLine(stdout);
		orgDataProvider.populateOrgList();
	});
}

/**
 * Show Org Info panel
 */
async function showOrgInfo(orgInfo: OrgInfo): Promise<void> {
	OrgInfoPanel.createOrShow(orgInfo);
}

/**
 * Return the filesystem path of the workspace root
 */
export function getWorkspaceRoot(): string {
	let root = '';
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length < 1) {
		loggingChannel.appendLine('No active workspace found');
	} else {
		root = vscode.workspace.workspaceFolders[0].uri.fsPath;
	}
	return root;
}

/**
 * Select configuration file
 */
export async function selectConfigFile(configFiles: string[] | Thenable<string[]>) {
	let i = 0;
	const result = await window.showQuickPick(configFiles, {
		placeHolder: 'Scratch org configuration file...'
	});
	return result;
}

/**
 * Prompt for user input
 */
export async function promptUserInput(placeHolder: string) {
	const result = await window.showInputBox({
		value: '',
		placeHolder: placeHolder
	});
	return result;
}

/**
 * Show an Error message and asks to the user if to show the application log.
 */
export async function promptAndShowErrorLog(text: string) {
	let userChoice = await window.showErrorMessage(text, { modal: false }, 'Close', 'Show Logs');
	if (userChoice === 'Show Logs') {
		loggingChannel.show();
	}
}

/**
 * Show an Information message and asks to the user if to show the application log.
 */
export async function promptAndShowInfoLog(text: string) {
	let userChoice = await window.showInformationMessage(text, { modal: false }, 'Close', 'Show Logs');
	if (userChoice === 'Show Logs') {
		loggingChannel.show();
	}
}
