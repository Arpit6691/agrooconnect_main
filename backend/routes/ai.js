const express = require('express');
const { getRecommendation, getMarketDemand } = require('../controllers/aiController');

const router = express.Router();

router.post('/recommend', getRecommendation);
router.post('/demand', getMarketDemand);

module.exports = router;
