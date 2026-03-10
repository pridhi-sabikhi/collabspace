import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function WorkspacePage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [wsRes, docsRes] = await Promise.all([
        api.get('/workspaces'),
        api.get(`/documents/workspace/${id}`),
      ]);
      const ws = wsRes.data.find((w) => w._id === id);
      setWorkspace(ws);
      setDocuments(docsRes.data);
    } catch {
      toast.error('Failed to load workspace');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    setCreatingDoc(true);
    try {
      const res = await api.post('/documents', { workspaceId: id, title: 'Untitled' });
      navigate(`/document/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create document');
    } finally {
      setCreatingDoc(false);
    }
  };

  const inviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await api.post(`/workspaces/${id}/invite`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setWorkspace(res.data);
      setInviteEmail('');
      setShowInviteModal(false);
      toast.success('Member invited successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (userId) => {
    try {
      const res = await api.delete(`/workspaces/${id}/members/${userId}`);
      setWorkspace(res.data);
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-sidebar text-white">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="skeleton h-6 w-48 rounded bg-gray-600"></div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-xl"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-sidebar text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-400 hover:text-white transition">
              ← Back
            </Link>
            <h1 className="text-xl font-bold">{workspace?.name || 'Workspace'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm">{user?.name}</span>
            </div>
            <button onClick={logout} className="text-sm text-gray-300 hover:text-white transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Documents */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Documents</h2>
              <button
                onClick={createDocument}
                disabled={creatingDoc}
                className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-red-600 transition font-medium disabled:opacity-50"
              >
                {creatingDoc ? 'Creating...' : '+ New Document'}
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <div className="text-5xl mb-3">📄</div>
                <p className="text-gray-500">No documents yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/document/${doc._id}`)}
                    className="bg-white rounded-lg border border-gray-100 p-4 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <h3 className="font-medium text-gray-800 group-hover:text-accent transition">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Last edited {new Date(doc.updatedAt).toLocaleString()}{' '}
                        {doc.lastEditedBy && `by ${doc.lastEditedBy.name}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">v{doc.version}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members Sidebar */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Members</h2>
              {workspace?.owner?._id === user?._id && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-sm text-accent hover:underline font-medium"
                >
                  + Invite
                </button>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 divide-y">
              {workspace?.members?.map((m) => (
                <div key={m.user?._id || m._id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sidebar-light flex items-center justify-center text-white text-sm font-bold">
                      {m.user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.user?.name}</p>
                      <p className="text-xs text-gray-400">{m.role}</p>
                    </div>
                  </div>
                  {workspace?.owner?._id === user?._id && m.role !== 'owner' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMember(m.user?._id);
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Invite Member</h3>
            <form onSubmit={inviteMember}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none mb-3"
                autoFocus
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none mb-4"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
