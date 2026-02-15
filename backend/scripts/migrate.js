import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// Migration Schema
const migrationSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    appliedAt: { type: Date, default: Date.now }
});

const Migration = mongoose.model('_Migration', migrationSchema);

const runMigrations = async () => {
    console.log('🚀 Starting database migrations...');

    try {
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        // Ensure migrations directory exists
        if (!fs.existsSync(MIGRATIONS_DIR)) {
            fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
        }

        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter(f => f.endsWith('.js'))
            .sort(); // Run in alphabetical order

        if (files.length === 0) {
            console.log('✅ No migrations found.');
            process.exit(0);
        }

        const appliedMigrations = await Migration.find({}).select('name');
        const appliedNames = appliedMigrations.map(m => m.name);

        const pendingFiles = files.filter(f => !appliedNames.includes(f));

        if (pendingFiles.length === 0) {
            console.log('✅ All migrations are up to date.');
            process.exit(0);
        }

        console.log(`Found ${pendingFiles.length} pending migrations.`);

        for (const file of pendingFiles) {
            console.log(`Applying migration: ${file}...`);
            const migrationPath = path.join(MIGRATIONS_DIR, file);

            // Using dynamic import for ESM
            const { up } = await import(`file://${migrationPath}`);

            if (typeof up !== 'function') {
                throw new Error(`Migration ${file} does not export an 'up' function.`);
            }

            // Start session for transaction if supported by environment
            // Note: Transactions require replica sets. For simplicity, we just run the function.
            await up(mongoose.connection.db);

            await Migration.create({ name: file });
            console.log(`✅ Success: ${file}`);
        }

        console.log('🎊 All migrations applied successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
};

runMigrations();
