const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testWithRealUser() {
  try {
    console.log('=== Testing with Real User ===\n');

    // Get a real user from database
    const userResult = await pool.query(
      'SELECT id, email, role, workspace_id FROM users WHERE email = $1 LIMIT 1',
      ['joyeetadas597@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('Found user:', user.email, 'Role:', user.role, 'Workspace:', user.workspace_id);

    // Generate token with the same secret as the server
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role, 
        workspace_id: user.workspace_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Generated token with JWT_SECRET from environment');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test the API
    console.log('\nTesting GET /api/workspace/settings...');
    const getResponse = await fetch('http://localhost:5001/api/workspace/settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', getResponse.status);
    const getResponseText = await getResponse.text();
    console.log('Response body:', getResponseText);

    if (getResponse.ok) {
      const data = JSON.parse(getResponseText);
      console.log('✓ GET request successful');
      console.log('Parsed data:', JSON.stringify(data, null, 2));
    } else {
      console.log('✗ GET request failed');
    }

    // Test PUT endpoint
    console.log('\nTesting PUT /api/workspace/settings...');
    const putResponse = await fetch('http://localhost:5001/api/workspace/settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        crewAssignmentDays: 30,
        notificationMode: 'email'
      }),
    });

    console.log('Response status:', putResponse.status);
    const putResponseText = await putResponse.text();
    console.log('Response body:', putResponseText);

    if (putResponse.ok) {
      const data = JSON.parse(putResponseText);
      console.log('✓ PUT request successful');
      console.log('Parsed data:', JSON.stringify(data, null, 2));
    } else {
      console.log('✗ PUT request failed');
    }

    console.log('\n✓ Test completed');

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testWithRealUser();