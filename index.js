const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();

// Allow requests from any origin
app.use(cors());

// GET endpoint to fetch images from a provided URL
app.get('/api/images', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  // Validate the URL format
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }

  try {
    // Launch Puppeteer (with minimal options)
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set a realistic User-Agent to help bypass basic bot protection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    // Navigate to the provided URL and wait until the network is idle
    await page.goto(url, { waitUntil: 'networkidle0' });
    const html = await page.content();

    // Close the browser to free resources
    await browser.close();

    // Load the HTML into Cheerio for parsing
    const $ = cheerio.load(html);
    const images = [];

    // Extract the src attribute from each <img> tag and convert relative URLs to absolute
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

    // Return the scraped image URLs as JSON
    res.json({ images });
  } catch (error) {
    console.error('Error fetching the URL:', error.message);
    res.status(500).json({ error: 'Error fetching images' });
  }
});

// Start the server on port 3000
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
