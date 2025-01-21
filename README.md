# Lead Generator System

A React-based lead generation system that can scrape and collect leads from multiple sources including Google, Instagram, and LinkedIn.

## Features

- Search for leads by industry/business type
- Specify the number of leads to generate
- Multiple data sources:
  - Google Search (using Google Custom Search API with SerpAPI fallback)
  - Instagram Business Profiles
  - LinkedIn Company Pages
- Lead management with status tracking:
  - Scheduled (green)
  - Later (yellow)
  - Not Scheduled (removed and blacklisted)
- Automatic data extraction from websites
- Blacklist system for rejected leads

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API Keys:
   - Copy `.env.example` to `.env`
   - Add your API keys:
     - REACT_APP_SERP_API_KEY: Get from [SerpApi](https://serpapi.com)
     - REACT_APP_GOOGLE_API_KEY: Get from [Google Cloud Console](https://console.cloud.google.com)

3. Start the development server:
```bash
npm start
```

## Usage

1. Enter the industry or business type you want to search for
2. Specify the number of leads you want to generate
3. Select the source (Google, Instagram, or LinkedIn)
4. Click "Generate Leads" to start the search
5. Manage leads in the table:
   - Mark as "Scheduled" (green)
   - Mark as "Later" (yellow)
   - Mark as "Not Scheduled" to remove and blacklist

## Note

For Instagram and LinkedIn scraping, you'll need to set up proper API access and authentication. The current implementation includes placeholder API calls that need to be replaced with actual API integrations.
