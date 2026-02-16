import { spawn } from 'child_process';
import path from 'path';
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
    // Try resolving from the current workspace or root
    jestPath = fileURLToPath(await import.meta.resolve('jest/bin/jest.js'));
} catch (e) {
    // Fallback for some node versions/environments
    jestPath = path.resolve(__dirname, '../../node_modules/jest/bin/jest.js');
}

const args = [
    '--experimental-vm-modules',
    jestPath,
    '--runInBand',
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
