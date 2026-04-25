import { useState, useCallback } from 'react'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'
import { DrawioModal } from './components/DrawioModal'
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
          <Preview content={content} onEditDrawio={handleEditDrawio} />
        </div>
      </div>

      {drawioEdit !== null && (
        <DrawioModal
          xml={drawioEdit.xml}
          onSave={handleSaveDrawio}
          onClose={handleCloseDrawio}
        />
      )}
    </div>
  )
}

export default App
