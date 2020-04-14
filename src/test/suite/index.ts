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
    const mochaOpts = {
        timeout: 10 * 1000,
        ui: 'tdd',
        ...JSON.parse(process.env.TEST_OPTIONS || '{}'),
    };
    const runner = new Mocha(mochaOpts);

    runner.useColors(true);

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