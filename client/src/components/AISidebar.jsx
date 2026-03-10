import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const AI_COMMANDS = [
  { key: 'summarize', label: 'Summarize', icon: '📝' },
  { key: 'fix_grammar', label: 'Fix Grammar', icon: '✏️' },
  { key: 'translate', label: 'Translate', icon: '🌐' },
  { key: 'explain', label: 'Explain', icon: '💡' },
  { key: 'expand', label: 'Expand', icon: '📖' },
  { key: 'make_shorter', label: 'Make Shorter', icon: '✂️' },
];

export default function AISidebar({ selectedText, onInsert, onOutlineInsert, onClose }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [outlineTopic, setOutlineTopic] = useState('');
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [activeCommand, setActiveCommand] = useState('');

  const runCommand = async (command) => {
    if (!selectedText) {
      toast.error('Select some text in the editor first');
      return;
    }
    setLoading(true);
    setActiveCommand(command);
    setResult('');
    try {
      const res = await api.post('/ai/command', {
        selectedText,
        command,
      });
      setResult(res.data.result);
      toast.success('AI result ready');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const generateOutline = async (e) => {
    e.preventDefault();
    if (!outlineTopic.trim()) return;
    setOutlineLoading(true);
    setResult('');
    try {
      const res = await api.post('/ai/generate-outline', { topic: outlineTopic.trim() });
      onOutlineInsert(res.data.result);
      setOutlineTopic('');
      toast.success('Outline generated and inserted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Outline generation failed');
    } finally {
      setOutlineLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-purple-50 flex items-center justify-between">
        <h3 className="font-bold text-purple-800">✨ AI Assistant</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Generate Outline */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Generate Outline</h4>
          <form onSubmit={generateOutline} className="flex gap-2">
            <input
              type="text"
              value={outlineTopic}
              onChange={(e) => setOutlineTopic(e.target.value)}
              placeholder="Enter a topic..."
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={outlineLoading || !outlineTopic.trim()}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {outlineLoading ? '...' : 'Go'}
            </button>
          </form>
        </div>

        {/* AI Commands */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            AI Commands
            {selectedText && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({selectedText.length} chars selected)
              </span>
            )}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {AI_COMMANDS.map((cmd) => (
              <button
                key={cmd.key}
                onClick={() => runCommand(cmd.key)}
                disabled={loading || !selectedText}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition border ${
                  loading && activeCommand === cmd.key
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <span>{cmd.icon}</span>
                <span>{cmd.label}</span>
              </button>
            ))}
          </div>
          {!selectedText && (
            <p className="text-xs text-gray-400 mt-2">
              Select text in the editor to use AI commands
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span className="text-sm text-purple-700">Processing...</span>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="bg-ai-bg rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-purple-800">Result</h4>
              <button
                onClick={() => {
                  onInsert(result);
                  setResult('');
                }}
                className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition"
              >
                Insert into doc
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {result}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
