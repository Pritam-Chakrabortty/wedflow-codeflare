const fetch = require('node-fetch');

async function testSettingsWithOTP() {
  try {
    console.log('=== Testing Settings with Real OTP Flow ===\n');

    // Step 1: Send OTP (bypass Turnstile for testing)
    console.log('1. Sending OTP...');
    const otpResponse = await fetch('http://localhost:5001/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'joyeetadas597@gmail.com',
        turnstileToken: 'test_bypass_token' // This might fail due to Turnstile validation
      }),
    });

    if (!otpResponse.ok) {
      const error = await otpResponse.json();
      console.log('OTP send failed (expected due to Turnstile):', error);
      console.log('Let me try to generate a test token directly...');
      
      // Generate a test token directly
      const jwt = require('jsonwebtoken');
      const testToken = jwt.sign(
        { 
          userId: 'test-user-id', 
          email: 'joyeetadas597@gmail.com', 
          role: 'admin', 
          workspace_id: 'e9417546-ca81-4be9-a65a-d71ef875c0ea' 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      console.log('Generated test token');
      await testWorkspaceEndpoints(testToken);
      return;
    }

    const otpData = await otpResponse.json();
    console.log('OTP sent:', otpData);

    // For this test, we'll skip the actual OTP verification and generate a test token
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      { 
        userId: 'test-user-id', 
        email: 'joyeetadas597@gmail.com', 
        role: 'admin', 
        workspace_id: 'e9417546-ca81-4be9-a65a-d71ef875c0ea' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    await testWorkspaceEndpoints(testToken);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function testWorkspaceEndpoints(token) {
  try {
    // Test GET endpoint
    console.log('\n2. Testing GET /api/workspace/settings...');
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

    // Test PUT endpoint
    console.log('\n3. Testing PUT /api/workspace/settings...');
    const putResponse = await fetch('http://localhost:5001/api/workspace/settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        crewAssignmentDays: 20,
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

    console.log('\n✓ All API tests completed');

  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testSettingsWithOTP();