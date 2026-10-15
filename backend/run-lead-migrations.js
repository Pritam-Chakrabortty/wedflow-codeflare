const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeMigration(migrationNumber, fileName) {
  try {
    console.log(`=== EXECUTING MIGRATION ${migrationNumber} ===\n`);

    const migrationSQL = fs.readFileSync(`./migrations/${fileName}`, 'utf8');

    console.log('Executing migration SQL...');
    await pool.query(migrationSQL);

    console.log(`\n✓ MIGRATION ${migrationNumber} EXECUTED SUCCESSFULLY`);
    return true;

  } catch (error) {
    console.error(`\n✗ MIGRATION ${migrationNumber} FAILED`);
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
    console.error('Hint:', error.hint);
    return false;
  }
}

async function runLeadMigrations() {
  try {
    const migration1 = await executeMigration('048', '048_create_leads_table.sql');
    if (!migration1) {
      console.log('\nStopping due to migration 048 failure');
      await pool.end();
      process.exit(1);
    }

    const migration2 = await executeMigration('049', '049_create_lead_activities_table.sql');
    if (!migration2) {
      console.log('\nMigration 048 succeeded but 049 failed');
      await pool.end();
      process.exit(1);
    }

    console.log('\n=== ALL LEAD MIGRATIONS COMPLETED SUCCESSFULLY ===');

  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    await pool.end();
  }
}

runLeadMigrations();
