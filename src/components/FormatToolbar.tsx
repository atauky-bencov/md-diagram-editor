import type { FormatAction } from '../utils/formatting'
import './FormatToolbar.css'

interface ButtonDef {
  label: string
  action: FormatAction
  title: string
}

const BUTTONS: (ButtonDef | 'sep')[] = [
  { label: 'B',   action: 'bold',          title: '太字 (Ctrl+B)' },
  { label: 'I',   action: 'italic',         title: '斜体 (Ctrl+I)' },
  { label: 'S',   action: 'strikethrough',  title: '打ち消し線' },
  'sep',
  { label: 'H1',  action: 'h1',             title: '見出し 1' },
  { label: 'H2',  action: 'h2',             title: '見出し 2' },
  { label: 'H3',  action: 'h3',             title: '見出し 3' },
  'sep',
  { label: '•',   action: 'ul',             title: '箇条書きリスト' },
  { label: '1.',  action: 'ol',             title: '番号付きリスト' },
  { label: '❝',   action: 'blockquote',     title: '引用' },
  'sep',
  { label: '`',   action: 'code',           title: 'インラインコード' },
  { label: '```', action: 'codeblock',      title: 'コードブロック' },
  { label: '[]',  action: 'link',           title: 'リンク' },
  { label: '—',   action: 'hr',             title: '水平線' },
]

interface FormatToolbarProps {
  onFormat: (action: FormatAction) => void
}

export function FormatToolbar({ onFormat }: FormatToolbarProps) {
  return (
    <div className="format-toolbar" onMouseDown={(e) => e.preventDefault()}>
      {BUTTONS.map((btn, i) =>
        btn === 'sep' ? (
          <div key={i} className="format-sep" />
        ) : (
          <button
            key={btn.action}
            className="format-btn"
            data-action={btn.action}
            title={btn.title}
            onClick={() => onFormat(btn.action)}
          >
            {btn.label}
          </button>
        )
      )}
    </div>
  )
}
