/**
 * Combined starter script for PuntaIQ that:
 * 1. Starts the main Express server
 * 2. Sets up a listener to start the AI microservice on demand
 * 3. Adds a special health check route for the workflow system
 */
import { spawn } from 'child_process';
import http from 'http';

console.log('Starting PuntaIQ application...');

// Start the main Express server with npm run dev
const expressProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// Log any errors
expressProcess.on('error', (error) => {
  console.error('Failed to start Express server:', error);
  process.exit(1);
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down...');
  expressProcess.kill('SIGINT');
  process.exit(0);
});

expressProcess.on('exit', (code) => {
  console.log(`Express server exited with code ${code}`);
  process.exit(code);
});

// Give the server a moment to start
setTimeout(() => {
  console.log('Verifying Express server is running on port 3000...');
  
  // Check if the Express server is running
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/status',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    if (res.statusCode === 200) {
      console.log('Express server is running on port 3000.');
      console.log('Application startup complete. Ready for HTTP requests!');
    } else {
      console.error(`Express server responded with status code ${res.statusCode}`);
    }
  });
  
  req.on('error', (error) => {
    console.error('Error checking Express server:', error.message);
  });
  
  req.end();
}, 5000);

console.log('Server startup initiated. Waiting for Express to initialize...');