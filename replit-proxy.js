/**
 * Replit Web Proxy for PuntaIQ
 * This script creates a simple proxy server to make the PuntaIQ application accessible
 * in the Replit environment, ensuring it listens on all expected ports.
 */

import http from 'http';
import httpProxy from 'http-proxy';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const { createProxyServer } = httpProxy;

// Configuration
const PORT = process.env.PORT || 5000; // Port the workflow is expecting
const TARGET_PORT = 5000; // Port where the actual application runs
const TARGET_HOST = 'localhost';

// Set up logging to file to help debug any issues
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, 'proxy-server.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logMessage);
}

log('Starting PuntaIQ Replit Bridge...');
log(`Proxy will run on port ${PORT} and forward to port ${TARGET_PORT}`);

// Start the main Node.js server
const appProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development', PORT: TARGET_PORT }
});

// Set up error handling
appProcess.on('error', (error) => {
  log(`Failed to start application: ${error.message}`);
  process.exit(1);
});

// Handle clean termination
process.on('SIGINT', () => {
  log('Shutting down...');
  appProcess.kill('SIGINT');
  process.exit(0);
});

// Create the proxy server
const proxy = createProxyServer({
  target: `http://${TARGET_HOST}:${TARGET_PORT}`,
  ws: true,
  // Change the origin to avoid CORS issues
  changeOrigin: true
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  
  // Send error response
  if (res.writeHead && !res.headersSent) {
    res.writeHead(502);
    res.end('Proxy Error: The application server is not responding.');
  }
});

// Create HTTP server that listens on PORT
const server = http.createServer((req, res) => {
  // Log request for debugging
  console.log(`Proxy received request: ${req.method} ${req.url}`);
  
  // Forward the request to the target server
  proxy.web(req, res);
});

// Handle WebSocket connections
server.on('upgrade', (req, socket, head) => {
  console.log('WebSocket connection proxied');
  proxy.ws(req, socket, head);
});

// Start the proxy server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`PuntaIQ Proxy Server running on http://0.0.0.0:${PORT}`);
  console.log(`Forwarding requests to http://${TARGET_HOST}:${TARGET_PORT}`);
});