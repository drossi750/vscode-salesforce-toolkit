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