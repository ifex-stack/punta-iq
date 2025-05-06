/**
 * Script to start the AI microservice
 * Enhanced with better error handling and dependency checking
 */
import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust for the script being run from the scripts directory
const ROOT_DIR = path.resolve(path.join(__dirname, '..'));
const AI_SERVICE_DIR = path.join(ROOT_DIR, 'ai_service');
const API_SERVICE_PATH = path.join(AI_SERVICE_DIR, 'api_service.py');
const LOG_PATH = path.join(ROOT_DIR, 'ai_service_log.txt');

// Port that the AI microservice runs on
const AI_SERVICE_PORT = process.env.AI_SERVICE_PORT || 5000;

/**
 * Check if the Python executable exists
 */
function checkPythonInstallation() {
  return new Promise((resolve, reject) => {
    exec('python --version', (error, stdout, stderr) => {
      if (error) {
        console.error(`Python is not installed or not in PATH: ${error.message}`);
        reject(error);
        return;
      }
      
      const version = stdout.trim() || stderr.trim();
      console.log(`Found Python: ${version}`);
      resolve(version);
    });
  });
}

/**
 * Check if the AI service is already running
 */
function checkServiceRunning() {
  return new Promise((resolve) => {
    const request = http.get(`http://localhost:${AI_SERVICE_PORT}/api/status`, (response) => {
      if (response.statusCode === 200) {
        console.log('AI microservice is already running');
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    request.on('error', () => {
      // Error means service is not running
      resolve(false);
    });
    
    // Set a short timeout
    request.setTimeout(2000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

/**
 * Install Python dependencies
 */
function installPythonDependencies() {
  return new Promise((resolve, reject) => {
    console.log('Installing Python dependencies...');
    
    // Use the local requirements file
    let requirementsPath = path.join(AI_SERVICE_DIR, 'requirements.txt');
    let tempRequirementsPath = '';
    
    // Fall back to temp requirements file if the local one doesn't exist
    if (!fs.existsSync(requirementsPath)) {
      console.log('No requirements.txt found in AI service directory, creating temporary requirements');
      // List of required packages with versions to ensure compatibility
      const requiredPackages = [
        'flask==2.2.3',
        'Werkzeug==2.2.3',
        'requests==2.31.0',
        'python-dotenv==1.0.0'
      ];
      
      // Create a temporary requirements file
      tempRequirementsPath = path.join(os.tmpdir(), 'puntaiq_requirements.txt');
      fs.writeFileSync(tempRequirementsPath, requiredPackages.join('\n'));
      
      // Set requirementsPath to the temp file
      requirementsPath = tempRequirementsPath;
    }
    
    // Install dependencies with pip
    const installCmd = `pip install -r ${requirementsPath}`;
    
    exec(installCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing dependencies: ${error.message}`);
        console.error(stderr);
        reject(error);
        return;
      }
      
      console.log('Python dependencies installed successfully');
      console.log(stdout);
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempRequirementsPath);
      } catch (err) {
        console.warn(`Failed to delete temporary requirements file: ${err.message}`);
      }
      
      resolve();
    });
  });
}

/**
 * Check if a port is in use
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
      server.close();
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

/**
 * Find an available port starting from the base port
 */
async function findAvailablePort(basePort) {
  let port = basePort;
  // Try up to 10 ports
  for (let i = 0; i < 10; i++) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    port++;
  }
  throw new Error(`Could not find an available port starting from ${basePort}`);
}

/**
 * Start the AI microservice with proper logging
 */
function startMicroservice() {
  return new Promise(async (resolve, reject) => {
    console.log('Starting AI microservice...');
    
    // Check if the service file exists
    if (!fs.existsSync(API_SERVICE_PATH)) {
      console.error(`API service file not found at: ${API_SERVICE_PATH}`);
      reject(new Error(`API service file not found at: ${API_SERVICE_PATH}`));
      return;
    }
    
    // Find an available port
    let servicePort;
    try {
      servicePort = await findAvailablePort(AI_SERVICE_PORT);
      if (servicePort !== AI_SERVICE_PORT) {
        console.log(`Port ${AI_SERVICE_PORT} is in use. Using port ${servicePort} instead.`);
      }
    } catch (error) {
      console.error(`Error finding available port: ${error.message}`);
      reject(error);
      return;
    }
    
    // Create log file stream
    const logStream = fs.createWriteStream(LOG_PATH, { flags: 'a' });
    logStream.write(`\n--- Starting AI Microservice at ${new Date().toISOString()} on port ${servicePort} ---\n`);
    
    // Start the Python process with output logging
    const pythonProcess = spawn('python', [API_SERVICE_PATH], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: AI_SERVICE_DIR,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1', // Ensure Python output is not buffered
        AI_SERVICE_PORT: servicePort.toString(), // Pass the port to the Python process
      }
    });
    
    // Log process output
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      logStream.write(`[STDOUT] ${output}`);
      console.log(`[AI Service] ${output.trim()}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      logStream.write(`[STDERR] ${output}`);
      console.error(`[AI Service Error] ${output.trim()}`);
    });
    
    // Handle process exit
    pythonProcess.on('exit', (code, signal) => {
      const message = `AI Service exited with code ${code} and signal ${signal}`;
      logStream.write(`[EXIT] ${message}\n`);
      console.log(message);
      
      if (code !== 0) {
        reject(new Error(`AI Service failed to start properly: exit code ${code}`));
      }
    });
    
    // Check if the service is running after a short delay
    setTimeout(async () => {
      try {
        const isRunning = await checkServiceRunning();
        if (isRunning) {
          console.log('AI microservice successfully started and responding');
          resolve(true);
        } else {
          reject(new Error('AI microservice started but is not responding to HTTP requests'));
        }
      } catch (error) {
        reject(new Error(`Failed to verify microservice status: ${error.message}`));
      }
    }, 3000);
    
    // Unref the process so the parent can exit independently
    pythonProcess.unref();
    
    console.log(`AI microservice starting with PID: ${pythonProcess.pid}`);
  });
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('==== PuntaIQ AI Microservice Starter ====');
    
    // Check if service is already running
    const isRunning = await checkServiceRunning();
    if (isRunning) {
      console.log('AI microservice is already running, no action needed');
      return;
    }
    
    // Check Python installation
    await checkPythonInstallation();
    
    // Install dependencies
    await installPythonDependencies();
    
    // Start the microservice
    await startMicroservice();
    
    console.log('==== AI Microservice startup complete ====');
  } catch (error) {
    console.error('Failed to start AI microservice:', error.message);
    
    // Write to log file
    try {
      fs.appendFileSync(LOG_PATH, `\n--- ERROR starting AI Microservice at ${new Date().toISOString()} ---\n${error.stack || error.message}\n`);
    } catch (logError) {
      console.error('Additionally, failed to write to log file:', logError.message);
    }
    
    process.exit(1);
  }
}

// Execute main function
main();