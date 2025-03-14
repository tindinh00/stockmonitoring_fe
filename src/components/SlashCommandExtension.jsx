import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';

const CommandList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  const handleItemClick = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIndex(index);
    selectItem(index);
  };

  return (
    <div className="bg-white shadow-lg rounded-md border overflow-hidden p-1 max-h-80 overflow-y-auto" style={{ zIndex: 99999, pointerEvents: 'auto' }}>
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={index}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md text-black ${
              index === selectedIndex ? 'bg-gray-100' : ''
            }`}
            onClick={(e) => handleItemClick(index, e)}
            onMouseEnter={() => setSelectedIndex(index)}
            type="button"
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
              {item.icon}
            </div>
            <div>
              <div className="font-medium text-black">{item.title}</div>
              <div className="text-xs text-gray-700">{item.description}</div>
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-black">Không có kết quả</div>
      )}
    </div>
  );
});

const commands = [
  {
    title: 'Heading 1',
    description: 'Tiêu đề lớn',
    icon: <Heading1 className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Tiêu đề vừa',
    icon: <Heading2 className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Tiêu đề nhỏ',
    icon: <Heading3 className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Danh sách không đánh số',
    icon: <List className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Danh sách đánh số',
    icon: <ListOrdered className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Trích dẫn',
    icon: <Quote className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Khối mã',
    icon: <Code className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Horizontal Rule',
    description: 'Đường kẻ ngang',
    icon: <Minus className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: 'Bold',
    description: 'Chữ đậm',
    icon: <Bold className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBold().run();
    },
  },
  {
    title: 'Italic',
    description: 'Chữ nghiêng',
    icon: <Italic className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleItalic().run();
    },
  },
  {
    title: 'Underline',
    description: 'Chữ gạch chân',
    icon: <Underline className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleUnderline().run();
    },
  },
  {
    title: 'Align Left',
    description: 'Căn lề trái',
    icon: <AlignLeft className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('left').run();
    },
  },
  {
    title: 'Align Center',
    description: 'Căn lề giữa',
    icon: <AlignCenter className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('center').run();
    },
  },
  {
    title: 'Align Right',
    description: 'Căn lề phải',
    icon: <AlignRight className="w-4 h-4 text-black" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign('right').run();
    },
  },
];

const renderItems = () => {
  return commands;
};

const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: renderItems,
        render: () => {
          let component;
          let popup;

          return {
            onStart: (props) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              });

              popup = tippy(document.body, {
                getReferenceClientRect: props.clientRect,
                appendTo: document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                interactiveBorder: 20,
                trigger: 'manual',
                placement: 'bottom-start',
                zIndex: 99999,
                theme: 'light',
                arrow: true,
                maxWidth: 'none',
                inertia: true,
                duration: [300, 75],
                popperOptions: {
                  strategy: 'fixed',
                  modifiers: [
                    {
                      name: 'preventOverflow',
                      options: {
                        padding: 10,
                        boundary: document.body,
                      },
                    },
                    {
                      name: 'flip',
                      options: {
                        padding: 10,
                        fallbackPlacements: ['top-start', 'bottom-start'],
                      },
                    },
                  ],
                },
                onShow(instance) {
                  instance.popper.style.pointerEvents = 'auto';
                  instance.popper.style.opacity = 1;
                  instance.popper.style.visibility = 'visible';
                  instance.popper.style.zIndex = 99999;
                  
                  instance.popper.classList.add('tippy-slash-command');
                },
                onHide() {
                  // Xử lý khi tippy bị ẩn
                  const tippyElements = document.querySelectorAll('.tippy-box');
                  tippyElements.forEach(el => {
                    if (el.style) {
                      el.style.visibility = 'hidden';
                      el.style.opacity = '0';
                    }
                  });
                },
                onMount(instance) {
                  instance.popper.style.pointerEvents = 'auto';
                  instance.popper.style.opacity = 1;
                  instance.popper.style.visibility = 'visible';
                  instance.popper.style.zIndex = 99999;
                  
                  const handleClickOutside = (e) => {
                    // Chỉ ẩn khi click bên ngoài popper và không phải trong dialog
                    if (!instance.popper.contains(e.target) && 
                        !e.target.closest('.dialog-content') &&
                        !e.target.closest('.tippy-slash-command')) {
                      instance.hide();
                    }
                  };
                  
                  document.addEventListener('mousedown', handleClickOutside);
                  
                  return () => {
                    document.removeEventListener('mousedown', handleClickOutside);
                  };
                },
              });

              // Lưu trữ tham chiếu đến popup để có thể truy cập từ bên ngoài
              window.currentSlashCommandPopup = popup;
            },
            onUpdate(props) {
              component.updateProps(props);

              if (popup && popup[0]) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              }
            },
            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                if (popup && popup[0]) {
                  popup[0].hide();
                }
                return true;
              }

              return component.ref?.onKeyDown(props);
            },
            onExit() {
              if (popup && popup[0]) {
                popup[0].hide();
                popup[0].destroy();
              }
              if (component) {
                component.destroy();
              }

              // Xóa tất cả các tippy còn sót lại
              const tippyElements = document.querySelectorAll('.tippy-box');
              tippyElements.forEach(el => {
                if (el.style) {
                  el.style.visibility = 'hidden';
                  el.style.opacity = '0';
                }
              });
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommandExtension; 