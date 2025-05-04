/**
 * AI Microservice Connection Checker
 * This script verifies connectivity to the AI microservice running on port 5000
 */

import http from 'http';

console.log('PuntaIQ AI Microservice Connection Test');
console.log('--------------------------------------');

// Try to connect to the AI microservice
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/status',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      console.log('\nConnection successful! AI Microservice is operational.');
    } catch (e) {
      console.log(data);
      console.log('\nWarning: Response is not valid JSON.');
    }
  });
});

req.on('error', (e) => {
  console.error(`Connection error: ${e.message}`);
  console.error('\nAI Microservice appears to be unreachable:');
  console.error('1. Make sure the service is running on port 5000');
  console.error('2. Check for any firewall or network issues');
  console.error('3. Verify the service is listening on localhost:5000');
  
  // Try alternative connection methods
  console.log('\nAttempting to check port 5000 using low-level socket...');
  
  import('net').then(net => {
    const client = new net.Socket();
    
    client.connect(5000, 'localhost', () => {
      console.log('Socket connection successful - port is open!');
      client.destroy();
    });
    
    client.on('error', (err) => {
      console.error(`Socket connection failed: ${err.message}`);
      console.error('Port 5000 is not accessible or no service is listening');
    });
  });
});

req.end();

// Additional check to verify if the proxy is working correctly
console.log('\nChecking AI service proxy connectivity (port 3000)...');

const proxyOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/ai-service/api/status',
  method: 'GET'
};

const proxyReq = http.request(proxyOptions, (res) => {
  console.log(`Proxy status code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Proxy response body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      console.log('\nProxy connection successful! AI Microservice is accessible through the proxy.');
    } catch (e) {
      console.log(data);
      console.log('\nWarning: Proxy response is not valid JSON.');
    }
  });
});

proxyReq.on('error', (e) => {
  console.error(`Proxy connection error: ${e.message}`);
  console.error('\nAI Microservice proxy appears to be misconfigured:');
  console.error('1. Make sure the Express server is running on port 3000');
  console.error('2. Verify the AI proxy middleware is properly registered');
  console.error('3. Check that the /ai-service path is being handled correctly');
});

proxyReq.end();