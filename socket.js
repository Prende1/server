// socket.js
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message'); // Adjust path

// Store active users
const activeUsers = new Map();

function socketSetup(server) {
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.username} connected with ID: ${socket.id}`);

    activeUsers.set(socket.userId, {
      socketId: socket.id,
      username: socket.username,
      isOnline: true
    });

    io.emit('users_online', Array.from(activeUsers.values()));

    socket.join(socket.userId);

    // Join chat room
    socket.on('join_chat', ({ recipientId }) => {
      const chatRoom = generateRoomId(socket.userId, recipientId);
      socket.join(chatRoom);
      console.log(`User ${socket.username} joined chat room: ${chatRoom}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, message, messageType = 'text' } = data;
        const chatRoom = generateRoomId(socket.userId, recipientId);

        const newMessage = {
          senderId: socket.userId,
          recipientId,
          message,
          messageType,
          timestamp: new Date(),
          chatRoom,
          isRead: false
        };

        const savedMessage = await Message.create(newMessage);
        await savedMessage.populate('senderId', 'username image');

        io.to(chatRoom).emit('receive_message', {
          _id: savedMessage._id,
          senderId: savedMessage.senderId,
          recipientId,
          message,
          messageType,
          timestamp: savedMessage.timestamp,
          isRead: false
        });

        const recipient = activeUsers.get(recipientId);
        if (recipient) {
          io.to(recipient.socketId).emit('new_message_notification', {
            from: socket.username,
            message: message.substring(0, 50) + '...',
            chatRoom
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Mark messages read
    socket.on('mark_messages_read', async ({ chatRoom }) => {
      try {
        await Message.updateMany(
          { chatRoom, recipientId: socket.userId, isRead: false },
          { isRead: true }
        );

        socket.to(chatRoom).emit('messages_read', {
          readBy: socket.userId,
          chatRoom
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Typing indicator
    socket.on('typing', ({ recipientId, isTyping }) => {
      const chatRoom = generateRoomId(socket.userId, recipientId);
      socket.to(chatRoom).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        isTyping
      });
    });

    // Chat history
    socket.on('get_chat_history', async ({ recipientId, page = 1, limit = 50 }) => {
      try {
        const chatRoom = generateRoomId(socket.userId, recipientId);

        const messages = await Message.find({ chatRoom })
          .populate('senderId', 'username image')
          .sort({ timestamp: -1 })
          .limit(limit)
          .skip((page - 1) * limit);

        socket.emit('chat_history', {
          messages: messages.reverse(),
          chatRoom,
          hasMore: messages.length === limit
        });

      } catch (error) {
        console.error('Error fetching chat history:', error);
        socket.emit('chat_history_error', { error: 'Failed to fetch messages' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.username} disconnected`);
      activeUsers.delete(socket.userId);
      io.emit('users_online', Array.from(activeUsers.values()));
    });
  });
}

// Helper function
function generateRoomId(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
}

module.exports = socketSetup;
