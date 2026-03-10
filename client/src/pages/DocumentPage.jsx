import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import toast from 'react-hot-toast';
import Editor from '../components/Editor';
import AISidebar from '../components/AISidebar';
import ChatSidebar from '../components/ChatSidebar';
import OnlineUsers from '../components/OnlineUsers';

export default function DocumentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [rightPanel, setRightPanel] = useState(null); // 'ai' | 'chat' | null
  const [selectedText, setSelectedText] = useState('');

  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Load document
  useEffect(() => {
    const loadDoc = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/documents/${id}`);
        setDocument(res.data);

        // Load sibling docs
        const workspaceId = res.data.workspace?._id || res.data.workspace;
        if (workspaceId) {
          const docsRes = await api.get(`/documents/workspace/${workspaceId}`);
          setDocuments(docsRes.data);
        }
      } catch {
        toast.error('Failed to load document');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadDoc();
  }, [id, navigate]);

  // Socket connection
  useEffect(() => {
    if (!document || !user) return;

    const socket = connectSocket();

    socket.emit('join-document', id, user._id);

    socket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    socket.on('user-joined', (userData) => {
      setActiveUsers((prev) => {
        if (prev.find((u) => u._id === userData._id)) return prev;
        return [...prev, userData];
      });
    });

    socket.on('user-left', (userId) => {
      setActiveUsers((prev) => prev.filter((u) => u._id !== userId));
    });

    socket.on('document-change', (delta) => {
      if (editorRef.current) {
        const editor = editorRef.current;
        const { from, to } = editor.state.selection;
        editor.commands.setContent(delta, false);
        // Restore cursor position
        try {
          editor.commands.setTextSelection({ from, to });
        } catch {
          // Position might be out of bounds
        }
      }
    });

    socket.on('cursor-move', (userId, position) => {
      // Could be used for remote cursor rendering
    });

    return () => {
      socket.emit('leave-document', id, user._id);
      socket.off('active-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('document-change');
      socket.off('cursor-move');
      disconnectSocket();
    };
  }, [document?._id, user?._id]);

  // Auto-save with debounce
  const saveDocument = useCallback(
    async (content, title) => {
      setSaving(true);
      try {
        const payload = {};
        if (content !== undefined) payload.content = content;
        if (title !== undefined) payload.title = title;

        await api.put(`/documents/${id}`, payload);
        setLastSaved(new Date());
      } catch {
        // Silent fail for auto-save
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  const handleEditorChange = useCallback(
    (content) => {
      // Emit to socket
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('document-change', id, content, user._id);
      }

      // Debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(content);
      }, 3000);
    },
    [id, user?._id, saveDocument]
  );

  const handleTitleChange = useCallback(
    (newTitle) => {
      setDocument((prev) => ({ ...prev, title: newTitle }));
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(undefined, newTitle);
      }, 1000);
    },
    [saveDocument]
  );

  const handleTextSelect = useCallback((text) => {
    setSelectedText(text);
  }, []);

  const handleAIInsert = useCallback(
    (text) => {
      if (editorRef.current) {
        editorRef.current.commands.insertContent(text);
        toast.success('AI content inserted');
      }
    },
    []
  );

  const handleOutlineInsert = useCallback(
    (json) => {
      if (editorRef.current) {
        editorRef.current.commands.setContent(json);
        toast.success('Outline inserted');
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="h-screen flex">
        <div className="w-60 bg-sidebar">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-8 rounded bg-gray-700"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b bg-white flex items-center px-6">
            <div className="skeleton h-6 w-48 rounded"></div>
          </div>
          <div className="flex-1 p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-4 rounded" style={{ width: `${90 - i * 10}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Sidebar - Document List */}
      <div className="w-60 bg-sidebar text-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <Link
            to={`/workspace/${document?.workspace?._id || document?.workspace}`}
            className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
          >
            ← Back to Workspace
          </Link>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Documents
          </h3>
          <div className="space-y-1">
            {documents.map((doc) => (
              <Link
                key={doc._id}
                to={`/document/${doc._id}`}
                className={`block px-3 py-2 rounded-lg text-sm transition truncate ${
                  doc._id === id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {doc.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-14 border-b bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={document?.title || ''}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg font-semibold outline-none border-none bg-transparent"
              placeholder="Untitled"
            />
            <span className="text-xs text-gray-400">
              {saving ? 'Saving...' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <OnlineUsers users={activeUsers} />
            <button
              onClick={() => setRightPanel(rightPanel === 'ai' ? null : 'ai')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                rightPanel === 'ai'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✨ AI
            </button>
            <button
              onClick={() => setRightPanel(rightPanel === 'chat' ? null : 'chat')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                rightPanel === 'chat'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              💬 Chat
            </button>
          </div>
        </div>

        {/* Editor + Right Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-4xl mx-auto py-8 px-12">
              <Editor
                ref={editorRef}
                initialContent={document?.content}
                onChange={handleEditorChange}
                onTextSelect={handleTextSelect}
              />
            </div>
          </div>

          {/* Right Panel */}
          {rightPanel && (
            <div className="w-80 border-l bg-gray-50 flex flex-col flex-shrink-0 transition-all">
              {rightPanel === 'ai' ? (
                <AISidebar
                  selectedText={selectedText}
                  onInsert={handleAIInsert}
                  onOutlineInsert={handleOutlineInsert}
                  onClose={() => setRightPanel(null)}
                />
              ) : (
                <ChatSidebar
                  documentId={id}
                  onClose={() => setRightPanel(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
