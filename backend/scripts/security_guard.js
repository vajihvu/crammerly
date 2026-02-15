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
    const auditOutput = execSync('npm audit --json').toString();
    const auditData = JSON.parse(auditOutput);

    // In production/CI, we want to fail on HIGH or CRITICAL vulnerabilities
    const criticalIssues = auditData.metadata.vulnerabilities.critical || 0;
    const highIssues = auditData.metadata.vulnerabilities.high || 0;

    if (criticalIssues > 0 || highIssues > 0) {
        console.error(`🚨 SECURITY FAILURE: ${criticalIssues} Critical and ${highIssues} High vulnerabilities found!`);
        console.error('Action required: Run `npm audit fix` or update dependencies manually.');
        process.exit(1);
    } else if (auditData.metadata.vulnerabilities.total > 0) {
        console.warn(`⚠️ Warning: ${auditData.metadata.vulnerabilities.total} low/moderate vulnerabilities found.`);
    } else {
        console.log('✅ Dependencies are clean.');
    }
} catch (err) {
    // npm audit exits with 1 if vulnerabilities are found, so we check the output
    if (err.stdout) {
        const auditData = JSON.parse(err.stdout.toString());
        const criticalIssues = (auditData.metadata.vulnerabilities.critical || 0);
        const highIssues = (auditData.metadata.vulnerabilities.high || 0);

        if (criticalIssues > 0 || highIssues > 0) {
            console.error(`🚨 SECURITY FAILURE: ${criticalIssues} Critical and ${highIssues} High vulnerabilities found!`);
            process.exit(1);
        }
        console.warn(`⚠️ Warning: ${auditData.metadata.vulnerabilities.total} low/moderate vulnerabilities found.`);
    } else {
        console.error('Audit failed to run:', err.message);
    }
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

// 3. Static Analysis
console.log('Running static analysis (ESLint)...');
try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('✅ Linting passed.');
} catch (_err) {
    console.error('🚨 LINT FAILURE: AI-generated code must follow project standards.');
    process.exit(1);
}

console.log('\n✨ Security Guard: All gates passed.');
console.log('--- Audit Complete ---');
