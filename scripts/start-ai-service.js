/**
 * Start AI Service script
 * This script starts the minimal Flask API for the AI service
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configure paths
const rootDir = path.resolve(__dirname, '..');
const aiServiceDir = path.join(rootDir, 'ai_service');
const logFile = path.join(rootDir, 'ai_service_log.txt');

// Configure service options
const serviceFile = 'minimal_flask.py';
const servicePath = path.join(aiServiceDir, serviceFile);

console.log(`Starting AI service from: ${servicePath}`);

// Check if file exists
if (!fs.existsSync(servicePath)) {
  console.error(`Error: Service file not found at ${servicePath}`);
  process.exit(1);
}

// Spawn Python process
const pythonProcess = spawn('python3', [servicePath], {
  cwd: aiServiceDir,
  env: {
    ...process.env,
    PORT: '5000', // Explicitly set the port
    PYTHONUNBUFFERED: '1' // Ensure output is not buffered
  }
});

// Create log file stream
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const timestamp = new Date().toISOString();
logStream.write(`\n\n${timestamp} - AI Service starting\n`);

// Handle stdout
pythonProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[AI Service] ${output.trim()}`);
  logStream.write(output);
});

// Handle stderr
pythonProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.error(`[AI Service Error] ${output.trim()}`);
  logStream.write(`ERROR: ${output}`);
});

// Handle process exit
pythonProcess.on('close', (code) => {
  const exitTimestamp = new Date().toISOString();
  const exitMessage = `\n${exitTimestamp} - AI Service exited with code ${code}\n`;
  console.log(exitMessage);
  logStream.write(exitMessage);
  logStream.end();
  
  // Exit with the same code as the Python process
  process.exit(code);
});

// Log process ID
console.log(`AI microservice starting with PID: ${pythonProcess.pid}`);