import { useState } from 'react'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import './App.css'

const INITIAL_CONTENT = `# Markdown Diagram Editor

Mermaid・PlantUML・Draw.io のダイアグラムをグラフィカルに編集できるエディタです。

## Mermaid の例

\`\`\`mermaid
flowchart LR
    A[編集] --> B[プレビュー]
    B --> C[保存]
\`\`\`

## 通常の Markdown

- **太字**、*斜体*、\`コード\` が使えます
- リストも対応

> blockquote はこのように表示されます
`

function App() {
  const [content, setContent] = useState(INITIAL_CONTENT)

  return (
    <div className="app">
      <div className="toolbar">
        <span className="toolbar-title">md-diagram-editor</span>
        <button className="toolbar-btn">開く</button>
        <button className="toolbar-btn">保存</button>
      </div>
      <div className="panes">
        <div className="editor-pane">
          <div className="pane-label">Editor</div>
          <Editor value={content} onChange={setContent} />
        </div>
        <div className="preview-pane">
          <div className="pane-label" style={{ marginBottom: 16 }}>Preview</div>
          <Preview content={content} />
        </div>
      </div>
    </div>
  )
}

export default App
