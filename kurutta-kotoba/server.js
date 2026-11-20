const express = require('express');
const cors = require('cors');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Explicitly serve index.html at root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Support hosting under subpath /kurutta-kotoba/
app.get('/kurutta-kotoba/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Jisho API Proxy Endpoint
app.get('/api/jisho', (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword parameter' });
  }

  const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(keyword)}`;
  console.log(`[Proxy] Fetching from Jisho: ${keyword}`);

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const request = https.get(jishoUrl, options, (response) => {
    let rawData = '';

    response.on('data', (chunk) => { rawData += chunk; });

    response.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData);
        res.json(parsedData);
      } catch (e) {
        console.error('[Proxy] JSON parse error:', e.message);
        res.status(500).json({ error: 'Invalid response from Jisho' });
      }
    });
  });

  request.on('error', (err) => {
    console.error('[Proxy] Request error:', err.message);
    res.status(500).json({ error: 'Failed to connect to Jisho', details: err.message });
  });

  request.setTimeout(10000, () => {
    request.destroy();
    res.status(504).json({ error: 'Jisho request timed out' });
  });
});

app.listen(PORT, () => {
  console.log(`Kurutta Kotoba running at http://localhost:${PORT}`);
});