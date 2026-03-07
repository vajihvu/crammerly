#!/usr/bin/env node
/**
 * Pre-Launch Security Script: Test Account Purge
 * ─────────────────────────────────────────────
 * Finds and optionally removes development / test user accounts from the
 * database before going live. Runs in dry-run mode by default.
 *
 * Usage:
 *   # Dry-run (safe — lists matches only, no deletions):
 *   node purge_test_accounts.js
 *
 *   # Actually delete matched accounts:
 *   node purge_test_accounts.js --confirm
 *
 * Configure MONGO_URI via environment variable or .env file.
 */

import mongoose from 'mongoose';
import { createInterface } from 'readline';
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load env from backend directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const DRY_RUN = !process.argv.includes('--confirm');
const FORCE = process.argv.includes('--force'); // Skip interactive confirmation

// Email patterns considered test/dev accounts
const TEST_EMAIL_PATTERNS = [
    /@example\.com$/i,
    /@example\.org$/i,
    /@mailinator\.com$/i,
    /@mailtrap\.io$/i,
    /@guerrillamail\.com$/i,
    /@crammerly\.local$/i,       // Local dev SMTP_FROM domain
    /@test\.com$/i,
    /^test[@+]/i,
    /^demo[@+]/i,
    /^admin[@+]/i,
    /^seed[@+]/i,
];

// Name patterns considered test/dev accounts
const TEST_NAME_PATTERNS = [
    /^test\s*user$/i,
    /^demo\s*user$/i,
    /^seed\s*user$/i,
    /^fake\s*user$/i,
];

function isTestAccount(user) {
    if (TEST_EMAIL_PATTERNS.some(p => p.test(user.email))) return true;
    if (TEST_NAME_PATTERNS.some(p => p.test(user.name))) return true;
    return false;
}

async function promptConfirmation(count) {
    if (FORCE) return true;
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(`\n⚠️  About to permanently delete ${count} user(s). Type "YES" to continue: `, answer => {
            rl.close();
            resolve(answer.trim() === 'YES');
        });
    });
}

async function run() {
    if (!MONGO_URI) {
        console.error('❌  MONGO_URI is not set. Cannot connect to database.');
        console.error('   Set it in ../backend/.env or export it as an environment variable.');
        process.exit(1);
    }

    console.log('\n🔍  Test Account Purge Script');
    console.log('   Mode:', DRY_RUN ? '🟡 DRY RUN (no deletions)' : '🔴 LIVE DELETE');
    console.log('   Database:', MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@'));
    console.log('─'.repeat(60));

    await mongoose.connect(MONGO_URI);

    // Fetch all users with only the fields we need to evaluate
    const User = mongoose.model('User', new mongoose.Schema({
        name: String,
        email: String,
        role: String,
        createdAt: Date,
        isEmailVerified: Boolean,
    }, { strict: false, collection: 'users' }));

    const allUsers = await User.find({}, 'name email role createdAt isEmailVerified').lean();
    const testAccounts = allUsers.filter(isTestAccount);

    if (testAccounts.length === 0) {
        console.log('\n✅  No test accounts found. Database looks clean.');
        await mongoose.disconnect();
        return;
    }

    console.log(`\nFound ${testAccounts.length} potential test account(s):\n`);
    testAccounts.forEach((u, i) => {
        const verified = u.isEmailVerified ? '✉️  verified' : '📭 unverified';
        const created = u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : 'unknown';
        console.log(`  ${String(i + 1).padStart(3)}. ${u.email.padEnd(40)} [${u.role || 'user'}] ${verified} — created ${created}`);
    });

    if (DRY_RUN) {
        console.log('\n💡  Dry-run complete. No accounts were deleted.');
        console.log('   To delete these accounts, run: node purge_test_accounts.js --confirm');
        await mongoose.disconnect();
        return;
    }

    const confirmed = await promptConfirmation(testAccounts.length);
    if (!confirmed) {
        console.log('\n🚫  Aborted. No accounts were deleted.');
        await mongoose.disconnect();
        return;
    }

    // Also clean up any sessions belonging to these accounts
    const testIds = testAccounts.map(u => u._id);

    const Session = mongoose.model('_Session', new mongoose.Schema({}, { strict: false, collection: 'sessions' }));
    const AuditLog = mongoose.model('_AuditLog', new mongoose.Schema({}, { strict: false, collection: 'auditlogs' }));

    const sessionResult = await Session.deleteMany({ user: { $in: testIds } });
    const auditResult = await AuditLog.deleteMany({ user: { $in: testIds } });
    const userResult = await User.deleteMany({ _id: { $in: testIds } });

    console.log('\n🗑️   Deleted:');
    console.log(`   • ${userResult.deletedCount} user(s)`);
    console.log(`   • ${sessionResult.deletedCount} session(s)`);
    console.log(`   • ${auditResult.deletedCount} audit log(s)`);
    console.log('\n✅  Done. Run this script again to verify the database is clean.');

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('❌  Script failed:', err.message);
    process.exit(1);
});
