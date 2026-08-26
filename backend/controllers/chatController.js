const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// @desc    Get all conversations for user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate('participants', 'name role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Start a new conversation or get existing
// @route   POST /api/chat/conversations
// @access  Private
exports.startConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    
    if (!receiverId) {
      return res.status(400).json({ success: false, error: 'Receiver ID is required' });
    }

    // Check if exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, receiverId] }
    })
      .populate('participants', 'name role email phone avatar')
      .populate('lastMessage');

    if (!conversation) {
      const newConv = await Conversation.create({
        participants: [req.user.id, receiverId]
      });
      conversation = await Conversation.findById(newConv._id)
        .populate('participants', 'name role email phone avatar')
        .populate('lastMessage');
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

