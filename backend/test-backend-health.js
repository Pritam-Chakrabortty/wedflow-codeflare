const http = require('http');

async function testBackendHealth() {
  return new Promise((resolve) => {
    http.get('https://wedflow-codeflare.onrender.com/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve(res.statusCode === 200);
      });
    }).on('error', (err) => {
      console.error(`Error: ${err.message}`);
      resolve(false);
    });
  });
}

testBackendHealth().then(success => {
  console.log(`\nBackend Health: ${success ? 'PASS' : 'FAIL'}`);
  process.exit(success ? 0 : 1);
});
