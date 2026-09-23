const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function insertMarketplaceData() {
  try {
    console.log('Getting workspace ID...');
    const userResult = await pool.query('SELECT workspace_id FROM users LIMIT 1');
    const workspaceId = userResult.rows[0]?.workspace_id;

    if (!workspaceId) {
      console.error('No workspace ID found');
      return;
    }

    console.log('Workspace ID:', workspaceId);

    // Insert freelancer
    console.log('Inserting freelancer...');
    const freelancerResult = await pool.query(
      `INSERT INTO freelancers (workspace_id, name, email, phone, specialization, availability, status, rate, notes, skills, experience_years, city, state, verified, profile_type, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        workspaceId,
        'Zack P',
        'zackagarwal@gmail.com',
        '8296100911',
        'Wedding Photographer',
        'available',
        'active',
        1500,
        'Experienced wedding photographer',
        ['Wedding Photographer', 'Cinematographer', 'Traditional Videographer', 'Drone Operator', 'Photo Editor', 'Video Editor'],
        12,
        'Kolkata',
        'West Bengal',
        true,
        'individual',
        'summary of my work, my life'
      ]
    );
    console.log('Created freelancer:', freelancerResult.rows[0]);

    // Insert work request
    console.log('Inserting work request...');
    const workRequestResult = await pool.query(
      `INSERT INTO marketplace_work_requests (workspace_id, project_name, professional_role, professional_name, professional_email, professional_phone, event_date, venue, budget, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        workspaceId,
        'Wedding coverage for 1L users',
        'Wedding Photographer',
        'Zack P',
        'zackagarwal@gmail.com',
        '8296100911',
        '2026-06-29',
        'Venue',
        20000,
        'accepted',
        'Test work request'
      ]
    );
    console.log('Created work request:', workRequestResult.rows[0]);

    console.log('✓ Test data inserted successfully');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

insertMarketplaceData();
