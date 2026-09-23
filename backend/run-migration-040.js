const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function executeMigration() {
  try {
    console.log('=== EXECUTING MIGRATION 040 ===\n');

    const migrationSQL = fs.readFileSync('./migrations/040_add_workspace_settings.sql', 'utf8');
    const cleanSQL = migrationSQL.replace(/```sql|```/g, '');
    
    console.log('Executing migration SQL...');
    await pool.query(cleanSQL);
    
    console.log('\n✓ MIGRATION 040 EXECUTED SUCCESSFULLY');
    
  } catch (error) {
    console.error('\n✗ MIGRATION FAILED');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
    console.error('Hint:', error.hint);
    throw error;
  } finally {
    await pool.end();
  }
}

executeMigration();