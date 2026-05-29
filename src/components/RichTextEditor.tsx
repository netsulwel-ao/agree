import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Link as LinkIcon, Undo2, Redo2, Pilcrow,
  Minus, Quote
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const buttonStyle: React.CSSProperties = {
  width: 32, height: 32, display: 'inline-flex', alignItems: 'center',
  justifyContent: 'center', background: 'transparent', border: 'none',
  borderRadius: 6, cursor: 'pointer', color: '#6b7280', transition: 'all .15s',
  fontSize: 14
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle, background: '#0d1117', color: '#fff'
};

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' }
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Escreva ou cole o conteúdo do contrato aqui...'
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html === '<p></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'rte-content',
        style: 'outline: none; min-height: 300px; font-family: "Poppins", sans-serif; font-size: 14px; line-height: 1.8; color: #374151; padding: 16px;'
      }
    }
  });

  const addLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  useEffect(() => {
    if (editor && content) {
      const currentHtml = editor.getHTML();
      const normalizedContent = content === '<p></p>' ? '' : content;
      const normalizedCurrent = currentHtml === '<p></p>' ? '' : currentHtml;
      if (normalizedContent !== normalizedCurrent) {
        editor.commands.setContent(content || '');
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  const ToolbarBtn = ({ onClick, isActive, children, title }: {
    onClick: () => void; isActive?: boolean; children: React.ReactNode; title?: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={isActive ? activeButtonStyle : buttonStyle}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#0d1117'; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      border: '1.5px solid #e2e5e9', overflow: 'hidden',
      transition: 'border-color .2s'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
        borderBottom: '1px solid #e2e5e9', background: '#fafafa', alignItems: 'center'
      }}>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Negrito">
          <Bold size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Itálico">
          <Italic size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Sublinhado">
          <UnderlineIcon size={15} />
        </ToolbarBtn>

        <div style={{ width: 1, height: 20, background: '#e2e5e9', margin: '0 4px' }} />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Título 1">
          <Heading1 size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Título 2">
          <Heading2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Título 3">
          <Heading3 size={15} />
        </ToolbarBtn>

        <div style={{ width: 1, height: 20, background: '#e2e5e9', margin: '0 4px' }} />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Lista marcadores">
          <List size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Lista numerada">
          <ListOrdered size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Citação">
          <Quote size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
          <Minus size={15} />
        </ToolbarBtn>

        <div style={{ width: 1, height: 20, background: '#e2e5e9', margin: '0 4px' }} />

        <ToolbarBtn onClick={addLink} isActive={editor.isActive('link')} title="Inserir link">
          <LinkIcon size={15} />
        </ToolbarBtn>

        <div style={{ flex: 1 }} />

        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Desfazer">
          <Undo2 size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Refazer">
          <Redo2 size={15} />
        </ToolbarBtn>
      </div>

      <EditorContent editor={editor} style={{ background: '#fff' }} />
    </div>
  );
}
