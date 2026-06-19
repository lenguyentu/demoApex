import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, editable = true,  }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[150px] ${
          editable ? 'p-4' : 'p-0'
        }`,
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={`rounded-lg ${editable ? 'border border-gray-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent' : ''}`}>
      {editable && (
        <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={<Bold size={16} />}
            title="Đậm"
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={<Italic size={16} />}
            title="Nghiêng"
          />
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={<List size={16} />}
            title="Danh sách"
          />
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={<ListOrdered size={16} />}
            title="Danh sách số"
          />
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            icon={<Undo size={16} />}
            title="Hoàn tác"
          />
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            icon={<Redo size={16} />}
            title="Làm lại"
          />
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function MenuButton({ 
  onClick, 
  isActive, 
  disabled, 
  icon, 
  title 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean; 
  icon: React.ReactNode; 
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive 
          ? 'bg-gray-200 text-gray-900' 
          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      type="button"
    >
      {icon}
    </button>
  );
}
