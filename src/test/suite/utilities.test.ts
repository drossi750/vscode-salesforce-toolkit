import * as assert from 'assert';
import * as utilities from '../../utilities';

suite('Utilities Test Suite', () => {
    test('Template micro-engine', () => {
        var DomParser = require('dom-parser');
        const templateFile = __dirname + '/../../../resources/test/template.html';
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

    test('Get Extension', () => {
        const extension = utilities.getExtension();
        assert.equal(extension?.id, utilities.extensionId);
    });
});