const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testWorkspaceAPI() {
  try {
    console.log('=== Testing Workspace Settings API ===\n');

    // Step 1: Get a valid user and generate a test token
    console.log('1. Getting test user...');
    const userResult = await pool.query(
      'SELECT id, email, role, workspace_id FROM users WHERE email = $1 LIMIT 1',
      ['joyeetadas597@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('Test user not found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`Found user: ${user.email}, Role: ${user.role}, Workspace: ${user.workspace_id}`);

    // Generate a test JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, workspace_id: user.workspace_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('Generated test JWT token');

    // Step 2: Test GET /api/workspace/settings
    console.log('\n2. Testing GET /api/workspace/settings...');
    const fetch = (await import('node-fetch')).default;
    
    const getResponse = await fetch('http://localhost:5001/api/workspace/settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✓ GET request successful');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await getResponse.json();
      console.log('✗ GET request failed:', error);
    }

    // Step 3: Test PUT /api/workspace/settings
    console.log('\n3. Testing PUT /api/workspace/settings...');
    const putResponse = await fetch('http://localhost:5001/api/workspace/settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        crewAssignmentDays: 15,
        notificationMode: 'email'
      }),
    });

    if (putResponse.ok) {
      const data = await putResponse.json();
      console.log('✓ PUT request successful');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await putResponse.json();
      console.log('✗ PUT request failed:', error);
    }

    // Step 4: Verify the update in database
    console.log('\n4. Verifying database update...');
    const verifyResult = await pool.query(
      'SELECT crew_assignment_days, notification_mode FROM workspace WHERE id = $1',
      [user.workspace_id]
    );

    if (verifyResult.rows.length > 0) {
      const workspace = verifyResult.rows[0];
      console.log('Database values after update:');
      console.log(`  - Crew Assignment Days: ${workspace.crew_assignment_days}`);
      console.log(`  - Notification Mode: ${workspace.notification_mode}`);
    }

    console.log('\n✓ API testing completed');

  } catch (error) {
    console.error('\n✗ Test failed');
    console.error('Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

testWorkspaceAPI();