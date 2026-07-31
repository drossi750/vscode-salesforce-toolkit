import * as path from 'path';
import Mocha = require('mocha');
import { glob } from 'glob';

export async function run(): Promise<void> {
    const runner = new Mocha({ timeout: 30000 });
    runner.ui('tdd');

    const testsRoot = path.resolve(__dirname, '..');
    const files = await glob('**/**.test.js', { cwd: testsRoot });

    files.forEach(f => runner.addFile(path.resolve(testsRoot, f)));

    return new Promise<void>((resolve, reject) =>
        runner.run(failures =>
            failures ? reject(new Error(`${failures} tests failed`)) : resolve()
        )
    );
}
