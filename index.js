const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

// Allow requests from any origin
app.use(cors());

app.get('/api/images', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }

  try {
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set a realistic User-Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    );

    // Navigate to the URL and wait until network is idle
    await page.goto(url, { waitUntil: 'networkidle0' });
    const html = await page.content();
    await browser.close();

    // Load HTML into Cheerio for parsing
    const $ = cheerio.load(html);
    const images = [];

    // Extract all image URLs and convert relative paths to absolute URLs
    $('img').each((i, element) => {
      let src = $(element).attr('src');
      if (src) {
        try {
          src = new URL(src, url).href;
          images.push(src);
        } catch (error) {
          console.error(`Error processing src "${src}":`, error);
        }
      }
    });

    // Respond directly with the array of image URLs
    res.json(images);
  } catch (error) {
    console.error('Error fetching the URL:', error.message);
    res.status(500).json({ error: 'Error fetching images' });
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
