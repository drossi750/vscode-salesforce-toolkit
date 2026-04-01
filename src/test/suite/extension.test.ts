import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as utilities from '../../utilities';

suite('Extension Test Suite', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    // TS-EXT-001: Extension activates and registers commands
    test('Extension activates successfully', () => {
        const extension = utilities.getExtension();
        assert.equal(extension?.id, utilities.extensionId);
        assert.ok(extension?.isActive);
    });

    // TS-EXT-002: sftkEnabled context is set
    test('sftkEnabled context — commands are registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        const sftkCommands = commands.filter(c => c.startsWith('sftk.'));
        const expected = [
            'sftk.createScratch',
            'sftk.createScratchPalette',
            'sftk.deleteScratch',
            'sftk.deleteScratchPalette',
            'sftk.openOrg',
            'sftk.openOrgSetup',
            'sftk.logout',
            'sftk.openOrgDeploymentStatus',
            'sftk.setScratch',
            'sftk.setDevHub',
            'sftk.purgeExpiredScratchOrgs',
            'sftk.showOrgInfo',
            'sftk.refreshExplorer'
        ];
        for (const cmd of expected) {
            assert.ok(sftkCommands.includes(cmd), `Command ${cmd} should be registered`);
        }
    });

    // TS-EXT-003: All 13 expected commands registered
    test('All sftk commands are registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        const sftkCommands = commands.filter(c => c.startsWith('sftk.'));
        assert.ok(sftkCommands.length >= 13, `Expected at least 13 sftk commands, got ${sftkCommands.length}`);
    });

    // TS-EXT-090: selectConfigFile shows quick pick
    test('selectConfigFile — shows quick pick and returns selection', async () => {
        const { selectConfigFile } = require('../../extension');
        const stub = sandbox.stub(vscode.window, 'showQuickPick').resolves('dev-scratch-def.json' as any);
        const result = await selectConfigFile(['dev-scratch-def.json', 'qa-scratch-def.json']);
        assert.equal(result, 'dev-scratch-def.json');
        assert.ok(stub.calledOnce);
    });

    // TS-EXT-091: selectConfigFile — user cancels
    test('selectConfigFile — returns undefined when cancelled', async () => {
        const { selectConfigFile } = require('../../extension');
        sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);
        const result = await selectConfigFile(['file.json']);
        assert.equal(result, undefined);
    });

    // TS-EXT-100: refreshOrgList delegates to orgDataProvider
    test('refreshOrgList — can be called without error', () => {
        const { refreshOrgList } = require('../../extension');
        // Should not throw — just triggers populateOrgList on the provider
        assert.doesNotThrow(() => refreshOrgList());
    });

    // TS-EXT-080: executeDeployment — user cancels warning
    test('executeDeployment — returns when user cancels', async () => {
        const { executeDeployment } = require('../../extension');
        sandbox.stub(vscode.window, 'showWarningMessage').resolves(undefined);
        const cpExecStub = sandbox.stub(require('child_process'), 'exec');
        const orgInfo = { orgId: '00D', username: 'test@test.com', alias: 'test' };
        await executeDeployment(orgInfo, true);
        assert.ok(cpExecStub.notCalled);
    });

    // TS-EXT-081: executeDeployment — test only includes -c flag
    test('executeDeployment — test only mode includes -c flag', async () => {
        const { executeDeployment } = require('../../extension');
        sandbox.stub(vscode.window, 'showWarningMessage').resolves('Yes' as any);
        sandbox.stub(utilities, 'getDefaultPackageDirectory').returns('force-app');
        const cp = require('child_process');
        const cpExecStub = sandbox.stub(cp, 'exec').callsFake((...args: any[]) => {
            const cb = args[args.length - 1];
            if (typeof cb === 'function') {
                cb(null, JSON.stringify({ status: 0, result: { status: 'Succeeded' } }), '');
            }
        });
        sandbox.stub(vscode.window, 'withProgress').callsFake(async (_opts: any, task: any) => {
            await task({ report: () => {} }, {});
        });

        const orgInfo = { orgId: '00D', username: 'test@test.com', alias: 'test' };
        await executeDeployment(orgInfo, true);
        assert.ok(cpExecStub.calledOnce);
        const cmd = cpExecStub.firstCall.args[0];
        assert.ok(cmd.includes('-c'), `Command should include -c flag: ${cmd}`);
        assert.ok(cmd.includes('-l RunLocalTests'));
    });

    // TS-EXT-082: executeDeployment — real deployment does not include -c
    test('executeDeployment — real deployment does not include -c flag', async () => {
        const { executeDeployment } = require('../../extension');
        sandbox.stub(vscode.window, 'showWarningMessage').resolves('Yes' as any);
        sandbox.stub(utilities, 'getDefaultPackageDirectory').returns('force-app');
        const cp = require('child_process');
        const cpExecStub = sandbox.stub(cp, 'exec').callsFake((...args: any[]) => {
            const cb = args[args.length - 1];
            if (typeof cb === 'function') {
                cb(null, JSON.stringify({ status: 0, result: { status: 'Succeeded' } }), '');
            }
        });
        sandbox.stub(vscode.window, 'withProgress').callsFake(async (_opts: any, task: any) => {
            await task({ report: () => {} }, {});
        });

        const orgInfo = { orgId: '00D', username: 'test@test.com', alias: 'test' };
        await executeDeployment(orgInfo, false);
        const cmd = cpExecStub.firstCall.args[0];
        assert.ok(!cmd.includes(' -c '), `Command should not include -c flag: ${cmd}`);
    });

    // TS-EXT-086: executeDeployment uses default package directory
    test('executeDeployment — uses package directory from sfdx-project.json', async () => {
        const { executeDeployment } = require('../../extension');
        sandbox.stub(vscode.window, 'showWarningMessage').resolves('Yes' as any);
        sandbox.stub(utilities, 'getDefaultPackageDirectory').returns('my-packages');
        const cp = require('child_process');
        const cpExecStub = sandbox.stub(cp, 'exec').callsFake((...args: any[]) => {
            const cb = args[args.length - 1];
            if (typeof cb === 'function') {
                cb(null, JSON.stringify({ status: 0, result: { status: 'Succeeded' } }), '');
            }
        });
        sandbox.stub(vscode.window, 'withProgress').callsFake(async (_opts: any, task: any) => {
            await task({ report: () => {} }, {});
        });

        const orgInfo = { orgId: '00D', username: 'test@test.com', alias: 'test' };
        await executeDeployment(orgInfo, true);
        const cmd = cpExecStub.firstCall.args[0];
        assert.ok(cmd.includes('-d my-packages'), `Command should use package dir: ${cmd}`);
    });

    // TS-EXT-083: executeDeployment — successful shows info
    test('executeDeployment — success shows info notification', async () => {
        const { executeDeployment } = require('../../extension');
        sandbox.stub(vscode.window, 'showWarningMessage').resolves('Yes' as any);
        sandbox.stub(utilities, 'getDefaultPackageDirectory').returns('force-app');
        const cp = require('child_process');
        sandbox.stub(cp, 'exec').callsFake((...args: any[]) => {
            const cb = args[args.length - 1];
            if (typeof cb === 'function') {
                cb(null, JSON.stringify({ status: 0, result: { status: 'Succeeded' } }), '');
            }
        });
        const infoStub = sandbox.stub(utilities, 'promptAndShowInfoLog');
        sandbox.stub(vscode.window, 'withProgress').callsFake(async (_opts: any, task: any) => {
            await task({ report: () => {} }, {});
        });

        const orgInfo = { orgId: '00D', username: 'test@test.com', alias: 'test' };
        await executeDeployment(orgInfo, true);
        assert.ok(infoStub.calledOnce);
        assert.ok(infoStub.firstCall.args[0].includes('Succeeded'));
    });

    // TS-EXT-084: executeDeployment — CLI error shows error
    test('executeDeployment — CLI error shows error notification', async () => {
        const { executeDeployment } = require('../../extension');
        sandbox.stub(vscode.window, 'showWarningMessage').resolves('Yes' as any);
        sandbox.stub(utilities, 'getDefaultPackageDirectory').returns('force-app');
        const cp = require('child_process');
        sandbox.stub(cp, 'exec').callsFake((...args: any[]) => {
            const cb = args[args.length - 1];
            if (typeof cb === 'function') {
                cb('error', '', JSON.stringify({ message: 'Deploy failed', commandName: 'deploy' }));
            }
        });
        const errorStub = sandbox.stub(utilities, 'promptAndShowErrorLog');
        sandbox.stub(vscode.window, 'withProgress').callsFake(async (_opts: any, task: any) => {
            await task({ report: () => {} }, {});
        });

        const orgInfo = { orgId: '00D', username: 'test@test.com', alias: 'test' };
        await executeDeployment(orgInfo, true);
        assert.ok(errorStub.calledOnce);
    });

    // TS-EXT-085: executeDeployment — JSON parse error
    test('executeDeployment — invalid JSON shows parse error', async () => {
        const { executeDeployment } = require('../../extension');
        sandbox.stub(vscode.window, 'showWarningMessage').resolves('Yes' as any);
        sandbox.stub(utilities, 'getDefaultPackageDirectory').returns('force-app');
        const cp = require('child_process');
        sandbox.stub(cp, 'exec').callsFake((...args: any[]) => {
            const cb = args[args.length - 1];
            if (typeof cb === 'function') {
                cb(null, 'not valid json', '');
            }
        });
        const errorStub = sandbox.stub(utilities, 'promptAndShowErrorLog');
        sandbox.stub(vscode.window, 'withProgress').callsFake(async (_opts: any, task: any) => {
            await task({ report: () => {} }, {});
        });

        const orgInfo = { orgId: '00D', username: 'test@test.com', alias: 'test' };
        await executeDeployment(orgInfo, true);
        assert.ok(errorStub.calledOnce);
        assert.ok(errorStub.firstCall.args[0].includes('JSON output parsing'));
    });

    // TS-EXT-060: setScratch uses alias when available
    test('setScratch — uses alias in config command', async () => {
        const { setScratch } = require('../../extension');
        const cp = require('child_process');
        const cpExecStub = sandbox.stub(cp, 'exec').callsFake((...args: any[]) => {
            const cb = typeof args[1] === 'function' ? args[1] : args[2];
            if (typeof cb === 'function') { cb(null, 'ok', ''); }
        });
        const orgInfo = {
            orgId: '00D', username: 'test@test.com', alias: 'my-scratch',
            isDevHub: false, connectedStatus: 'Connected', accessToken: 'T',
            snapshot: '', isExpired: false, expirationDate: '', signupUsername: '',
            defaultMarker: '', isDefaultDevHubUsername: false, devHubUsername: '', devHubOrgId: '',
            instanceUrl: '', loginUrl: ''
        };
        const { Org } = require('../../orgdataprovider');
        const org = new Org(orgInfo, '/tmp');
        org.alias = 'my-scratch';

        await setScratch(org);
        const cmd = cpExecStub.firstCall.args[0];
        assert.ok(cmd.includes('target-org=my-scratch'), `Expected alias in command: ${cmd}`);
    });

    // TS-EXT-061: setScratch uses username when no alias
    test('setScratch — uses username when no alias', async () => {
        const { setScratch } = require('../../extension');
        const cp = require('child_process');
        const cpExecStub = sandbox.stub(cp, 'exec').callsFake((...args: any[]) => {
            const cb = typeof args[1] === 'function' ? args[1] : args[2];
            if (typeof cb === 'function') { cb(null, 'ok', ''); }
        });
        const orgInfo = {
            orgId: '00D', username: 'test@test.com', alias: '',
            isDevHub: false, connectedStatus: 'Connected', accessToken: 'T',
            snapshot: '', isExpired: false, expirationDate: '', signupUsername: '',
            defaultMarker: '', isDefaultDevHubUsername: false, devHubUsername: '', devHubOrgId: '',
            instanceUrl: '', loginUrl: ''
        };
        const { Org } = require('../../orgdataprovider');
        const org = new Org(orgInfo, '/tmp');

        await setScratch(org);
        const cmd = cpExecStub.firstCall.args[0];
        assert.ok(cmd.includes('target-org=test@test.com'), `Expected username in command: ${cmd}`);
    });
});
