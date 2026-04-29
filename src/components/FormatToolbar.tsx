import { useState, useRef, useEffect } from 'react'
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

interface SnippetDef {
  label: string
  text: string
}

const SNIPPETS: SnippetDef[] = [
  {
    label: 'Mermaid: フローチャート',
    text: '```mermaid\nflowchart LR\n    A[開始] --> B[処理] --> C[終了]\n```\n',
  },
  {
    label: 'Mermaid: シーケンス',
    text: '```mermaid\nsequenceDiagram\n    participant A\n    participant B\n    A->>B: リクエスト\n    B-->>A: レスポンス\n```\n',
  },
  {
    label: 'Mermaid: クラス図',
    text: '```mermaid\nclassDiagram\n    class Animal {\n        +name: string\n        +sound() string\n    }\n```\n',
  },
  {
    label: 'Mermaid: ER図',
    text: '```mermaid\nerDiagram\n    USER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n```\n',
  },
  {
    label: 'PlantUML: シーケンス',
    text: '```plantuml\n@startuml\nparticipant A\nparticipant B\nA -> B : リクエスト\nB --> A : レスポンス\n@enduml\n```\n',
  },
  {
    label: 'PlantUML: クラス図',
    text: '```plantuml\n@startuml\nclass Animal {\n  +name: String\n  +sound(): String\n}\n@enduml\n```\n',
  },
  {
    label: 'Draw.io: 空白',
    text: '```drawio\n<mxGraphModel>\n  <root>\n    <mxCell id="0" />\n    <mxCell id="1" parent="0" />\n  </root>\n</mxGraphModel>\n```\n',
  },
]

interface FormatToolbarProps {
  onFormat: (action: FormatAction) => void
  onInsert: (text: string) => void
}

export function FormatToolbar({ onFormat, onInsert }: FormatToolbarProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

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

      <div className="format-sep" />

      <div className="snippet-menu" ref={menuRef}>
        <button
          className="format-btn snippet-trigger"
          title="ダイアグラムを挿入"
          onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        >
          ＋ダイアグラム ▾
        </button>
        {open && (
          <div className="snippet-dropdown">
            {SNIPPETS.map((s) => (
              <button
                key={s.label}
                className="snippet-item"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onInsert(s.text)
                  setOpen(false)
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
