/**
 * Utility script to start the AI microservice
 * Usage: node scripts/start-ai-service.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('[AI Service] Starting microservice...');

// Determine the Python executable to use
const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';

// Determine the path to the API service script
const apiServicePath = path.join(process.cwd(), 'ai_service', 'api_service.py');

// Check if the service script exists
if (!fs.existsSync(apiServicePath)) {
  console.error(`[AI Service] Error: Service script not found at ${apiServicePath}`);
  process.exit(1);
}

// Install required dependencies if they don't exist
console.log('[AI Service] Checking and installing dependencies...');

// Create a function to install dependencies
function installDependencies() {
  return new Promise((resolve, reject) => {
    const pip = spawn(pythonExecutable, ['-m', 'pip', 'install', 'flask', 'requests', 'python-dotenv']);
    
    pip.stdout.on('data', (data) => {
      console.log(`[AI Service] pip: ${data.toString().trim()}`);
    });
    
    pip.stderr.on('data', (data) => {
      console.error(`[AI Service] pip error: ${data.toString().trim()}`);
    });
    
    pip.on('close', (code) => {
      if (code === 0) {
        console.log('[AI Service] Dependencies installed successfully');
        resolve();
      } else {
        console.error(`[AI Service] Failed to install dependencies with code ${code}`);
        reject(new Error(`Failed to install dependencies with code ${code}`));
      }
    });
  });
}

// Start the AI service
async function startService() {
  try {
    // Install dependencies
    await installDependencies();
    
    console.log(`[AI Service] Starting Flask service from ${apiServicePath}`);
    
    // Start the Flask application
    const flask = spawn(pythonExecutable, [apiServicePath]);
    
    // Handle process output
    flask.stdout.on('data', (data) => {
      console.log(`[AI Service] ${data.toString().trim()}`);
    });
    
    flask.stderr.on('data', (data) => {
      console.error(`[AI Service] Error: ${data.toString().trim()}`);
    });
    
    flask.on('close', (code) => {
      console.log(`[AI Service] Process exited with code ${code}`);
    });
    
    // Log PID for monitoring
    console.log(`[AI Service] Started with PID: ${flask.pid}`);
    
    // We won't wait for the process to complete, it will continue running in the background
    
  } catch (error) {
    console.error(`[AI Service] Failed to start service: ${error.message}`);
    process.exit(1);
  }
}

// Start the service
startService();