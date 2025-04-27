// Simple test script to check the AI status endpoint
import { request } from 'http';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/predictions/ai-status',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    try {
      const parsedData = JSON.parse(data);
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('Raw data (not valid JSON):');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();