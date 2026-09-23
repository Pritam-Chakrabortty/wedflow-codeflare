const jwt = require('jsonwebtoken');
require('dotenv').config();

async function simpleTest() {
  try {
    console.log('=== Simple Workspace Settings Test ===\n');

    // Generate a valid JWT token
    const token = jwt.sign(
      { 
        userId: 'test-user-id', 
        email: 'joyeetadas597@gmail.com', 
        role: 'admin', 
        workspace_id: 'e9417546-ca81-4be9-a65a-d71ef875c0ea' 
      },
      process.env.JWT_SECRET || 'wedflow-crm-secret-key-2024',
      { expiresIn: '7d' }
    );

    console.log('Generated JWT token');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test GET endpoint using native fetch (Node 18+)
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
        crewAssignmentDays: 25,
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
  }
}

simpleTest();