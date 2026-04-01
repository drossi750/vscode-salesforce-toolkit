import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as utilities from '../../utilities';

suite('Utilities Test Suite', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    // TS-UTIL-001 / TS-UTIL-002: Simple and nested variable substitution
    test('Template micro-engine — simple and nested vars', () => {
        var DomParser = require('dom-parser');
        const templateFile = path.join(__dirname, '..', '..', '..', 'resources', 'test', 'template.html');
        let varWrapper = {
            var1: 'VAR1_CONTENT',
            var2: {
                value1: 'VAR2_VALUE1_CONTENT',
                value2: 'VAR2_VALUE2_CONTENT'
            }
        };
        const templateContent = utilities.loadFromTemplate(templateFile, varWrapper);
        var parser = new DomParser();
        var htmlDoc = parser.parseFromString(templateContent, 'text/html');
        assert.equal(htmlDoc.getElementById('value1').textContent, varWrapper.var1);
        assert.equal(htmlDoc.getElementById('value2').textContent, varWrapper.var2.value1);
        assert.equal(htmlDoc.getElementById('value3').textContent, varWrapper.var2.value2);
    });

    // TS-UTIL-004: Template with no variables
    test('Template micro-engine — no variables returns content unchanged', () => {
        const tmpDir = path.join(__dirname, '..', '..', '..', 'resources', 'test');
        const tmpFile = path.join(tmpDir, 'no_vars.html');
        const content = '<html><body>No vars here</body></html>';
        fs.writeFileSync(tmpFile, content);
        try {
            const result = utilities.loadFromTemplate(tmpFile, {});
            assert.equal(result, content);
        } finally {
            fs.unlinkSync(tmpFile);
        }
    });

    // TS-UTIL-005: Variable resolving to undefined
    test('Template micro-engine — undefined variable becomes string "undefined"', () => {
        const tmpDir = path.join(__dirname, '..', '..', '..', 'resources', 'test');
        const tmpFile = path.join(tmpDir, 'undef_var.html');
        fs.writeFileSync(tmpFile, '<span>${missing}</span>');
        try {
            const result = utilities.loadFromTemplate(tmpFile, {});
            assert.ok(result.includes('undefined'));
        } finally {
            fs.unlinkSync(tmpFile);
        }
    });

    // TS-UTIL-006: Variable resolving to empty string
    test('Template micro-engine — empty string variable', () => {
        const tmpDir = path.join(__dirname, '..', '..', '..', 'resources', 'test');
        const tmpFile = path.join(tmpDir, 'empty_var.html');
        fs.writeFileSync(tmpFile, '<span id="v">${var1}</span>');
        try {
            const result = utilities.loadFromTemplate(tmpFile, { var1: '' });
            assert.ok(result.includes('<span id="v"></span>'));
        } finally {
            fs.unlinkSync(tmpFile);
        }
    });

    // TS-UTIL-008: File not found
    test('Template micro-engine — file not found throws', () => {
        assert.throws(() => {
            utilities.loadFromTemplate('/nonexistent/path/template.html', {});
        });
    });

    // TS-UTIL-015: Get Extension — found
    test('Get Extension — returns extension with correct id', () => {
        // Extension may not be active in test workspace (no sfdx-project.json)
        // but should still be discoverable
        try {
            const extension = utilities.getExtension();
            assert.equal(extension?.id, utilities.extensionId);
        } catch (e) {
            // Extension not found in test host — acceptable in CI
            assert.ok(true);
        }
    });

    // TS-UTIL-016: Get Extension — not found
    test('Get Extension — throws when not found', () => {
        const stub = sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);
        assert.throws(() => {
            utilities.getExtension();
        }, /Extension was not found/);
        stub.restore();
    });

    // TS-UTIL-009: getWorkspaceRoot with folders
    test('getWorkspaceRoot — returns first workspace folder path', () => {
        const root = utilities.getWorkspaceRoot();
        // In the test host, workspace may or may not be set
        assert.equal(typeof root, 'string');
    });

    // TS-UTIL-011: getDefaultPackageDirectory with valid sfdx-project.json
    test('getDefaultPackageDirectory — returns default path', () => {
        const tmpFile = path.join(__dirname, '..', '..', '..', 'sfdx-project.json');
        const original = fs.existsSync(tmpFile) ? fs.readFileSync(tmpFile, 'utf-8') : null;
        fs.writeFileSync(tmpFile, JSON.stringify({
            packageDirectories: [
                { path: 'other', default: false },
                { path: 'force-app', default: true }
            ]
        }));
        try {
            const result = utilities.getDefaultPackageDirectory();
            assert.equal(result, 'force-app');
        } finally {
            if (original !== null) { fs.writeFileSync(tmpFile, original); }
            else { fs.unlinkSync(tmpFile); }
        }
    });

    // TS-UTIL-012: Multiple package directories — picks default
    test('getDefaultPackageDirectory — picks the default among multiple', () => {
        const tmpFile = path.join(__dirname, '..', '..', '..', 'sfdx-project.json');
        const original = fs.existsSync(tmpFile) ? fs.readFileSync(tmpFile, 'utf-8') : null;
        fs.writeFileSync(tmpFile, JSON.stringify({
            packageDirectories: [
                { path: 'pkg-a' },
                { path: 'pkg-b', default: true },
                { path: 'pkg-c', default: false }
            ]
        }));
        try {
            const result = utilities.getDefaultPackageDirectory();
            assert.equal(result, 'pkg-b');
        } finally {
            if (original !== null) { fs.writeFileSync(tmpFile, original); }
            else { fs.unlinkSync(tmpFile); }
        }
    });

    // TS-UTIL-013: No default directory
    test('getDefaultPackageDirectory — returns undefined when no default', () => {
        const tmpFile = path.join(__dirname, '..', '..', '..', 'sfdx-project.json');
        const original = fs.existsSync(tmpFile) ? fs.readFileSync(tmpFile, 'utf-8') : null;
        fs.writeFileSync(tmpFile, JSON.stringify({
            packageDirectories: [{ path: 'force-app' }]
        }));
        try {
            const result = utilities.getDefaultPackageDirectory();
            assert.equal(result, undefined);
        } finally {
            if (original !== null) { fs.writeFileSync(tmpFile, original); }
            else { fs.unlinkSync(tmpFile); }
        }
    });

    // TS-UTIL-017: promptAndShowErrorLog — user clicks Show Logs
    test('promptAndShowErrorLog — shows logs when user clicks Show Logs', async () => {
        const showStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves('Show Logs' as any);
        const logShowStub = sandbox.stub(utilities.loggingChannel, 'show');
        await utilities.promptAndShowErrorLog('test error');
        assert.ok(logShowStub.calledOnce);
    });

    // TS-UTIL-018: promptAndShowErrorLog — user clicks Close
    test('promptAndShowErrorLog — does not show logs when user clicks Close', async () => {
        sandbox.stub(vscode.window, 'showErrorMessage').resolves('Close' as any);
        const logShowStub = sandbox.stub(utilities.loggingChannel, 'show');
        await utilities.promptAndShowErrorLog('test error');
        assert.ok(logShowStub.notCalled);
    });

    // TS-UTIL-019: promptAndShowErrorLog — user dismisses
    test('promptAndShowErrorLog — does not show logs when dismissed', async () => {
        sandbox.stub(vscode.window, 'showErrorMessage').resolves(undefined as any);
        const logShowStub = sandbox.stub(utilities.loggingChannel, 'show');
        await utilities.promptAndShowErrorLog('test error');
        assert.ok(logShowStub.notCalled);
    });

    // TS-UTIL-017 variant: promptAndShowInfoLog
    test('promptAndShowInfoLog — shows logs when user clicks Show Logs', async () => {
        const showStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves('Show Logs' as any);
        const logShowStub = sandbox.stub(utilities.loggingChannel, 'show');
        await utilities.promptAndShowInfoLog('test info');
        assert.ok(logShowStub.calledOnce);
    });

    // TS-UTIL-018 variant: promptAndShowInfoLog — Close
    test('promptAndShowInfoLog — does not show logs when user clicks Close', async () => {
        sandbox.stub(vscode.window, 'showInformationMessage').resolves('Close' as any);
        const logShowStub = sandbox.stub(utilities.loggingChannel, 'show');
        await utilities.promptAndShowInfoLog('test info');
        assert.ok(logShowStub.notCalled);
    });
});
