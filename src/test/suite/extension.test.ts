import * as assert from 'assert';
import * as utilities from '../../utilities';

suite('Extension Test Suite', () => {
    test('Dummy', () => {
        const extension = utilities.getExtension();
        assert.equal(extension?.id, utilities.extensionId);
    });
});