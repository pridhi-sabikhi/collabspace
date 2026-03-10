const Message = require('../models/Message');
const User = require('../models/User');

const activeUsers = new Map(); // documentId -> Map(socketId -> userData)

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join-document', async (documentId, userId) => {
      socket.join(documentId);
      socket.documentId = documentId;
      socket.userId = userId;

      try {
        const user = await User.findById(userId).select('name email avatar');
        if (!user) return;

        if (!activeUsers.has(documentId)) {
          activeUsers.set(documentId, new Map());
        }
        activeUsers.get(documentId).set(socket.id, {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          socketId: socket.id,
        });

        // Notify room
        socket.to(documentId).emit('user-joined', {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        });

        // Send current active users to the joining user
        const users = Array.from(activeUsers.get(documentId).values());
        socket.emit('active-users', users);
      } catch (err) {
        console.error('join-document error:', err.message);
      }
    });

    socket.on('leave-document', (documentId, userId) => {
      socket.leave(documentId);

      if (activeUsers.has(documentId)) {
        activeUsers.get(documentId).delete(socket.id);
        if (activeUsers.get(documentId).size === 0) {
          activeUsers.delete(documentId);
        }
      }

      socket.to(documentId).emit('user-left', userId);
    });

    socket.on('document-change', (documentId, delta, userId) => {
      socket.to(documentId).emit('document-change', delta, userId);
    });

    socket.on('cursor-move', (documentId, userId, position) => {
      socket.to(documentId).emit('cursor-move', userId, position);
    });

    socket.on('send-message', async (documentId, messageData) => {
      try {
        const message = await Message.create({
          document: documentId,
          sender: messageData.senderId,
          text: messageData.text,
        });

        const populated = await message.populate('sender', 'name email avatar');

        io.to(documentId).emit('receive-message', {
          _id: populated._id,
          text: populated.text,
          sender: populated.sender,
          createdAt: populated.createdAt,
        });
      } catch (err) {
        console.error('send-message error:', err.message);
      }
    });

    socket.on('get-messages', async (documentId, callback) => {
      try {
        const messages = await Message.find({ document: documentId })
          .populate('sender', 'name email avatar')
          .sort({ createdAt: 1 })
          .limit(100);
        if (typeof callback === 'function') {
          callback(messages);
        }
      } catch (err) {
        console.error('get-messages error:', err.message);
        if (typeof callback === 'function') {
          callback([]);
        }
      }
    });

    socket.on('disconnect', () => {
      const { documentId, userId } = socket;

      if (documentId && activeUsers.has(documentId)) {
        activeUsers.get(documentId).delete(socket.id);
        if (activeUsers.get(documentId).size === 0) {
          activeUsers.delete(documentId);
        }
        socket.to(documentId).emit('user-left', userId);
      }

      console.log('Socket disconnected:', socket.id);
    });
  });
};
