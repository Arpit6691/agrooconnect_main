const express = require('express');
const { getAnalytics, getUsers, toggleUserBlock } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // Need to add an admin middleware in the future, for now protect

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.put('/users/:id/block', toggleUserBlock);

module.exports = router;
