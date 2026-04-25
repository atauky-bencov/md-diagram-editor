import { EditorView } from '@codemirror/view'

export type FormatAction =
  | 'bold' | 'italic' | 'strikethrough'
  | 'h1' | 'h2' | 'h3'
  | 'ul' | 'ol' | 'blockquote'
  | 'code' | 'codeblock' | 'link' | 'hr'

function wrapInline(view: EditorView, before: string, after: string) {
  const { from, to } = view.state.selection.main
  if (from === to) {
    view.dispatch({
      changes: { from, insert: before + after },
      selection: { anchor: from + before.length },
    })
  } else {
    const selected = view.state.doc.sliceString(from, to)
    view.dispatch({ changes: { from, to, insert: before + selected + after } })
  }
  view.focus()
}

function prefixLine(view: EditorView, prefix: string) {
  const line = view.state.doc.lineAt(view.state.selection.main.from)
  // すでに同じプレフィックスが付いていれば取り除く（トグル）
  if (view.state.doc.sliceString(line.from, line.from + prefix.length) === prefix) {
    view.dispatch({ changes: { from: line.from, to: line.from + prefix.length, insert: '' } })
  } else {
    view.dispatch({ changes: { from: line.from, insert: prefix } })
  }
  view.focus()
}

function insertAtCursor(view: EditorView, text: string, cursorOffset: number) {
  const { from, to } = view.state.selection.main
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + cursorOffset },
  })
  view.focus()
}

export function applyFormat(view: EditorView, action: FormatAction) {
  switch (action) {
    case 'bold':          return wrapInline(view, '**', '**')
    case 'italic':        return wrapInline(view, '*', '*')
    case 'strikethrough': return wrapInline(view, '~~', '~~')
    case 'h1':            return prefixLine(view, '# ')
    case 'h2':            return prefixLine(view, '## ')
    case 'h3':            return prefixLine(view, '### ')
    case 'ul':            return prefixLine(view, '- ')
    case 'ol':            return prefixLine(view, '1. ')
    case 'blockquote':    return prefixLine(view, '> ')
    case 'code':          return wrapInline(view, '`', '`')
    case 'codeblock':     return insertAtCursor(view, '```\n\n```', 4)
    case 'link':          return wrapInline(view, '[', '](url)')
    case 'hr':            return insertAtCursor(view, '\n---\n', 5)
  }
}
