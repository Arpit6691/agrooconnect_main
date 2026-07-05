const express = require('express');
const { getConversations, getMessages, startConversation } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/conversations')
  .get(protect, getConversations)
  .post(protect, startConversation);

router.route('/messages/:conversationId')
  .get(protect, getMessages);

module.exports = router;
