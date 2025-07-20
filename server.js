const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
app.use(cors());

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

  if (!targetUrl || !isAllowedUrl(targetUrl)) {
    return res.status(400).json({ error: 'Invalid or disallowed URL' });
  }

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get('content-type');
    res.setHeader('Content-Type', contentType || 'application/json');
    const data = await response.text();
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch the resource\nURL:${targetUrl}` });
  }
});

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
