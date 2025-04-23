import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import SlashCommandExtension from './SlashCommandExtension';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  // Ngăn chặn sự kiện click lan truyền lên dialog
  const handleButtonClick = (callback) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ẩn tất cả các tippy còn sót lại
    const tippyElements = document.querySelectorAll('.tippy-box');
    tippyElements.forEach(el => {
      if (el.style) {
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      }
    });
    
    callback();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 mb-2 border rounded-md bg-muted" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().toggleBold().run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive('bold') ? 'bg-primary/20 text-primary' : ''}`}
        title="Bold"
        type="button"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().toggleItalic().run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive('italic') ? 'bg-primary/20 text-primary' : ''}`}
        title="Italic"
        type="button"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().toggleUnderline().run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive('underline') ? 'bg-primary/20 text-primary' : ''}`}
        title="Underline"
        type="button"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1"></div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive('heading', { level: 1 }) ? 'bg-primary/20 text-primary' : ''}`}
        title="Heading 1"
        type="button"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : ''}`}
        title="Heading 2"
        type="button"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive('heading', { level: 3 }) ? 'bg-primary/20 text-primary' : ''}`}
        title="Heading 3"
        type="button"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1"></div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().setTextAlign('left').run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary/20 text-primary' : ''}`}
        title="Align Left"
        type="button"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().setTextAlign('center').run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary/20 text-primary' : ''}`}
        title="Align Center"
        type="button"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().setTextAlign('right').run())}
        className={`text-foreground hover:bg-accent hover:text-accent-foreground ${editor.isActive({ textAlign: 'right' }) ? 'bg-primary/20 text-primary' : ''}`}
        title="Align Right"
        type="button"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1"></div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().undo().run())}
        disabled={!editor.can().undo()}
        className="text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        title="Undo"
        type="button"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick(() => editor.chain().focus().redo().run())}
        disabled={!editor.can().redo()}
        className="text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        title="Redo"
        type="button"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      Underline,
      SlashCommandExtension,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      // Set default text alignment to left when editor is created
      editor.commands.setTextAlign('left');
    },
    editorProps: {
      attributes: {
        class: 'min-h-[200px] p-4 border rounded-md focus:outline-none',
      },
      handleClick: (view, pos, event) => {
        // Ngăn chặn sự kiện click lan truyền lên dialog
        event.stopPropagation();
        
        // Ẩn tất cả các tippy còn sót lại khi click vào editor
        const tippyElements = document.querySelectorAll('.tippy-box');
        if (!event.target.closest('.tippy-box')) {
          tippyElements.forEach(el => {
            if (el.style && !el.classList.contains('tippy-slash-command')) {
              el.style.visibility = 'hidden';
              el.style.opacity = '0';
            }
          });
        }
        
        return false;
      },
      handleKeyDown: (view, event) => {
        // Ngăn chặn sự kiện keydown lan truyền lên dialog nếu cần
        if (event.key === 'Escape') {
          event.stopPropagation();
          
          // Ẩn tất cả các tippy khi nhấn Escape
          const tippyElements = document.querySelectorAll('.tippy-box');
          tippyElements.forEach(el => {
            if (el.style) {
              el.style.visibility = 'hidden';
              el.style.opacity = '0';
            }
          });
          
          return true;
        }
        return false;
      },
    },
  });

  // Update content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Xử lý việc ẩn tippy khi component unmount
  useEffect(() => {
    return () => {
      // Ẩn tất cả các tippy khi component unmount
      const tippyElements = document.querySelectorAll('.tippy-box');
      tippyElements.forEach(el => {
        if (el.style) {
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
        }
      });
    };
  }, []);

  return (
    <div className="rich-text-editor relative" onClick={(e) => e.stopPropagation()}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} onClick={(e) => e.stopPropagation()} />
      {!value && placeholder && (
        <div className="absolute top-[70px] left-4 text-gray-400 pointer-events-none">
          {placeholder}
        </div>
      )}
      <div className="mt-2 text-xs text-gray-500">
      Mẹo: Nhập "/" để định dạng các tùy chọn
      </div>
    </div>
  );
};

export default RichTextEditor; 