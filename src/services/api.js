import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const SERP_API_KEY = process.env.REACT_APP_SERP_API_KEY;

const isBlacklisted = (lead) => {
  const blacklistedLeads = JSON.parse(localStorage.getItem('blacklistedLeads') || '[]');
  return blacklistedLeads.some(bl => bl.companyName === lead.companyName);
};

export const searchGoogle = async (query, numResults = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search/google`, {
      params: {
        query,
        numResults
      }
    });

    if (!response.data || !response.data.local_results) {
      console.error('No results found');
      return [];
    }

    const results = response.data.local_results.slice(0, numResults);

    const processedResults = await Promise.all(
      results.map(async (result) => {
        let websiteData = {};
        if (result.website) {
          try {
            websiteData = await scrapeWebsite(result.website);
          } catch (error) {
            console.error(`Error scraping website for ${result.title}:`, error);
          }
        }
        
        const companyName = result.title || websiteData.companyName || '';
        
        return {
          companyName: companyName,  
          name: companyName,         
          address: result.address || '',
          phone: result.phone || websiteData.phone || '',
          email: websiteData.email || '',
          website: result.website || '',
          rating: result.rating || '',
          reviews: result.reviews || '',
          owner: websiteData.owner || ''
        };
      })
    );

    return processedResults.filter(result => result !== null && result.companyName);
  } catch (error) {
    console.error('Error searching Google:', error.response?.data || error);
    return [];
  }
};

export const searchInstagram = async (query, numResults = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search/instagram`, {
      params: {
        query,
        numResults
      }
    });

    if (!response.data || !response.data.instagram_profiles) {
      console.log('No Instagram results found');
      return [];
    }

    return response.data.instagram_profiles
      .filter(profile => profile && profile.username)
      .map(profile => ({
        companyName: profile.username || '',
        name: profile.full_name || profile.username || '',
        website: profile.website || '',
        description: profile.biography || '',
        profileUrl: profile.profileUrl || '',
        thumbnail: profile.thumbnail || '',
        followers: profile.followers ? parseInt(profile.followers.replace(/[^0-9]/g, '')) || 0 : 0,
        cached_page_link: profile.cached_page_link || '',
        related_pages_link: profile.related_pages_link || ''
      }));
  } catch (error) {
    console.error('Error searching Instagram:', error.response?.data || error);
    return [];
  }
};

export const searchLinkedIn = async (industry, count) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search/linkedin`, {
      params: {
        q: industry,
        count
      }
    });

    if (!response.data || !response.data.organic_results) {
      throw new Error('No LinkedIn results found');
    }

    const results = response.data.organic_results
      .map(result => {
        const companyName = result.title.split('|')[0].trim();
        const lead = {
          companyName: companyName,
          socialLinks: {
            linkedin: result.link
          },
          website: '',
          status: ''
        };
        return !isBlacklisted(lead) ? lead : null;
      })
      .filter(result => result !== null)
      .slice(0, count);

    return results;
  } catch (error) {
    console.error('Error in LinkedIn search:', error);
    throw error;
  }
};

const scrapeWebsite = async (url) => {
  try {
    if (!url) return {};

    const response = await axios.get(`${API_BASE_URL}/scrape`, {
      params: { url },
      timeout: 30000
    });

    return response.data || {};
  } catch (error) {
    console.error('Error scraping website:', error);
    return {};
  }
};
