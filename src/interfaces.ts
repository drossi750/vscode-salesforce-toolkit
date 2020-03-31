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

// Interfaces for JSON Deserialization
export interface ErrorStatus {
    message: string;
    commandName: string;
}
export interface OrgInfo {
    orgId: string;
    instanceUrl: string;
    loginUrl: string;
    username: string;
    isDevHub: boolean;
    alias: string;
    connectedStatus: string;
    accessToken: string;
    snapshot: string;
    isExpired: boolean;
    expirationDate: string;
    signupUsername: string;
    defaultMarker: string;
    isDefaultDevHubUsername: boolean;
    devHubUsername: string;
    devHubOrgId: string;
}
export interface OrgListResult {
    status: number;
    result: {
        nonScratchOrgs: [OrgInfo];
        scratchOrgs: [OrgInfo];
    };
}
export interface UserDetailResult {
    status: number;
    result: {
        username: string;
        profileName: string;
        id: string;
        orgId: string;
        accessToken: string;
        instanceUrl: string;
        loginUrl: string;
        alias: string;
    };
}

export interface ReleaseVersionResult {
    label: string;
    url: string;
    version: string;
}

export interface DeploymentResult {
    status: number;
    result: {
        status: string;
        success: boolean;
        numberComponentErrors: number;
        numberComponentsDeployed: number;
        numberComponentsTotal: number;
        numberTestErrors: number;
        numberTestsCompleted: number;
        numberTestsTotal: number;
    }
}