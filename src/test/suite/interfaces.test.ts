import * as assert from 'assert';
import { OrgInfo, OrgListResult, ErrorStatus, UserDetailResult, DeploymentResult, ReleaseVersionResult } from '../../interfaces';

suite('Interfaces Test Suite', () => {

    // TS-IF-001: OrgListResult shape
    test('OrgListResult — parses correctly', () => {
        const json = {
            status: 0,
            result: {
                nonScratchOrgs: [{
                    orgId: '00D1', instanceUrl: 'https://test.sf.com', loginUrl: 'https://login.sf.com',
                    username: 'admin@test.com', isDevHub: true, alias: 'hub',
                    connectedStatus: 'Connected', accessToken: 'TOKEN', snapshot: '',
                    isExpired: false, expirationDate: '', signupUsername: '',
                    defaultMarker: '', isDefaultDevHubUsername: true,
                    devHubUsername: '', devHubOrgId: ''
                }],
                scratchOrgs: [{
                    orgId: '00D2', instanceUrl: 'https://scratch.sf.com', loginUrl: 'https://login.sf.com',
                    username: 'scratch@test.com', isDevHub: false, alias: 'my-scratch',
                    connectedStatus: 'Connected', accessToken: 'TOKEN2', snapshot: 'snap1',
                    isExpired: false, expirationDate: '2025-12-31', signupUsername: 'admin@test.com',
                    defaultMarker: '(U)', isDefaultDevHubUsername: false,
                    devHubUsername: 'admin@test.com', devHubOrgId: '00D1'
                }]
            }
        };
        const result: OrgListResult = json as OrgListResult;
        assert.equal(result.status, 0);
        assert.equal(result.result.nonScratchOrgs.length, 1);
        assert.equal(result.result.scratchOrgs.length, 1);
        assert.equal(result.result.nonScratchOrgs[0].isDevHub, true);
        assert.equal(result.result.scratchOrgs[0].devHubOrgId, '00D1');
    });

    // TS-IF-002: OrgInfo required fields
    test('OrgInfo — has required fields', () => {
        const info: OrgInfo = {
            orgId: '00D1', instanceUrl: 'https://test.sf.com', loginUrl: 'https://login.sf.com',
            username: 'test@test.com', isDevHub: false, alias: 'test',
            connectedStatus: 'Connected', accessToken: 'TOKEN', snapshot: '',
            isExpired: false, expirationDate: '', signupUsername: '',
            defaultMarker: '', isDefaultDevHubUsername: false,
            devHubUsername: '', devHubOrgId: ''
        };
        assert.ok(info.orgId);
        assert.ok(info.username);
        assert.equal(typeof info.isDevHub, 'boolean');
        assert.equal(typeof info.isExpired, 'boolean');
    });

    // TS-IF-003: Scratch org specific fields
    test('OrgInfo — scratch org fields', () => {
        const info: OrgInfo = {
            orgId: '00D2', instanceUrl: 'https://scratch.sf.com', loginUrl: 'https://login.sf.com',
            username: 'scratch@test.com', isDevHub: false, alias: 'scratch',
            connectedStatus: 'Connected', accessToken: 'TOKEN', snapshot: 'snap1',
            isExpired: false, expirationDate: '2025-12-31', signupUsername: 'admin@test.com',
            defaultMarker: '(U)', isDefaultDevHubUsername: false,
            devHubUsername: 'admin@test.com', devHubOrgId: '00D1'
        };
        assert.equal(info.isExpired, false);
        assert.equal(info.expirationDate, '2025-12-31');
        assert.equal(info.devHubUsername, 'admin@test.com');
        assert.equal(info.devHubOrgId, '00D1');
        assert.equal(info.defaultMarker, '(U)');
    });

    // TS-IF-004: ErrorStatus shape
    test('ErrorStatus — parses correctly', () => {
        const json = { message: 'Command failed', commandName: 'org:list' };
        const error: ErrorStatus = json;
        assert.equal(error.message, 'Command failed');
        assert.equal(error.commandName, 'org:list');
    });

    // TS-IF-005: UserDetailResult shape
    test('UserDetailResult — parses correctly', () => {
        const json = {
            status: 0,
            result: {
                username: 'admin@test.com',
                profileName: 'System Administrator',
                id: '005xxx',
                orgId: '00Dxxx',
                accessToken: 'TOKEN123',
                instanceUrl: 'https://test.salesforce.com',
                loginUrl: 'https://login.salesforce.com',
                alias: 'my-org'
            }
        };
        const result: UserDetailResult = json;
        assert.equal(result.status, 0);
        assert.equal(result.result.username, 'admin@test.com');
        assert.equal(result.result.accessToken, 'TOKEN123');
        assert.ok(result.result.instanceUrl);
    });

    // TS-IF-006: DeploymentResult shape
    test('DeploymentResult — parses correctly', () => {
        const json = {
            status: 0,
            result: {
                status: 'Succeeded',
                success: true,
                numberComponentErrors: 0,
                numberComponentsDeployed: 10,
                numberComponentsTotal: 10,
                numberTestErrors: 0,
                numberTestsCompleted: 5,
                numberTestsTotal: 5
            }
        };
        const result: DeploymentResult = json;
        assert.equal(result.result.status, 'Succeeded');
        assert.equal(result.result.success, true);
        assert.equal(result.result.numberComponentsDeployed, 10);
        assert.equal(result.result.numberTestErrors, 0);
    });

    // TS-IF-007: ReleaseVersionResult shape
    test('ReleaseVersionResult — parses correctly', () => {
        const json = { label: 'Spring \'24', url: '/services/data/v60.0', version: '60.0' };
        const result: ReleaseVersionResult = json;
        assert.equal(result.label, 'Spring \'24');
        assert.equal(result.url, '/services/data/v60.0');
        assert.equal(result.version, '60.0');
    });
});
