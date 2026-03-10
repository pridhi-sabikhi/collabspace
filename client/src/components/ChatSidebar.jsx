import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

export default function ChatSidebar({ documentId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Load messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket?.connected) return;

    socket.emit('get-messages', documentId, (msgs) => {
      setMessages(msgs || []);
      setLoading(false);
    });

    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, [documentId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const socket = getSocket();
    if (!socket?.connected) return;

    socket.emit('send-message', documentId, {
      senderId: user._id,
      text: text.trim(),
    });
    setText('');
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-blue-50 flex items-center justify-between">
        <h3 className="font-bold text-blue-800">💬 Chat</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?._id === user?._id;
            return (
              <div key={msg._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: isMe ? '#e94560' : '#4361ee' }}
                >
                  {msg.sender?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-600">
                      {isMe ? 'You' : msg.sender?.name}
                    </span>
                    <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div
                    className={`inline-block px-3 py-2 rounded-xl text-sm ${
                      isMe
                        ? 'bg-accent text-white rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
