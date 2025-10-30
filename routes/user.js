import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get watchlist
router.get('/watchlist', authenticateToken, async (req, res) => {
  try {
    res.json({ data: req.user.watchlist });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to watchlist
router.post('/watchlist', authenticateToken, async (req, res) => {
  try {
    const { cryptoId } = req.body;

    if (!cryptoId) {
      return res.status(400).json({ error: 'Crypto ID is required' });
    }

    // Check if already in watchlist
    const exists = req.user.watchlist.some(item => item.cryptoId === cryptoId);
    if (exists) {
      return res.status(400).json({ error: 'Crypto already in watchlist' });
    }

    req.user.watchlist.push({ cryptoId, addedAt: new Date() });
    await req.user.save();

    res.json({ data: req.user.watchlist, message: 'Added to watchlist' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove from watchlist
router.delete('/watchlist/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    req.user.watchlist = req.user.watchlist.filter(item => item.cryptoId !== id);
    await req.user.save();

    res.json({ data: req.user.watchlist, message: 'Removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const portfolioWithPrices = await Promise.all(
      req.user.portfolio.map(async (holding) => {
        try {
          const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
            params: {
              ids: holding.cryptoId,
              vs_currencies: 'usd',
              x_cg_demo_api_key: process.env.COINGECKO_API_KEY
            }
          });

          const currentPrice = response.data[holding.cryptoId]?.usd || 0;
          const currentValue = holding.amount * currentPrice;

          return {
            ...holding.toObject(),
            currentPrice,
            currentValue,
            profitLoss: currentValue - (holding.amount * holding.purchasePrice || 0) // Assuming purchasePrice is added later
          };
        } catch (error) {
          return {
            ...holding.toObject(),
            currentPrice: 0,
            currentValue: 0,
            profitLoss: 0
          };
        }
      })
    );

    res.json({ data: portfolioWithPrices });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add to portfolio
router.post('/portfolio', authenticateToken, async (req, res) => {
  try {
    const { cryptoId, amount } = req.body;

    if (!cryptoId || !amount) {
      return res.status(400).json({ error: 'Crypto ID and amount are required' });
    }

    // Get current price for purchase price
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: {
        ids: cryptoId,
        vs_currencies: 'usd',
        x_cg_demo_api_key: process.env.COINGECKO_API_KEY
      }
    });

    const purchasePrice = response.data[cryptoId]?.usd || 0;

    req.user.portfolio.push({
      cryptoId,
      amount: parseFloat(amount),
      purchasePrice,
      addedAt: new Date()
    });

    await req.user.save();

    res.json({ data: req.user.portfolio, message: 'Added to portfolio' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove from portfolio
router.delete('/portfolio/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    req.user.portfolio = req.user.portfolio.filter(item => item.cryptoId !== id);
    await req.user.save();

    res.json({ data: req.user.portfolio, message: 'Removed from portfolio' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
