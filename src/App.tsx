import { useState, useCallback, useRef, useEffect } from 'react'
import { Editor } from './components/Editor'
import type { EditorHandle } from './components/Editor'
import { Preview } from './components/Preview'
import { DrawioModal } from './components/DrawioModal'
import { DiagramZoomModal } from './components/DiagramZoomModal'
import { FormatToolbar } from './components/FormatToolbar'
import './App.css'

const INITIAL_CONTENT = `# Markdown Diagram Editor

Mermaid・PlantUML・Draw.io のダイアグラムをグラフィカルに編集できるエディタです。

## Mermaid の例

\`\`\`mermaid
flowchart LR
    A[編集] --> B[プレビュー]
    B --> C[保存]
\`\`\`

## PlantUML の例

\`\`\`plantuml
@startuml
participant User
participant Editor
participant Preview

User -> Editor : テキスト入力
Editor -> Preview : コンテンツ更新
Preview -> Preview : Kroki API でレンダリング
Preview --> User : ダイアグラム表示
@enduml
\`\`\`

## Draw.io の例

\`\`\`drawio
<mxGraphModel>
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="2" value="フロントエンド" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="80" y="80" width="160" height="60" as="geometry" />
    </mxCell>
    <mxCell id="3" value="バックエンド" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="320" y="80" width="160" height="60" as="geometry" />
    </mxCell>
    <mxCell id="4" edge="1" source="2" target="3" parent="1">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>
\`\`\`

## 通常の Markdown

- **太字**、*斜体*、\`コード\` が使えます
- リストも対応

> blockquote はこのように表示されます
`

interface DrawioEditState {
  xml: string
  blockIndex: number
}

// drawio コードブロックの内容を新しい XML で置換する
function replaceDrawioBlock(content: string, blockIndex: number, newXml: string): string {
  const regex = /```drawio\n([\s\S]*?)```/g
  const matches: { start: number; end: number }[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length })
  }
  const target = matches[blockIndex]
  if (!target) return content
  return (
    content.slice(0, target.start) +
    '```drawio\n' + newXml.trim() + '\n```' +
    content.slice(target.end)
  )
}

function App() {
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [drawioEdit, setDrawioEdit] = useState<DrawioEditState | null>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [splitRatio, setSplitRatio] = useState(0.5)
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('md-editor-theme') as 'dark' | 'light') ?? 'dark'
  )
  const [syncScroll, setSyncScroll] = useState(true)
  const [zoomedSvg, setZoomedSvg] = useState<string | null>(null)
  const editorRef = useRef<EditorHandle>(null)
  const panesRef = useRef<HTMLDivElement>(null)
  const previewPaneRef = useRef<HTMLDivElement>(null)
  const isSyncingRef = useRef(false)
  const syncScrollRef = useRef(syncScroll)
  syncScrollRef.current = syncScroll
  const contentRef = useRef(content)
  contentRef.current = content
  const savedContentRef = useRef(INITIAL_CONTENT)
  const isDirty = content !== savedContentRef.current
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  const handleEditDrawio = useCallback((xml: string, blockIndex: number) => {
    setDrawioEdit({ xml, blockIndex })
  }, [])

  const handleSaveDrawio = useCallback((newXml: string) => {
    if (drawioEdit === null) return
    setContent((prev) => replaceDrawioBlock(prev, drawioEdit.blockIndex, newXml))
  }, [drawioEdit])

  const handleCloseDrawio = useCallback(() => {
    setDrawioEdit(null)
  }, [])

  const handleNew = useCallback(() => {
    if (isDirtyRef.current && !confirm('未保存の変更があります。破棄して新規作成しますか？')) return
    savedContentRef.current = ''
    setContent('')
    setFileHandle(null)
    setFileName(null)
  }, [])

  const handleOpen = useCallback(async () => {
    if (isDirtyRef.current && !confirm('未保存の変更があります。破棄して開きますか？')) return
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown'] } }],
        })
        const file = await handle.getFile()
        const text = await file.text()
        savedContentRef.current = text
        setContent(text)
        setFileHandle(handle)
        setFileName(file.name)
      } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.md,.markdown'
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) return
          const text = await file.text()
          savedContentRef.current = text
          setContent(text)
          setFileName(file.name)
        }
        input.click()
      }
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') console.error(e)
    }
  }, [])

  const handleSave = useCallback(async (forcePickNew = false) => {
    try {
      if (fileHandle && !forcePickNew) {
        const writable = await fileHandle.createWritable()
        await writable.write(contentRef.current)
        await writable.close()
        savedContentRef.current = contentRef.current
      } else if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName ?? 'document.md',
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
        })
        const writable = await handle.createWritable()
        await writable.write(contentRef.current)
        await writable.close()
        savedContentRef.current = contentRef.current
        setFileHandle(handle)
        setFileName((await handle.getFile()).name)
      } else {
        const blob = new Blob([contentRef.current], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName ?? 'document.md'
        a.click()
        URL.revokeObjectURL(url)
        savedContentRef.current = contentRef.current
      }
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') console.error(e)
    }
  }, [fileHandle, fileName])

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
    localStorage.setItem('md-editor-theme', theme)
  }, [theme])

  const handleEditorScroll = useCallback((ratio: number) => {
    if (!syncScrollRef.current || isSyncingRef.current || !previewPaneRef.current) return
    isSyncingRef.current = true
    const el = previewPaneRef.current
    el.scrollTop = ratio * (el.scrollHeight - el.clientHeight)
    requestAnimationFrame(() => requestAnimationFrame(() => { isSyncingRef.current = false }))
  }, [])

  useEffect(() => {
    const el = previewPaneRef.current
    if (!el) return
    const handler = () => {
      if (!syncScrollRef.current || isSyncingRef.current) return
      isSyncingRef.current = true
      const { scrollTop, scrollHeight, clientHeight } = el
      const max = scrollHeight - clientHeight
      if (max > 0) editorRef.current?.scrollToRatio(scrollTop / max)
      requestAnimationFrame(() => requestAnimationFrame(() => { isSyncingRef.current = false }))
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [])

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const onMouseMove = (ev: MouseEvent) => {
      if (!panesRef.current) return
      const rect = panesRef.current.getBoundingClientRect()
      const ratio = (ev.clientX - rect.left) / rect.width
      setSplitRatio(Math.min(0.8, Math.max(0.2, ratio)))
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key === 's') {
        e.preventDefault()
        handleSave(e.shiftKey)
      } else if (e.key === 'o') {
        e.preventDefault()
        handleOpen()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave, handleOpen])

  return (
    <div className="app">
      <div className="toolbar">
        <span className="toolbar-title">
          md-diagram-editor{fileName ? ` — ${fileName}` : ''}{isDirty ? ' *' : ''}
        </span>
        <button className="toolbar-btn" onClick={handleNew}>新規作成</button>
        <button className="toolbar-btn" onClick={handleOpen}>開く</button>
        <button className="toolbar-btn" onClick={() => handleSave(false)}>保存</button>
        <button className="toolbar-btn" onClick={() => handleSave(true)}>名前を付けて保存</button>
        <div className="toolbar-sep" />
        <button
          className={`toolbar-btn${syncScroll ? ' toolbar-btn-active' : ''}`}
          onClick={() => setSyncScroll(v => !v)}
          title="同期スクロール切替"
        >
          同期
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title="テーマ切替"
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
      <div className="panes" ref={panesRef}>
        <div className="editor-pane" style={{ width: `${splitRatio * 100}%` }}>
          <div className="pane-label">Editor</div>
          <FormatToolbar
            onFormat={(action) => editorRef.current?.format(action)}
            onInsert={(text) => editorRef.current?.insertText(text)}
          />
          <Editor
            ref={editorRef}
            value={content}
            onChange={setContent}
            onScroll={handleEditorScroll}
            theme={theme}
          />
        </div>
        <div className="pane-divider" onMouseDown={handleDividerMouseDown} />
        <div className="preview-pane" ref={previewPaneRef}>
          <div className="pane-label" style={{ marginBottom: 16 }}>Preview</div>
          <Preview
            content={content}
            onEditDrawio={handleEditDrawio}
            onZoomDiagram={setZoomedSvg}
          />
        </div>
      </div>

      {drawioEdit !== null && (
        <DrawioModal
          xml={drawioEdit.xml}
          onSave={handleSaveDrawio}
          onClose={handleCloseDrawio}
        />
      )}

      {zoomedSvg !== null && (
        <DiagramZoomModal svg={zoomedSvg} onClose={() => setZoomedSvg(null)} />
      )}
    </div>
  )
}

export default App
