const express = require('express');
const path = require('path');

const app = express();
const port = 3001;

// Serve the test routing HTML file
app.get('/test-routing', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-routing.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Test routing page available at http://localhost:${port}/test-routing`);
  console.log(`If using Replit, access it at https://[YOUR-REPL-NAME].replit.dev/test-routing`);
});