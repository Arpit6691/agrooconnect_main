const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Join room
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`Client ${socket.id} joined room ${roomId}`);
    });

    // Handle typing
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('typing', data);
    });

    // Handle messages
    socket.on('sendMessage', async (data) => {
      try {
        // Save message to DB
        const message = await Message.create({
          conversationId: data.roomId,
          sender: data.senderId,
          text: data.text
        });

        await Conversation.findByIdAndUpdate(data.roomId, {
          lastMessage: message._id,
          updatedAt: Date.now()
        });

        // Broadcast to room
        io.to(data.roomId).emit('message', message);
      } catch (err) {
        console.error('Message send error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
