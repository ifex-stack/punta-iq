/**
 * Combined startup script for both main server and AI microservice
 * This script ensures both services start together
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting PuntaIQ Full Stack (Node.js + Python microservice)...');

// Start the AI microservice first
console.log('Starting AI microservice...');
const pythonScript = path.resolve(process.cwd(), 'ai_service', 'api_service.py');

if (!fs.existsSync(pythonScript)) {
  console.error(`Error: AI service script not found at ${pythonScript}`);
  process.exit(1);
}

const aiProcess = spawn('python', [pythonScript], {
  cwd: path.resolve(process.cwd(), 'ai_service'),
  env: {
    ...process.env,
    PYTHONUNBUFFERED: '1' // Force unbuffered output
  },
  stdio: 'inherit' // Show output in this console
});

aiProcess.on('error', (error) => {
  console.error(`Failed to start AI service: ${error.message}`);
});

// Give the AI service a moment to start
setTimeout(() => {
  // Now start the main server
  console.log('Starting main Node.js server...');
  
  const mainProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit', // Show output in this console
    env: {
      ...process.env,
      NODE_ENV: 'development'
    }
  });

  mainProcess.on('error', (error) => {
    console.error(`Failed to start main server: ${error.message}`);
    aiProcess.kill(); // Kill the AI service if main server fails
  });

  // Handle clean shutdown if the script is interrupted
  process.on('SIGINT', () => {
    console.log('Shutting down all services...');
    mainProcess.kill();
    aiProcess.kill();
    process.exit(0);
  });

}, 2000); // Wait 2 seconds before starting main server