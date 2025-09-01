// ==================================================================
// MINIMAL TEST SERVER
// This server has zero dependencies beyond Express to rule out
// any issues with our application code or dependencies.
// ==================================================================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[TEST SERVER] INCOMING: ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('[TEST SERVER] Responding to /api/health');
  res.status(200).send('HEALTH CHECK OK');
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('[TEST SERVER] Responding to /');
  res.status(200).send('Minimal Test Server is running!');
});

// 404 handler
app.use((req, res) => {
  console.log(`[TEST SERVER] 404 for ${req.method} ${req.path}`);
  res.status(404).send('Not Found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[TEST SERVER] ✅ Minimal server listening on http://0.0.0.0:${PORT}`);
});
