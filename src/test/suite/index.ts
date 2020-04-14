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

import * as path from 'path';
import Mocha = require('mocha');
import glob = require('glob');
import { use } from 'chai';
import { join } from 'path';
import 'reflect-metadata';

use(require('chai-subset'));
use(require('chai-as-promised'));

function intializeNyc() {
    const NYC = require('nyc');
    const nyc = new NYC({
        cwd: join(__dirname, '..', '..', '..'),
        exclude: ['**/test/**', '.vscode-test/**'],
        reporter: ['text', 'html'],
        all: true,
        instrument: true,
        hookRequire: true,
        hookRunInContext: true,
        hookRunInThisContext: true,
    });
    nyc.reset();
    nyc.wrap();
    return nyc;
}

export async function run(): Promise<void> {
    const nyc = intializeNyc();
    const runner = new Mocha({});
    runner.useColors(true);
    runner.ui('tdd');

    const testsRoot = path.resolve(__dirname, '..');
    const files: Array<string> = await new Promise((resolve, reject) =>
        glob(
            '**/**.test.js',
            {
                cwd: testsRoot,
            },
            (err, files) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(files);
                }
            }
        )
    );

    // Add files to the test suite
    files.forEach(f => runner.addFile(path.resolve(testsRoot, f)));

    try {
        await new Promise((resolve, reject) =>
            runner.run(failures =>
                failures ? reject(new Error(`${failures} tests failed`)) : resolve(),
            ),
        );
    } finally {
        if (nyc) {
            nyc.writeCoverageFile();
            nyc.report();
        }
    }
}