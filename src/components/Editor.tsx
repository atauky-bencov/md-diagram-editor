import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState } from '@codemirror/state'
import { applyFormat } from '../utils/formatting'
import type { FormatAction } from '../utils/formatting'

export interface EditorHandle {
  format: (action: FormatAction) => void
}

interface EditorProps {
  value: string
  onChange: (value: string) => void
}

export const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ value, onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)

    useImperativeHandle(ref, () => ({
      format: (action: FormatAction) => {
        if (viewRef.current) applyFormat(viewRef.current, action)
      },
    }))

    useEffect(() => {
      if (!containerRef.current) return

      const view = new EditorView({
        state: EditorState.create({
          doc: value,
          extensions: [
            basicSetup,
            markdown(),
            oneDark,
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                onChange(update.state.doc.toString())
              }
            }),
            EditorView.theme({
              '&': { height: '100%' },
              '.cm-scroller': { overflow: 'auto' },
            }),
          ],
        }),
        parent: containerRef.current,
      })

      viewRef.current = view
      return () => view.destroy()
    }, [])

    useEffect(() => {
      const view = viewRef.current
      if (!view) return
      const current = view.state.doc.toString()
      if (current !== value) {
        view.dispatch({
          changes: { from: 0, to: current.length, insert: value },
        })
      }
    }, [value])

    return <div ref={containerRef} style={{ flex: 1, overflow: 'hidden' }} />
  }
)
