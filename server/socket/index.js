const Message = require('../models/Message');
const User = require('../models/User');
const Document = require('../models/Document');
const Workspace = require('../models/Workspace');
const jwt = require('jsonwebtoken');

const activeUsers = new Map(); // documentId -> Map(socketId -> userData)

module.exports = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join-document', async (documentId) => {
      try {
        const document = await Document.findById(documentId).select('workspace');
        const workspace = document && await Workspace.findOne({
          _id: document.workspace,
          'members.user': socket.userId,
        }).select('_id');
        if (!workspace) {
          return;
        }

        const user = await User.findById(socket.userId).select('name avatar');
        if (!user) return;

        socket.join(documentId);
        socket.documentId = documentId;

        if (!activeUsers.has(documentId)) {
          activeUsers.set(documentId, new Map());
        }
        activeUsers.get(documentId).set(socket.id, {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
          socketId: socket.id,
        });

        // Notify room
        socket.to(documentId).emit('user-joined', {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        });

        // Send current active users to the joining user
        const users = Array.from(activeUsers.get(documentId).values());
        socket.emit('active-users', users);
      } catch (err) {
        console.error('join-document error:', err.message);
      }
    });

    socket.on('leave-document', (documentId) => {
      socket.leave(documentId);

      if (activeUsers.has(documentId)) {
        activeUsers.get(documentId).delete(socket.id);
        if (activeUsers.get(documentId).size === 0) {
          activeUsers.delete(documentId);
        }
      }

      socket.to(documentId).emit('user-left', socket.userId);
      socket.documentId = null;
    });

    socket.on('document-change', (documentId, delta) => {
      if (socket.documentId !== documentId) return;
      socket.to(documentId).emit('document-change', delta, socket.userId);
    });

    socket.on('send-message', async (documentId, messageData) => {
      try {
        if (socket.documentId !== documentId || !messageData?.text?.trim()) return;
        const message = await Message.create({
          document: documentId,
          sender: socket.userId,
          text: messageData.text,
        });

        const populated = await message.populate('sender', 'name avatar');

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
        if (socket.documentId !== documentId) return callback?.([]);
        const messages = await Message.find({ document: documentId })
          .populate('sender', 'name avatar')
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
      const { documentId } = socket;

      if (documentId && activeUsers.has(documentId)) {
        activeUsers.get(documentId).delete(socket.id);
        if (activeUsers.get(documentId).size === 0) {
          activeUsers.delete(documentId);
        }
        socket.to(documentId).emit('user-left', socket.userId);
      }

      console.log('Socket disconnected:', socket.id);
    });
  });
};
