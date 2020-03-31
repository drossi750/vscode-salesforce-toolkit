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