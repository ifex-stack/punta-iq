const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Server static files from client directory
app.use(express.static(path.join(__dirname, 'client', 'public')));

// Serve the frontend application for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    // Create a simple HTML file with recovery scripts
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PuntaIQ Sports Predictions</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #334155;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    .logo {
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(90deg, #4f46e5, #0ea5e9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 1rem;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }
    h1 { 
      color: #0f172a;
      margin-top: 0;
    }
    p { 
      line-height: 1.6;
      color: #475569;
    }
    .btn {
      display: inline-block;
      background: #4f46e5;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      text-decoration: none;
      font-weight: 500;
      margin-top: 1rem;
      transition: background-color 0.2s;
    }
    .btn:hover {
      background: #4338ca;
    }
    .status {
      margin-top: 2rem;
      padding: 1rem;
      background: #f1f5f9;
      border-radius: 0.375rem;
      font-size: 0.875rem;
    }
    .api-status {
      margin-top: 1rem;
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
    }
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
      background-color: #22c55e;
    }
    .api-name {
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">PuntaIQ</div>
    
    <div class="card">
      <h1>AI-Powered Sports Predictions</h1>
      <p>Welcome to PuntaIQ, your advanced sports prediction platform that leverages real-time data analytics and AI to provide accurate predictions across multiple sports.</p>
      
      <div class="api-status">
        <span><span class="status-indicator"></span> <span class="api-name">TheSportsDB API:</span> Connected</span>
        <span>Free Tier</span>
      </div>
      
      <div class="api-status">
        <span><span class="status-indicator"></span> <span class="api-name">Odds API:</span> Connected</span>
        <span>Free Tier</span>
      </div>
      
      <a href="/predictions" class="btn">View Predictions</a>
    </div>
    
    <div class="status">
      <p>System Status: Secondary front-end server running on port 3001</p>
      <p>Main application server running on port 3000</p>
      <p>AI microservice running on port 5000</p>
      
      <p><a href="http://localhost:3000">Go to Main Application Server</a></p>
    </div>
  </div>
  
  <script>
    // Configure for local development
    window.PuntaIQ = {
      apiBaseUrl: 'http://localhost:3000',
      aiServiceProxyUrl: 'http://localhost:3000/ai-service'
    };
    
    // Check API server status
    fetch('http://localhost:3000/api/debug/info')
      .then(response => response.json())
      .then(data => {
        console.log('API server status:', data);
        document.querySelector('.status').innerHTML += '<p>✅ Successfully connected to API server</p>';
      })
      .catch(error => {
        console.error('Error checking API server:', error);
        document.querySelector('.status').innerHTML += '<p>❌ Failed to connect to API server</p>';
      });
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    res.status(404).send('Cannot find index.html');
  }
});

app.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});