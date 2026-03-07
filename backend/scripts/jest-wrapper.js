import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Shell-agnostic test runner
 * Sets NODE_ENV=test and runs Jest with experimental VM modules
 */

process.env.NODE_ENV = 'test';

// Path to Jest executable - Resolve dynamically for portability
let jestPath;
try {
    // 1. Try resolving via Node's ESM resolution
    jestPath = fileURLToPath(await import.meta.resolve('jest/bin/jest.js'));
} catch (_e) {
    // 2. Fallback: Search for the binary in common node_modules patterns
    const rootPath = path.resolve(__dirname, '../../node_modules');
    const localPath = path.resolve(__dirname, '../node_modules');

    jestPath = [
        path.join(rootPath, 'jest/bin/jest.js'),
        path.join(localPath, 'jest/bin/jest.js')
    ].find(p => fs.existsSync(p)) || 'npx jest'; // Last resort
}


const args = [
    '--experimental-vm-modules',
    jestPath,
    '--runInBand',
    '--forceExit',
    ...process.argv.slice(2)
];

console.log('--- Starting Crammerly Test Suite ---');
console.log(`Command: node ${args.join(' ')}`);

const jestProcess = spawn('node', args, {
    stdio: 'inherit',
    env: process.env,
    shell: true
});

jestProcess.on('exit', (code) => {
    process.exit(code || 0);
});
