import express from 'express';
import Coingecko from '@coingecko/coingecko-typescript';

const router = express.Router();

// Initialize CoinGecko client
const client = new Coingecko({
  environment: 'demo', // Use demo environment for free tier
});

// Get market data
router.get('/cryptos', async (req, res) => {
  try {
    const { vs_currency = 'usd', order = 'market_cap_desc', per_page = 50, page = 1, sparkline = false } = req.query;

    const response = await client.coins.markets.get({
      vs_currency,
      order,
      per_page: parseInt(per_page),
      page: parseInt(page),
      sparkline: sparkline === 'true'
    });

    res.json(response.data);
  } catch (error) {
    console.error('Crypto API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch crypto data' });
  }
});

// Get specific crypto details
router.get('/crypto/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { vs_currency = 'usd' } = req.query;

    const response = await client.coins.coin.get(id, {
      vs_currency
    });

    res.json(response.data);
  } catch (error) {
    console.error('Crypto details API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch crypto details' });
  }
});

// Get chart data
router.get('/chart/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { vs_currency = 'usd', days = 7 } = req.query;

    const response = await client.coins.coinId.marketChart.get(id, {
      vs_currency,
      days: parseInt(days)
    });

    res.json(response.data);
  } catch (error) {
    console.error('Chart API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get trending coins
router.get('/trending', async (req, res) => {
  try {
    const response = await client.search.trending.get();
    res.json(response.data);
  } catch (error) {
    console.error('Trending API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch trending coins' });
  }
});

// Get global market data
router.get('/global', async (req, res) => {
  try {
    const response = await client.global.get();
    res.json(response.data);
  } catch (error) {
    console.error('Global API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch global data' });
  }
});

// Get news (mock data for now)
router.get('/news', async (req, res) => {
  try {
    // For now, return mock news data since CoinGecko news API might require different setup
    const mockNews = [
      {
        title: "Bitcoin Surges Past $60,000 Mark",
        description: "Bitcoin has reached a new all-time high as institutional adoption increases.",
        url: "#",
        published_at: new Date().toISOString(),
        source: "Crypto News"
      },
      {
        title: "Ethereum 2.0 Upgrade Shows Promising Results",
        description: "The latest Ethereum upgrade has improved network efficiency significantly.",
        url: "#",
        published_at: new Date().toISOString(),
        source: "Blockchain Today"
      }
    ];

    res.json(mockNews);
  } catch (error) {
    console.error('News API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
