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
import * as path from 'path';
import * as utilities from './utilities';
import { ErrorStatus, OrgInfo, OrgListResult } from "./interfaces";

const hubIcon = '../resources/images/org.png';
const sbxIcon = '../resources/images/sbx.png';
const scratchIcon = '../resources/images/scratch-ok.png';
const scratchExpiredIcon = '../resources/images/scratch-ko.png';
const scratchDefaultIcon = '../resources/images/scratch-default.png';

/**
 * Data provider for the Connected Orgs Treeview
 */
export class OrgDataProvider implements vscode.TreeDataProvider<Org> {
    private _onDidChangeTreeData: vscode.EventEmitter<Org> = new vscode.EventEmitter<Org>();
    readonly onDidChangeTreeData: vscode.Event<Org> = this._onDidChangeTreeData.event;
    private scratchOrgs: Org[] = [];
    private orgList: Org[] = [];
    private defaultDevHub: Org | undefined = undefined;

    constructor(private workspaceRoot: string, private extensionPath: string) {
        this.extensionPath = extensionPath;
        this.populateOrgList();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Org): vscode.TreeItem {
        return element;
    }

    getChildren(element?: Org): Promise<Org[]> {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('Not in a workspace root');
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve(this.scratchOrgs.filter(s => { return (s.orgInfo.devHubOrgId === element.orgInfo.orgId); }));
        } else {
            return Promise.resolve(this.orgList);
        }
    }

    getDefaultDevHub(): Org | undefined {
        return this.defaultDevHub;
    }

    /**
     * Pre-sets the new selected default, while waiting the refresh operation in the background.
     */
    async setNewDefault(org: Org): Promise<void> {
        this.orgList.forEach(o => {
            if (org.type === o.type) {
                o.isDefault = org.username === o.username;
            }
        });
        this.refresh();
    }

    /**
     * Pre-removes the given org from the treeview, while waiting the refresh operation in the background.
     */
    async removeFromTree(org: Org): Promise<void> {
        this.orgList.splice(this.orgList.indexOf(org), 1);
        this.refresh();
    }

    populateOrgList(): void {
        const cp = require('child_process');
        const showExpired = vscode.workspace.getConfiguration().get('sftk.showExpiredScratchOrgs');
        let command = `sfdx force:org:list ${showExpired ? '--all' : ''} --json`;
        let mediaPath = path.join(this.extensionPath, 'dist');
        utilities.loggingChannel.appendLine(command);
        let iconBuilder: IconBuilder = new IconBuilder(mediaPath);
        cp.exec(command, { cwd: this.workspaceRoot }, (err: string, stdout: string, stderr: string) => {
            if (err) {
                let errorStatus: ErrorStatus = JSON.parse(stderr);
                vscode.window.showErrorMessage(errorStatus.message);
                utilities.loggingChannel.appendLine(errorStatus.message);
            } else {
                utilities.loggingChannel.appendLine('Org list retrieved');
                this.orgList = [];
                this.scratchOrgs = [];
                this.defaultDevHub = undefined;
                let orgs: OrgListResult = JSON.parse(stdout);
                orgs.result.nonScratchOrgs.forEach(s => {
                    let o: Org = new Org(s, mediaPath, {
                        command: 'sftk.showOrgInfo',
                        title: 'Show Org Info',
                        arguments: [s]
                    });
                    if (s.isDevHub) {
                        o.type = Org.Type.DEV_HUB;
                        o.iconPath = iconBuilder.getIconFor(IconBuilder.Type.DEVHUB);
                        o.position = 1;
                        o.isDefault = s.isDefaultDevHubUsername;
                        o.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
                        if (o.isDefault) {
                            this.defaultDevHub = o;
                        }
                    } else {
                        o.type = Org.Type.SANDBOX;
                        o.iconPath = iconBuilder.getIconFor(IconBuilder.Type.SANDBOX);
                        o.position = 5;
                    }
                    o.updateContextValue();
                    this.orgList.push(o);
                });
                orgs.result.scratchOrgs.forEach(s => {
                    let o: Org = new Org(s, mediaPath, {
                        command: 'sftk.showOrgInfo',
                        title: 'Show Org Info',
                        arguments: [s]
                    });
                    o.type = Org.Type.SCRATCH;
                    if (s.isExpired) {
                        o.iconPath = iconBuilder.getIconFor(IconBuilder.Type.SCRATCH_EXPIRED);
                        o.position = 10;
                        o.isDefault = false;
                    } else if (s.defaultMarker === '(U)') {
                        o.iconPath = iconBuilder.getIconFor(IconBuilder.Type.SCRATCH_DEFAULT);
                        o.position = 20;
                        o.isDefault = true;
                    } else {
                        o.iconPath = iconBuilder.getIconFor(IconBuilder.Type.SCRATCH);
                        o.position = 15;
                        o.isDefault = false;
                    }
                    o.updateContextValue();
                    this.scratchOrgs.push(o);
                });
            }
            this.orgList.sort((a, b) => (a.position > b.position ? 1 : -1));
            this.refresh();
        });
    }

    /**
     * Returns the authorized org identified by the alias, if any, or undefined.
     * @param alias org alias to search for
     */
    getOrgByAlias(alias: string): Org | undefined {
        let allOrgs = this.scratchOrgs.concat(this.orgList);
        let orgByAlias: Org | undefined = allOrgs.find(s => {
            return alias !== undefined && s.alias === alias;
        });
        return orgByAlias;
    }

    /**
     * Returns the authorized org identified by the username, if any, or undefined.
     * @param username org username to search for
     */
    getOrgByUsername(username: string): Org | undefined {
        let allOrgs = this.scratchOrgs.concat(this.orgList);
        let orgByUsername: Org | undefined = allOrgs.find(s => {
            return s.username === username;
        });
        return orgByUsername;
    }
}

export class Org extends vscode.TreeItem {
    public static Type = { SCRATCH: 'scratch', SANDBOX: 'sandbox', DEV_HUB: 'devhub' };
    private static STAR_MARKER = '⭐';
    alias: string;
    readonly username: string;

    constructor(
        public readonly orgInfo: OrgInfo,
        readonly mediaPath: string,
        public readonly command?: vscode.Command,
    ) {
        super(orgInfo.alias, vscode.TreeItemCollapsibleState.None);
        this.alias = orgInfo.alias;
        this.mediaPath = mediaPath;
        this.username = orgInfo.username;
    }

    get tooltip(): string {
        return `${this.alias}`;
    }

    get description(): string {
        return (this.isDefault && this.contextValue === 'devhub.selected' ? Org.STAR_MARKER + ' ' : '') + `[${this.username}]`;
        //return (this.isDefault && this.contextValue === 'devhub.selected' ? Org.STAR_MARKER + ' ' : '') + `[email@example.com]`;
    }

    updateContextValue(): void {
        let context;
        switch (this.type) {
            case Org.Type.DEV_HUB:
                context = 'devhub';
                break;
            case Org.Type.SANDBOX:
                context = 'sandbox';
                break;
            case Org.Type.SCRATCH:
                context = 'scratch';
                break;
        }
        this.contextValue = context + (this.isDefault ? '.selected' : '');
    }

    type = Org.Type.SCRATCH;
    isDefault = false;
    position = 100;
    contextValue = '';
}

class IconBuilder {
    public static Type = { SCRATCH: 'scratch', SANDBOX: 'sandbox', DEVHUB: 'devhub', SCRATCH_DEFAULT: 'scratch_default', SCRATCH_EXPIRED: 'scratch_expired' };

    constructor(private readonly mediaPath: string) {
        this.mediaPath = mediaPath;
    }

    public getIconFor(type: string): any {
        let icon: any;
        switch (type) {
            case IconBuilder.Type.SCRATCH:
                icon = {
                    light: path.join(this.mediaPath, scratchIcon),
                    dark: path.join(this.mediaPath, scratchIcon)
                };
                break;
            case IconBuilder.Type.SCRATCH_EXPIRED:
                icon = {
                    light: path.join(this.mediaPath, scratchExpiredIcon),
                    dark: path.join(this.mediaPath, scratchExpiredIcon)
                };
                break;
            case IconBuilder.Type.SCRATCH_DEFAULT:
                icon = {
                    light: path.join(this.mediaPath, scratchDefaultIcon),
                    dark: path.join(this.mediaPath, scratchDefaultIcon)
                };
                break;
            case IconBuilder.Type.SANDBOX:
                icon = {
                    light: path.join(this.mediaPath, sbxIcon),
                    dark: path.join(this.mediaPath, sbxIcon)
                };
                break;
            case IconBuilder.Type.DEVHUB:
                icon = {
                    light: path.join(this.mediaPath, hubIcon),
                    dark: path.join(this.mediaPath, hubIcon)
                };
                break;
            default:
                icon = {
                    light: path.join(this.mediaPath, scratchExpiredIcon),
                    dark: path.join(this.mediaPath, scratchExpiredIcon)
                };
                break;
        }
        return icon;
    }
}