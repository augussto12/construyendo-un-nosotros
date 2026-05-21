import {
  Bold,
  Eraser,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
} from 'lucide-react'
import Link from '@tiptap/extension-link'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState, type ReactNode } from 'react'
import { sanitizeBasicHtml } from '../utils/htmlSanitizer'

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
}

type ToolbarButtonProps = {
  label: string
  isActive?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolbarButton({ label, isActive = false, onClick, children }: ToolbarButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition ${
        isActive
          ? 'border-brand-green bg-brand-mint text-brand-ink'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
      }`}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

function isValidLink(value: string) {
  if (!value.trim()) {
    return false
  }

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:'
  } catch {
    return false
  }
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [linkValue, setLinkValue] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        linkOnPaste: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'min-h-72 overflow-x-auto rounded-b-md border border-t-0 border-slate-200 px-4 py-3 text-base leading-7 text-slate-800 outline-none break-words',
      },
      transformPastedHTML(html) {
        return sanitizeBasicHtml(html)
      },
    },
    onUpdate({ editor: instance }) {
      onChange(sanitizeBasicHtml(instance.getHTML()))
    },
  })

  useEffect(() => {
    if (!editor || value === editor.getHTML()) {
      return
    }

    editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  if (!editor) {
    return (
      <div className="min-h-72 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Cargando editor...
      </div>
    )
  }

  function applyLink() {
    if (!editor) {
      return
    }

    if (!linkValue.trim()) {
      editor.chain().focus().unsetLink().run()
      setShowLinkInput(false)
      return
    }

    if (!isValidLink(linkValue)) {
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: linkValue.trim() }).run()
    setLinkValue('')
    setShowLinkInput(false)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-t-md border border-slate-200 bg-slate-50 p-2">
        <ToolbarButton
          label="Parrafo"
          isActive={editor.isActive('paragraph')}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          <Pilcrow aria-hidden="true" size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Titulo H2"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Titulo H3"
          isActive={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Negrita"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold aria-hidden="true" size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Cursiva"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic aria-hidden="true" size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Lista desordenada"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Lista ordenada"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden="true" size={17} />
        </ToolbarButton>
        <ToolbarButton
          label="Cita"
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote aria-hidden="true" size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Link"
          isActive={editor.isActive('link')}
          onClick={() => {
            setShowLinkInput((current) => !current)
            setLinkValue(editor.getAttributes('link').href ?? '')
          }}
        >
          <LinkIcon aria-hidden="true" size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Quitar formato"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <Eraser aria-hidden="true" size={16} />
        </ToolbarButton>
      </div>
      {showLinkInput ? (
        <div className="flex flex-col gap-2 border-x border-slate-200 bg-white p-2 sm:flex-row">
          <input
            className="focus-ring min-h-10 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none"
            type="url"
            placeholder="https://..."
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
          />
          <button
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-md border border-brand-green bg-brand-green px-4 text-sm font-semibold text-brand-ink"
            type="button"
            onClick={applyLink}
          >
            Aplicar link
          </button>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  )
}
