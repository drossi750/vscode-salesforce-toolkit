import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Package.json Contribution Tests', () => {
    let packageJson: any;

    setup(() => {
        const pkgPath = path.join(__dirname, '..', '..', '..', 'package.json');
        packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    });

    // TS-ISS29-009: Verify when clause syntax for setScratch
    test('setScratch menu — visible for both scratch and scratch.selected', () => {
        const menus = packageJson.contributes.menus['view/item/context'];
        const setScratchMenu = menus.find((m: any) => m.command === 'sftk.setScratch');
        assert.ok(setScratchMenu, 'sftk.setScratch should be in view/item/context menus');
        assert.ok(setScratchMenu.when.includes('viewItem == scratch'), 'when clause should match scratch');
        assert.ok(setScratchMenu.when.includes('viewItem == scratch.selected'), 'when clause should match scratch.selected');
    });

    // TS-ISS29-003 / TS-ISS29-004: Star visible for both devhub and devhub.selected
    test('setDevHub menu — visible for both devhub and devhub.selected', () => {
        const menus = packageJson.contributes.menus['view/item/context'];
        const setDevHubMenu = menus.find((m: any) => m.command === 'sftk.setDevHub');
        assert.ok(setDevHubMenu, 'sftk.setDevHub should be in view/item/context menus');
        assert.ok(setDevHubMenu.when.includes('viewItem == devhub'), 'when clause should match devhub');
        assert.ok(setDevHubMenu.when.includes('viewItem == devhub.selected'), 'when clause should match devhub.selected');
    });

    // TS-ISS29-008: Sandbox orgs have no set-default action
    test('No setScratch or setDevHub for sandbox context', () => {
        const menus = packageJson.contributes.menus['view/item/context'];
        const setScratchMenu = menus.find((m: any) => m.command === 'sftk.setScratch');
        const setDevHubMenu = menus.find((m: any) => m.command === 'sftk.setDevHub');
        assert.ok(!setScratchMenu.when.includes('sandbox'), 'setScratch should not match sandbox');
        assert.ok(!setDevHubMenu.when.includes('sandbox'), 'setDevHub should not match sandbox');
    });

    // Verify deleteScratch works for both selected and unselected
    test('deleteScratch menu — works for both scratch and scratch.selected', () => {
        const menus = packageJson.contributes.menus['view/item/context'];
        const deleteMenu = menus.find((m: any) => m.command === 'sftk.deleteScratch');
        assert.ok(deleteMenu);
        assert.ok(deleteMenu.when.includes('scratch.selected'), 'delete should work on selected scratch');
        assert.ok(deleteMenu.when.includes('viewItem == scratch'), 'delete should work on unselected scratch');
    });

    // Verify activation event
    test('Activation event — workspaceContains:sfdx-project.json', () => {
        assert.ok(packageJson.activationEvents.includes('workspaceContains:sfdx-project.json'));
    });

    // Verify all configuration properties exist
    test('Configuration — all settings defined', () => {
        const props = packageJson.contributes.configuration.properties;
        assert.ok(props['sftk.scratchOrgTimeoutOnCreate']);
        assert.ok(props['sftk.showExpiredScratchOrgs']);
        assert.ok(props['sftk.enableSysAdminActions']);
    });

    // Verify all commands are defined
    test('Commands — all sftk commands defined', () => {
        const commands = packageJson.contributes.commands.map((c: any) => c.command);
        const expected = [
            'sftk.createScratch', 'sftk.refreshExplorer', 'sftk.createScratchPalette',
            'sftk.purgeExpiredScratchOrgs', 'sftk.setDevHub', 'sftk.setScratch',
            'sftk.openOrg', 'sftk.openOrgSetup', 'sftk.deleteScratch', 'sftk.deleteScratchPalette'
        ];
        for (const cmd of expected) {
            assert.ok(commands.includes(cmd), `Command ${cmd} should be defined in package.json`);
        }
    });

    // Verify tree view configuration
    test('Tree view — connected-orgs view defined with sftkEnabled when clause', () => {
        const views = packageJson.contributes.views['org-explorer'];
        const connectedOrgs = views.find((v: any) => v.id === 'connected-orgs');
        assert.ok(connectedOrgs);
        assert.equal(connectedOrgs.when, 'sftkEnabled');
    });
});
