#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

/**
 * Security Audit & SBOM Generator
 * Principle: Treat AI code as untrusted, verify dependencies
 */

console.log('--- Starting Security Guard Audit ---');

// 1. Run Dependency Audit
console.log('Checking for vulnerable dependencies...');
try {
    const audit = execSync('npm audit --json').toString();
    const auditData = JSON.parse(audit);
    if (auditData.metadata.vulnerabilities.total > 0) {
        console.warn('Vulnerabilities found! Please run `npm audit fix`.');
    } else {
        console.log('✅ Dependencies are clean.');
    }
} catch (_err) {
    console.warn('Audit found potential issues. Review results manually.');
}

// 2. Generate SBOM (Software Bill of Materials)
console.log('Generating SBOM (bom.json)...');
try {
    // We can use a simple custom generator if cyclonedx isn't installed
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const sbom = {
        bomFormat: 'CycloneDX',
        specVersion: '1.4',
        metadata: {
            timestamp: new Date().toISOString(),
            component: {
                name: pkg.name,
                version: pkg.version,
                type: 'application'
            }
        },
        components: Object.keys(pkg.dependencies || {}).map(name => ({
            name,
            version: pkg.dependencies[name],
            type: 'library'
        }))
    };
    fs.writeFileSync('./bom.json', JSON.stringify(sbom, null, 2));
    console.log('✅ SBOM generated successfully.');
} catch (err) {
    console.error('Failed to generate SBOM:', err);
}

// 3. Static Analysis Placeholder
console.log('Running static analysis (ESLint)...');
try {
    execSync('npm run lint');
    console.log('✅ Linting passed.');
} catch (_err) {
    console.warn('⚠️ Linting found issues. AI-generated code must follow project standards.');
}

console.log('--- Audit Complete ---');
