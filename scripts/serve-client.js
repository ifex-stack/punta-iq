const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

// Serve the frontend application
app.get('*', (req, res) => {
  // Try to find index.html in client directory
  const indexPath = path.join(__dirname, '..', 'client', 'index.html');
  
  try {
    if (fs.existsSync(indexPath)) {
      console.log(`Serving ${indexPath} for route: ${req.path}`);
      
      // Read the content and add meta tags for route recovery
      const content = fs.readFileSync(indexPath, 'utf8');
      const modifiedContent = content.replace(
        '</head>',
        `<meta name="route-recovery" content="true" data-original-url="${req.path}" />
        <meta name="puntaiq-app-route" content="${req.path}" />
        <script>
          // Configure endpoints
          window.PuntaIQ = window.PuntaIQ || {};
          window.PuntaIQ.apiBaseUrl = "${req.protocol}://${req.headers.host.replace('3001', '3000')}";
          window.PuntaIQ.aiServiceProxyUrl = "${req.protocol}://${req.headers.host.replace('3001', '3000')}/ai-service";
          
          // Store original path for recovery
          if (window.sessionStorage) {
            sessionStorage.setItem('puntaiq_recovery_path', "${req.path}");
          }
        </script>
        </head>`
      );
      
      return res.send(modifiedContent);
    } 
    else {
      console.log(`Index.html not found at ${indexPath}`);
      // Fallback to sending a minimal HTML page
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PuntaIQ</title>
          <style>
            body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #4f46e5; }
            .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>PuntaIQ Development Server</h1>
            <p>This is a secondary development server running on port 3001.</p>
            <p>The main server is running on port 3000.</p>
            <p><a href="http://${req.headers.host.replace('3001', '3000')}">Go to main application</a></p>
          </div>
        </body>
        </html>
      `);
    }
  } 
  catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Client development server running at http://localhost:${PORT}`);
});