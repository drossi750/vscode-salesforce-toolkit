import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { OrgDataProvider, Org } from '../../orgdataprovider';
import { OrgInfo } from '../../interfaces';

function makeOrgInfo(overrides: Partial<OrgInfo> = {}): OrgInfo {
    return {
        orgId: '00D000000000001',
        instanceUrl: 'https://test.salesforce.com',
        loginUrl: 'https://login.salesforce.com',
        username: 'test@example.com',
        isDevHub: false,
        alias: 'test-org',
        connectedStatus: 'Connected',
        accessToken: 'TOKEN',
        snapshot: '',
        isExpired: false,
        expirationDate: '2025-12-31',
        signupUsername: '',
        defaultMarker: '',
        isDefaultDevHubUsername: false,
        devHubUsername: '',
        devHubOrgId: '',
        ...overrides
    };
}

function execResult(result: any) {
    return (...args: any[]) => {
        const cb = typeof args[1] === 'function' ? args[1] : args[2];
        if (typeof cb === 'function') { cb(null, JSON.stringify(result), ''); }
    };
}

function execError(message: string) {
    return (...args: any[]) => {
        const cb = typeof args[1] === 'function' ? args[1] : args[2];
        if (typeof cb === 'function') { cb('error', '', JSON.stringify({ message, commandName: 'org:list' })); }
    };
}

const emptyOrgList = { status: 0, result: { nonScratchOrgs: [], scratchOrgs: [] } };

suite('OrgDataProvider Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let cpExecStub: sinon.SinonStub;

    setup(() => {
        sandbox = sinon.createSandbox();
        const cp = require('child_process');
        cpExecStub = sandbox.stub(cp, 'exec').callsFake(execResult(emptyOrgList));
    });

    teardown(() => {
        sandbox.restore();
    });

    // TS-ODP-005: Empty org list
    test('populateOrgList — empty result yields empty children', async () => {
        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const children = await provider.getChildren();
        assert.equal(children.length, 0);
    });

    // TS-ODP-001: Mixed org types
    test('populateOrgList — mixed org types parsed correctly', async () => {
        const devHubInfo = makeOrgInfo({ orgId: '00D_HUB', username: 'hub@test.com', alias: 'my-hub', isDevHub: true, isDefaultDevHubUsername: true });
        const sbxInfo = makeOrgInfo({ orgId: '00D_SBX', username: 'sbx@test.com', alias: 'my-sbx', isDevHub: false });
        const scratchInfo = makeOrgInfo({ orgId: '00D_SCR', username: 'scratch@test.com', alias: 'my-scratch', devHubOrgId: '00D_HUB', devHubUsername: 'hub@test.com', defaultMarker: '(U)' });

        cpExecStub.callsFake(execResult({
            status: 0,
            result: { nonScratchOrgs: [devHubInfo, sbxInfo], scratchOrgs: [scratchInfo] }
        }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));

        const topLevel = await provider.getChildren();
        assert.equal(topLevel.length, 2);

        const hub = topLevel.find(o => o.username === 'hub@test.com');
        assert.ok(hub);
        assert.equal(hub!.type, Org.Type.DEV_HUB);
        assert.equal(hub!.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);

        const sbx = topLevel.find(o => o.username === 'sbx@test.com');
        assert.ok(sbx);
        assert.equal(sbx!.type, Org.Type.SANDBOX);

        const scratchChildren = await provider.getChildren(hub!);
        assert.equal(scratchChildren.length, 1);
        assert.equal(scratchChildren[0].username, 'scratch@test.com');
    });

    // TS-ODP-006: Default Dev Hub identification
    test('getDefaultDevHub — returns default dev hub', async () => {
        const devHubInfo = makeOrgInfo({ isDevHub: true, isDefaultDevHubUsername: true, username: 'hub@test.com' });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [devHubInfo], scratchOrgs: [] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const hub = provider.getDefaultDevHub();
        assert.ok(hub);
        assert.equal(hub!.username, 'hub@test.com');
    });

    // TS-ODP-007: No default Dev Hub
    test('getDefaultDevHub — returns undefined when no default', async () => {
        const devHubInfo = makeOrgInfo({ isDevHub: true, isDefaultDevHubUsername: false });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [devHubInfo], scratchOrgs: [] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        assert.equal(provider.getDefaultDevHub(), undefined);
    });

    // TS-ODP-004: CLI error on org list
    test('populateOrgList — CLI error shows error message', async () => {
        const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
        cpExecStub.callsFake(execError('CLI failed'));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        assert.ok(showErrorStub.calledWith('CLI failed'));
    });

    // TS-ODP-002: showExpiredScratchOrgs config adds --all flag
    test('populateOrgList — uses --all when showExpiredScratchOrgs is true', async () => {
        const getConfigStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns({
            get: (key: string) => key === 'sftk.showExpiredScratchOrgs' ? true : undefined
        } as any);

        let capturedCmd = '';
        cpExecStub.callsFake((...args: any[]) => {
            capturedCmd = args[0];
            const cb = typeof args[1] === 'function' ? args[1] : args[2];
            if (typeof cb === 'function') { cb(null, JSON.stringify(emptyOrgList), ''); }
        });

        new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        assert.ok(capturedCmd.includes('--all'), `Expected --all in: ${capturedCmd}`);
        getConfigStub.restore();
    });

    // TS-ODP-003: showExpiredScratchOrgs false — no --all flag
    test('populateOrgList — no --all when showExpiredScratchOrgs is false', async () => {
        let capturedCmd = '';
        cpExecStub.callsFake((...args: any[]) => {
            capturedCmd = args[0];
            const cb = typeof args[1] === 'function' ? args[1] : args[2];
            if (typeof cb === 'function') { cb(null, JSON.stringify(emptyOrgList), ''); }
        });

        new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        assert.ok(!capturedCmd.includes('--all'), `Should not have --all in: ${capturedCmd}`);
    });

    // TS-ODP-008: Expired scratch org
    test('populateOrgList — expired scratch org has isDefault false', async () => {
        const scratchInfo = makeOrgInfo({ isExpired: true, devHubOrgId: '00D_HUB', devHubUsername: 'hub@test.com' });
        const hubInfo = makeOrgInfo({ isDevHub: true, isDefaultDevHubUsername: true, orgId: '00D_HUB' });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [hubInfo], scratchOrgs: [scratchInfo] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const hub = (await provider.getChildren())[0];
        const scratches = await provider.getChildren(hub);
        assert.equal(scratches[0].isDefault, false);
    });

    // TS-ODP-009: Default scratch org
    test('populateOrgList — default scratch org has isDefault true', async () => {
        const scratchInfo = makeOrgInfo({ defaultMarker: '(U)', devHubOrgId: '00D_HUB', devHubUsername: 'hub@test.com' });
        const hubInfo = makeOrgInfo({ isDevHub: true, isDefaultDevHubUsername: true, orgId: '00D_HUB' });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [hubInfo], scratchOrgs: [scratchInfo] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const hub = (await provider.getChildren())[0];
        const scratches = await provider.getChildren(hub);
        assert.equal(scratches[0].isDefault, true);
    });

    // TS-ODP-011: Orgs sorted by position (DevHub before Sandbox)
    test('populateOrgList — orgs sorted by position (DevHub first)', async () => {
        const sbxInfo = makeOrgInfo({ username: 'sbx@test.com', isDevHub: false });
        const hubInfo = makeOrgInfo({ username: 'hub@test.com', isDevHub: true, isDefaultDevHubUsername: false });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [sbxInfo, hubInfo], scratchOrgs: [] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const children = await provider.getChildren();
        assert.equal(children[0].type, Org.Type.DEV_HUB);
        assert.equal(children[1].type, Org.Type.SANDBOX);
    });

    // TS-ODP-015: getOrgByAlias — found
    test('getOrgByAlias — returns org when alias matches', async () => {
        const orgInfo = makeOrgInfo({ alias: 'my-scratch', devHubOrgId: '00D_HUB', devHubUsername: 'hub@test.com' });
        const hubInfo = makeOrgInfo({ isDevHub: true, isDefaultDevHubUsername: true, orgId: '00D_HUB' });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [hubInfo], scratchOrgs: [orgInfo] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const found = provider.getOrgByAlias('my-scratch');
        assert.ok(found);
        assert.equal(found!.alias, 'my-scratch');
    });

    // TS-ODP-016: getOrgByAlias — not found
    test('getOrgByAlias — returns undefined when not found', async () => {
        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        assert.equal(provider.getOrgByAlias('nonexistent'), undefined);
    });

    // TS-ODP-017: getOrgByAlias — undefined alias
    test('getOrgByAlias — returns undefined for undefined alias', async () => {
        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        assert.equal(provider.getOrgByAlias(undefined as any), undefined);
    });

    // TS-ODP-018: getOrgByUsername — found
    test('getOrgByUsername — returns org when username matches', async () => {
        const orgInfo = makeOrgInfo({ username: 'user@test.com', isDevHub: true });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [orgInfo], scratchOrgs: [] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const found = provider.getOrgByUsername('user@test.com');
        assert.ok(found);
    });

    // TS-ODP-019: getOrgByUsername — searches scratchOrgs too
    test('getOrgByUsername — finds org in scratchOrgs', async () => {
        const scratchInfo = makeOrgInfo({ username: 'scratch@test.com', devHubOrgId: '00D_HUB', devHubUsername: 'hub@test.com' });
        const hubInfo = makeOrgInfo({ isDevHub: true, isDefaultDevHubUsername: true, orgId: '00D_HUB' });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [hubInfo], scratchOrgs: [scratchInfo] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const found = provider.getOrgByUsername('scratch@test.com');
        assert.ok(found);
        assert.equal(found!.username, 'scratch@test.com');
    });

    // TS-ODP-014: removeFromTree
    test('removeFromTree — removes org from list', async () => {
        const org1 = makeOrgInfo({ username: 'org1@test.com', isDevHub: true });
        const org2 = makeOrgInfo({ username: 'org2@test.com', isDevHub: false });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [org1, org2], scratchOrgs: [] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        let children = await provider.getChildren();
        assert.equal(children.length, 2);

        await provider.removeFromTree(children[1]);
        children = await provider.getChildren();
        assert.equal(children.length, 1);
    });

    // TS-ODP-012: setNewDefault
    test('setNewDefault — updates isDefault on same-type orgs', async () => {
        const hub1 = makeOrgInfo({ username: 'hub1@test.com', isDevHub: true, isDefaultDevHubUsername: true });
        const hub2 = makeOrgInfo({ username: 'hub2@test.com', isDevHub: true, isDefaultDevHubUsername: false });
        cpExecStub.callsFake(execResult({ status: 0, result: { nonScratchOrgs: [hub1, hub2], scratchOrgs: [] } }));

        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 100));
        const children = await provider.getChildren();
        assert.equal(children.length, 2);

        // Find hub1 (default) and hub2 (not default)
        const defaultHub = children.find(c => c.username === 'hub1@test.com');
        const otherHub = children.find(c => c.username === 'hub2@test.com');
        assert.ok(defaultHub, 'hub1 should be in children');
        assert.ok(otherHub, 'hub2 should be in children');
        assert.equal(defaultHub!.isDefault, true, 'hub1 should be default');
        assert.equal(otherHub!.isDefault, false, 'hub2 should not be default');

        // Set hub2 as default
        await provider.setNewDefault(otherHub!);
        assert.equal(defaultHub!.isDefault, false, 'hub1 should no longer be default');
        assert.equal(otherHub!.isDefault, true, 'hub2 should now be default');
    });

    // TS-ODP-010: getChildren with no workspace root
    test('getChildren — no workspace root shows info message', async () => {
        const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
        const provider = new OrgDataProvider('', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const children = await provider.getChildren();
        assert.equal(children.length, 0);
        assert.ok(showInfoStub.calledWith('Not in a workspace root'));
    });

    // getTreeItem returns the element itself
    test('getTreeItem — returns the element', async () => {
        const provider = new OrgDataProvider('/tmp', '/tmp/ext');
        await new Promise(r => setTimeout(r, 50));
        const orgInfo = makeOrgInfo();
        const org = new Org(orgInfo, '/tmp');
        assert.equal(provider.getTreeItem(org), org);
    });
});

suite('Org Class Test Suite', () => {
    // TS-ORG-001: Constructor sets label and tooltip
    test('Constructor — sets label, tooltip, and description', () => {
        const info = makeOrgInfo({ alias: 'my-org', username: 'user@test.com' });
        const org = new Org(info, '/tmp');
        assert.equal(org.label, 'my-org');
        assert.equal(org.tooltip, 'my-org');
        assert.ok((org.description as string).includes('[user@test.com]'));
    });

    // TS-ORG-003: updateContextValue — scratch selected
    test('updateContextValue — scratch selected', () => {
        const info = makeOrgInfo();
        const org = new Org(info, '/tmp');
        org.type = Org.Type.SCRATCH;
        org.isDefault = true;
        org.updateContextValue();
        assert.equal(org.contextValue, 'scratch.selected');
    });

    // TS-ORG-004: updateContextValue — sandbox not selected
    test('updateContextValue — sandbox not selected', () => {
        const info = makeOrgInfo();
        const org = new Org(info, '/tmp');
        org.type = Org.Type.SANDBOX;
        org.isDefault = false;
        org.updateContextValue();
        assert.equal(org.contextValue, 'sandbox');
    });

    test('updateContextValue — devhub selected', () => {
        const info = makeOrgInfo();
        const org = new Org(info, '/tmp');
        org.type = Org.Type.DEV_HUB;
        org.isDefault = true;
        org.updateContextValue();
        assert.equal(org.contextValue, 'devhub.selected');
    });

    test('updateContextValue — devhub not selected', () => {
        const info = makeOrgInfo();
        const org = new Org(info, '/tmp');
        org.type = Org.Type.DEV_HUB;
        org.isDefault = false;
        org.updateContextValue();
        assert.equal(org.contextValue, 'devhub');
    });

    test('Org.Type — has correct values', () => {
        assert.equal(Org.Type.SCRATCH, 'scratch');
        assert.equal(Org.Type.SANDBOX, 'sandbox');
        assert.equal(Org.Type.DEV_HUB, 'devhub');
    });

    test('Org defaults — type is scratch, isDefault false, position 100', () => {
        const info = makeOrgInfo();
        const org = new Org(info, '/tmp');
        assert.equal(org.type, Org.Type.SCRATCH);
        assert.equal(org.isDefault, false);
        assert.equal(org.position, 100);
    });
});
