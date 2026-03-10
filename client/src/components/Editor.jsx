import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { forwardRef, useImperativeHandle, useEffect, useCallback } from 'react';

const MenuButton = ({ onClick, active, children, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`px-2 py-1 rounded text-sm font-medium transition ${
      active
        ? 'bg-accent text-white'
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

const Editor = forwardRef(({ initialContent, onChange, onTextSelect }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: initialContent || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        onTextSelect(text);
      } else {
        onTextSelect('');
      }
    },
  });

  useImperativeHandle(ref, () => editor, [editor]);

  if (!editor) return null;

  return (
    <>
      {/* Fixed Toolbar */}
      <div className="flex items-center gap-1 mb-4 pb-3 border-b flex-wrap">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <s>S</s>
        </MenuButton>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          H3
        </MenuButton>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          • List
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered List"
        >
          1. List
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          " Quote
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          {'</>'}
        </MenuButton>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          ↩
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          ↪
        </MenuButton>
      </div>

      {/* Bubble Menu for selected text */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-1 bg-sidebar text-white rounded-lg shadow-xl px-2 py-1">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`px-2 py-1 rounded text-xs ${editor.isActive('bold') ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`px-2 py-1 rounded text-xs ${editor.isActive('italic') ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`px-2 py-1 rounded text-xs ${editor.isActive('strike') ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              S
            </button>
          </div>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </>
  );
});

Editor.displayName = 'Editor';

export default Editor;
