/**
 * Script to start the AI microservice
 */
import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_SERVICE_DIR = path.join(process.cwd(), 'ai_service');
const API_SERVICE_PATH = path.join(AI_SERVICE_DIR, 'api_service.py');

function checkPythonDependencies() {
  return new Promise((resolve, reject) => {
    console.log('Checking Python dependencies...');
    
    // List of required packages
    const requiredPackages = [
      'flask',
      'requests',
      'python-dotenv'
    ];
    
    // Create a temporary requirements file
    const tempRequirementsPath = path.join(os.tmpdir(), 'temp_requirements.txt');
    fs.writeFileSync(tempRequirementsPath, requiredPackages.join('\n'));
    
    // Install dependencies
    const installCmd = `pip install -r ${tempRequirementsPath}`;
    
    exec(installCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing dependencies: ${error.message}`);
        console.error(stderr);
        reject(error);
        return;
      }
      
      console.log('Python dependencies installed successfully');
      
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

function startMicroservice() {
  console.log('Starting AI microservice...');
  
  // Check if the service file exists
  if (!fs.existsSync(API_SERVICE_PATH)) {
    console.error(`API service file not found at: ${API_SERVICE_PATH}`);
    process.exit(1);
  }
  
  // Start the Python process
  const pythonProcess = spawn('python', [API_SERVICE_PATH], {
    detached: true,
    stdio: 'ignore',
    cwd: AI_SERVICE_DIR
  });
  
  // Unref the process so the parent can exit independently
  pythonProcess.unref();
  
  console.log(`AI microservice started with PID: ${pythonProcess.pid}`);
}

// Main execution
async function main() {
  try {
    await checkPythonDependencies();
    startMicroservice();
  } catch (error) {
    console.error('Failed to start AI microservice:', error);
    process.exit(1);
  }
}

main();