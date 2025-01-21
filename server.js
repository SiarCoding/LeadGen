const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Create a custom axios instance with default config
const axiosInstance = axios.create({
  timeout: 15000,
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true
  })
});

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to scrape website
async function scrapeWebsite(url) {
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  let response = null;
  let error = null;

  // Try up to 3 times with different configurations
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Attempt ${attempt} to fetch ${url}`);
      
      const config = {
        headers: attempt === 1 ? defaultHeaders : {
          'User-Agent': defaultHeaders['User-Agent']
        },
        timeout: 15000,
        maxRedirects: 5
      };

      response = await axiosInstance.get(url, config);
      
      if (response.status === 200) {
        break;
      }
      
      // If we get here, status is not 200 but also not an error
      // Wait before next attempt
      await delay(1000 * attempt);
      
    } catch (err) {
      error = err;
      console.log(`Attempt ${attempt} failed:`, err.message);
      await delay(1000 * attempt);
    }
  }

  if (!response && error) {
    throw error;
  }

  if (!response || response.status !== 200) {
    throw new Error(`Failed to fetch page: ${response ? response.status : 'No response'}`);
  }

  try {
    const $ = cheerio.load(response.data);
    
    // Enhanced phone extraction with international format support
    const phoneRegex = /(?:\+|00)[1-9][0-9 .-]{8,}|[0-9][0-9 .-]{6,}/g;
    let phone = '';
    
    // Try multiple methods to find phone
    const phoneText = $('body').text();
    const phoneMatches = phoneText.match(phoneRegex) || [];
    phone = phoneMatches[0] || '';
    
    if (!phone) {
      $('a[href^="tel:"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const cleaned = href.replace('tel:', '').trim();
          if (phoneRegex.test(cleaned)) {
            phone = cleaned;
            return false;
          }
        }
      });
    }

    // Enhanced email extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    let email = '';
    
    // Try multiple methods to find email
    const emailText = $('body').text();
    const emailMatches = emailText.match(emailRegex) || [];
    email = emailMatches[0] || '';
    
    if (!email) {
      $('a[href^="mailto:"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const cleaned = href.replace('mailto:', '').trim();
          if (emailRegex.test(cleaned)) {
            email = cleaned;
            return false;
          }
        }
      });
    }

    // Enhanced owner extraction
    const ownerKeywords = ['Inhaber', 'Geschäftsführer', 'Betreiber', 'CEO', 'Owner', 'Founder'];
    let owner = '';
    
    // Try to find owner information
    $('*').each((i, el) => {
      const text = $(el).text().trim();
      for (const keyword of ownerKeywords) {
        if (text.includes(keyword)) {
          const parts = text.split(keyword);
          if (parts[1]) {
            owner = parts[1].split('\n')[0].trim();
            owner = owner.replace(/^[:|\s]+/, '').trim();
            if (owner) return false;
          }
        }
      }
    });

    // Clean and format the data
    phone = phone.replace(/\s+/g, ' ').trim();
    email = email.toLowerCase().trim();
    owner = owner.replace(/\s+/g, ' ').trim();

    return { phone, email, owner };
  } catch (error) {
    console.error('Error parsing website content:', error);
    return { phone: '', email: '', owner: '' };
  }
}

// Scraping endpoint
app.get('/api/scrape', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const data = await scrapeWebsite(url);
      console.log('Scraped data for', url, ':', data);
      res.json(data);
    } catch (error) {
      console.error('Error scraping website:', error);
      // Send a more detailed error response
      res.status(500).json({
        error: 'Failed to scrape website',
        details: error.message,
        url: url
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({
      error: 'Unexpected error occurred',
      details: error.message
    });
  }
});

// SerpApi configuration
const SERP_API_KEY = process.env.SERP_API_KEY;
const SERP_API_BASE = 'https://serpapi.com/search.json';

// Google Maps search endpoint
app.get('/api/search/google', async (req, res) => {
  try {
    const { query, numResults } = req.query;
    
    const params = {
      engine: 'google_maps',
      q: query,
      api_key: SERP_API_KEY,
      type: 'search',
      ll: '@52.520008,13.404954,15z',  // Berlin coordinates
      num: numResults || 10
    };

    const response = await axios.get(SERP_API_BASE, { params });
    
    if (!response.data || !response.data.local_results) {
      return res.json({ local_results: [] });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error in Google Maps search:', error);
    res.status(500).json({ error: 'Failed to search Google Maps' });
  }
});

// Instagram search endpoint
app.get('/api/search/instagram', async (req, res) => {
  try {
    const { query, numResults } = req.query;
    
    // Request more results to account for filtering
    const requestedResults = Math.min(parseInt(numResults) * 3, 100);
    
    const params = {
      engine: 'google',
      q: `site:instagram.com ${query}`,
      api_key: SERP_API_KEY,
      num: requestedResults,
      gl: 'de',  // German results
      hl: 'de'   // German language
    };

    const response = await axios.get(SERP_API_BASE, { params });
    
    if (!response.data || !response.data.organic_results) {
      return res.json({ instagram_profiles: [] });
    }

    // Filter and process Instagram results
    const instagramProfiles = response.data.organic_results
      .filter(result => {
        const url = result.link || '';
        // Only include profile URLs, not posts or tags
        return url.includes('instagram.com/') && 
               !url.includes('/p/') && 
               !url.includes('/explore/') &&
               !url.includes('/tags/') &&
               !url.includes('/reels/') &&
               !url.includes('/stories/');
      })
      .map(result => {
        const username = result.link.split('instagram.com/')[1]?.split('/')[0] || '';
        const title = result.title?.split(' • ')[0] || username;
        
        // Clean up the snippet
        let biography = '';
        if (result.snippet) {
          biography = result.snippet
            .replace(/^[^a-zA-Z]+/, '')  // Remove leading non-letter characters
            .replace(/\s+/g, ' ')        // Normalize whitespace
            .trim();
        }

        return {
          username,
          name: title,
          biography,
          profileUrl: result.link,
          thumbnail: result.thumbnail || null
        };
      })
      .filter(profile => 
        // Additional filtering to ensure valid profiles
        profile.username && 
        profile.username.length > 1 && 
        !profile.username.includes('?') &&
        !profile.username.includes('#') &&
        profile.username !== 'p' &&
        profile.username !== 'explore'
      )
      .slice(0, numResults);  // Only return requested number of results

    res.json({ instagram_profiles: instagramProfiles });
  } catch (error) {
    console.error('Error in Instagram search:', error);
    res.status(500).json({ error: 'Failed to search Instagram' });
  }
});

// Proxy endpoint for LinkedIn search
app.get('/api/search/linkedin', async (req, res) => {
  try {
    const { q, count } = req.query;
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q: `site:linkedin.com/company ${q} business`,
        api_key: process.env.REACT_APP_SERP_API_KEY,
        num: count
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
