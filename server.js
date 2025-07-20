const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json()); // Crucial for parsing JSON request bodies

// 🔒 Optional: Whitelist of allowed base URLs
const ALLOWED_DOMAINS = [
  'https://getpantry.cloud'
];

function isAllowedUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_DOMAINS.some(domain => parsedUrl.origin === domain);
  } catch {
    return false;
  }
}

app.post('/proxy', async (req, res) => {
  const targetUrl = req.body.url;

  console.log('Received proxy request for URL:', targetUrl); // Log incoming URL

  if (!targetUrl) {
    return res.status(400).json({ error: 'URL is missing in the request body.' });
  }

  if (!isAllowedUrl(targetUrl)) {
    return res.status(403).json({ error: 'Disallowed URL. Only specific domains are permitted.' }); // Changed to 403 Forbidden
  }

  // --- Timeout implementation for fetch (optional, but good for robustness) ---
  const controller = new AbortController();
  const timeout = 10000; // 10 seconds timeout
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timeoutId); // Clear timeout if fetch succeeds

    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType || 'application/json');
    const data = await response.text();
    res.send(data);
    console.log(`Successfully proxied: ${targetUrl}`);

  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared on error too

    if (error.name === 'AbortError') {
      console.error(`Proxy request timed out for URL: ${targetUrl}`);
      res.status(504).json({ error: `Proxy request timed out for URL: ${targetUrl}` }); // Gateway Timeout
    } else {
      console.error(`Failed to fetch the resource for URL: ${targetUrl}. Error: ${error.message}`);
      res.status(500).json({ error: `Failed to fetch the resource for URL: ${targetUrl}. Please check the URL and try again. Error details: ${error.message}` });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});