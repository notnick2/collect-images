const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();


// Enable JSON parsing for incoming requests
app.use(express.json());

// Configure CORS
app.use(cors());


// GET endpoint to fetch images from a given URL
app.get('/api/images', async (req, res) => {
  const { url } = req.query;

  // Validate that the URL parameter is provided
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  // Validate that the provided URL is in proper format
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }

  try {
    // Fetch the HTML of the provided URL with a timeout (10 seconds)
    const { data: html } = await axios.get(url, { timeout: 10000 });
    
    // Load the HTML into Cheerio for parsing
    const $ = cheerio.load(html);
    const images = [];

    // Extract image URLs from all <img> tags
    $('img').each((index, element) => {
      let src = $(element).attr('src');
      if (src) {
        try {
          // Convert relative URLs to absolute URLs
          src = new URL(src, url).href;
          images.push(src);
        } catch (error) {
          // If URL conversion fails, skip this src
          console.error(`Error converting URL for src: ${src}`, error);
        }
      }
    });

    // Respond with the collected image URLs
    res.json({ images });
  } catch (error) {
    console.error('Error fetching the URL:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching images.' });
  }
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
