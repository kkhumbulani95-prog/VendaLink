// netlify/functions/api.js
const serverless = require('serverless-http');
const app = require('../../server.js'); // Export your express 'app' from server.js

module.exports.handler = serverless(app);