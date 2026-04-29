import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState, Compartment } from '@codemirror/state'
import { search } from '@codemirror/search'
import { applyFormat } from '../utils/formatting'
import type { FormatAction } from '../utils/formatting'

export interface EditorHandle {
  format: (action: FormatAction) => void
  insertText: (text: string) => void
  scrollToRatio: (ratio: number) => void
}

interface EditorProps {
  value: string
  onChange: (value: string) => void
  onScroll?: (ratio: number) => void
  theme?: 'dark' | 'light'
}

export const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ value, onChange, onScroll, theme = 'dark' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)
    const onScrollRef = useRef(onScroll)
    onScrollRef.current = onScroll
    const themeCompartment = useRef(new Compartment())

    useImperativeHandle(ref, () => ({
      format: (action: FormatAction) => {
        if (viewRef.current) applyFormat(viewRef.current, action)
      },
      insertText: (text: string) => {
        const view = viewRef.current
        if (!view) return
        const { from, to } = view.state.selection.main
        view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } })
        view.focus()
      },
      scrollToRatio: (ratio: number) => {
        const view = viewRef.current
        if (!view) return
        const { scrollHeight, clientHeight } = view.scrollDOM
        view.scrollDOM.scrollTop = ratio * (scrollHeight - clientHeight)
      },
    }))

    useEffect(() => {
      if (!containerRef.current) return

      const view = new EditorView({
        state: EditorState.create({
          doc: value,
          extensions: [
            basicSetup,
            search({ top: true }),
            markdown(),
            themeCompartment.current.of(theme === 'dark' ? oneDark : []),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                onChange(update.state.doc.toString())
              }
            }),
            EditorView.domEventHandlers({
              scroll: (_e, view) => {
                const { scrollTop, scrollHeight, clientHeight } = view.scrollDOM
                const max = scrollHeight - clientHeight
                if (max > 0) onScrollRef.current?.(scrollTop / max)
                return false
              },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      const view = viewRef.current
      if (!view) return
      view.dispatch({
        effects: themeCompartment.current.reconfigure(theme === 'dark' ? oneDark : []),
      })
    }, [theme])

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
