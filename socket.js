// socket.js (Backend)
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message'); // Adjust path

// Store active users and calls
const activeUsers = new Map();
const activeCalls = new Map();

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

    // === CHAT FUNCTIONALITY ===

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

    // === CALL MANAGEMENT ===

    // Initiate call
    socket.on('initiate_call', ({ recipientId, topic, callId }) => {
      try {
        const callData = {
          callId,
          initiatorId: socket.userId,
          recipientId,
          topic,
          status: 'initiated',
          createdAt: new Date()
        };

        activeCalls.set(callId, callData);
        console.log(`Call initiated: ${callId} from ${socket.username} to ${recipientId}`);

      } catch (error) {
        console.error('Error initiating call:', error);
      }
    });

    // Send call request
    socket.on('call_request', ({ recipientId, topic, callId }) => {
      try {
        const recipient = activeUsers.get(recipientId);
        if (recipient) {
          io.to(recipient.socketId).emit('call_request', {
            callId,
            fromUser: socket.username,
            fromUserId: socket.userId,
            topic
          });
          
          // Update call status
          const callData = activeCalls.get(callId);
          if (callData) {
            callData.status = 'calling';
            activeCalls.set(callId, callData);
          }
        } else {
          socket.emit('call_error', { error: 'Recipient is not online' });
        }

      } catch (error) {
        console.error('Error sending call request:', error);
      }
    });

    // Accept call
    socket.on('accept_call', ({ callId }) => {
      try {
        const callData = activeCalls.get(callId);
        if (callData && callData.recipientId === socket.userId) {
          callData.status = 'accepted';
          activeCalls.set(callId, callData);

          const initiator = activeUsers.get(callData.initiatorId);
          if (initiator) {
            io.to(initiator.socketId).emit('call_accepted', {
              callId,
              recipientId: socket.userId,
              recipientName: socket.username
            });
          }

          socket.emit('call_accepted', {
            callId,
            initiatorId: callData.initiatorId
          });

        } else {
          socket.emit('call_error', { error: 'Call not found or unauthorized' });
        }

      } catch (error) {
        console.error('Error accepting call:', error);
      }
    });

    // Decline call
    socket.on('decline_call', ({ callId }) => {
      try {
        const callData = activeCalls.get(callId);
        if (callData && callData.recipientId === socket.userId) {
          callData.status = 'declined';
          activeCalls.set(callId, callData);

          const initiator = activeUsers.get(callData.initiatorId);
          if (initiator) {
            io.to(initiator.socketId).emit('call_declined', {
              callId,
              reason: 'User declined'
            });
          }

          // Clean up call after some time
          setTimeout(() => {
            activeCalls.delete(callId);
          }, 30000);

        } else {
          socket.emit('call_error', { error: 'Call not found or unauthorized' });
        }

      } catch (error) {
        console.error('Error declining call:', error);
      }
    });

    // End call
    socket.on('end_call', ({ callId }) => {
      try {
        const callData = activeCalls.get(callId);
        if (callData && (callData.initiatorId === socket.userId || callData.recipientId === socket.userId)) {
          callData.status = 'ended';
          callData.endedAt = new Date();

          const otherUserId = callData.initiatorId === socket.userId ? 
            callData.recipientId : callData.initiatorId;
          
          const otherUser = activeUsers.get(otherUserId);
          if (otherUser) {
            io.to(otherUser.socketId).emit('call_ended', {
              callId,
              endedBy: socket.userId
            });
          }

          socket.emit('call_ended', { callId });

          // Clean up call
          setTimeout(() => {
            activeCalls.delete(callId);
          }, 5000);

        } else {
          socket.emit('call_error', { error: 'Call not found or unauthorized' });
        }

      } catch (error) {
        console.error('Error ending call:', error);
      }
    });

    // Speaker change
    socket.on('speaker_change', ({ callId, speakerId }) => {
      try {
        const callData = activeCalls.get(callId);
        if (callData && (callData.initiatorId === socket.userId || callData.recipientId === socket.userId)) {
          const otherUserId = callData.initiatorId === socket.userId ? 
            callData.recipientId : callData.initiatorId;
          
          const otherUser = activeUsers.get(otherUserId);
          if (otherUser) {
            io.to(otherUser.socketId).emit('speaker_change', {
              callId,
              speakerId
            });
          }

        } else {
          socket.emit('call_error', { error: 'Call not found or unauthorized' });
        }

      } catch (error) {
        console.error('Error handling speaker change:', error);
      }
    });

    // === WEBRTC SIGNALING ===

    // WebRTC offer
    socket.on('webrtc_offer', ({ to, offer, callId }) => {
      try {
        const recipient = activeUsers.get(to);
        if (recipient) {
          io.to(recipient.socketId).emit('webrtc_offer', {
            from: socket.userId,
            offer,
            callId
          });
        }

      } catch (error) {
        console.error('Error handling WebRTC offer:', error);
      }
    });

    // WebRTC answer
    socket.on('webrtc_answer', ({ to, answer, callId }) => {
      try {
        const recipient = activeUsers.get(to);
        if (recipient) {
          io.to(recipient.socketId).emit('webrtc_answer', {
            from: socket.userId,
            answer,
            callId
          });
        }

      } catch (error) {
        console.error('Error handling WebRTC answer:', error);
      }
    });

    // ICE candidate
    socket.on('webrtc_ice_candidate', ({ to, candidate, callId }) => {
      try {
        const recipient = activeUsers.get(to);
        if (recipient) {
          io.to(recipient.socketId).emit('webrtc_ice_candidate', {
            from: socket.userId,
            candidate,
            callId
          });
        }

      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // === DISCONNECT HANDLER ===

    socket.on('disconnect', () => {
      console.log(`User ${socket.username} disconnected`);
      
      // Clean up active calls involving this user
      activeCalls.forEach((callData, callId) => {
        if (callData.initiatorId === socket.userId || callData.recipientId === socket.userId) {
          const otherUserId = callData.initiatorId === socket.userId ? 
            callData.recipientId : callData.initiatorId;
          
          const otherUser = activeUsers.get(otherUserId);
          if (otherUser) {
            io.to(otherUser.socketId).emit('call_ended', {
              callId,
              reason: 'User disconnected'
            });
          }
          
          activeCalls.delete(callId);
        }
      });

      activeUsers.delete(socket.userId);
      io.emit('users_online', Array.from(activeUsers.values()));
    });
  });

  return io;
}

// Helper function
function generateRoomId(userId1, userId2) {
  return [userId1, userId2].sort().join('_');
}

module.exports = socketSetup;