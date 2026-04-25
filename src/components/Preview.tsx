import { useEffect, useRef } from 'react'
import MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'
import { krokiUrl } from '../utils/kroki'
import './Preview.css'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

mermaid.initialize({ startOnLoad: false, theme: 'dark' })

interface PreviewProps {
  content: string
  onEditDrawio: (xml: string, blockIndex: number) => void
}

async function renderMermaid(block: Element, index: number) {
  const pre = block.parentElement
  if (!pre) return
  const code = block.textContent ?? ''
  const id = `mermaid-${Date.now()}-${index}`
  try {
    const { svg } = await mermaid.render(id, code)
    const wrapper = document.createElement('div')
    wrapper.className = 'mermaid-diagram'
    wrapper.innerHTML = svg
    pre.replaceWith(wrapper)
  } catch (e) {
    const err = document.createElement('pre')
    err.className = 'diagram-error'
    err.textContent = `Mermaid error: ${e}`
    pre.replaceWith(err)
  }
}

async function renderPlantuml(block: Element) {
  const pre = block.parentElement
  if (!pre) return
  const code = block.textContent ?? ''
  const url = krokiUrl('plantuml', code)
  const wrapper = document.createElement('div')
  wrapper.className = 'plantuml-diagram'
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    wrapper.innerHTML = await res.text()
  } catch (e) {
    wrapper.className = 'diagram-error'
    wrapper.textContent = `PlantUML error: ${e}`
  }
  pre.replaceWith(wrapper)
}

function renderDrawio(
  block: Element,
  blockIndex: number,
  onEdit: (xml: string, index: number) => void
) {
  const pre = block.parentElement
  if (!pre) return
  const xml = block.textContent?.trim() ?? ''

  const wrapper = document.createElement('div')
  wrapper.className = 'drawio-wrapper'

  // ダイアグラムプレビュー領域
  const preview = document.createElement('div')
  preview.className = 'drawio-preview'
  if (xml) {
    // XML の最初の value 属性を数えてノード数を表示
    const nodeCount = (xml.match(/vertex="1"/g) ?? []).length
    const edgeCount = (xml.match(/edge="1"/g) ?? []).length
    preview.innerHTML = `<span class="drawio-stats">${nodeCount} ノード / ${edgeCount} エッジ</span>`
  } else {
    preview.textContent = '空のダイアグラム'
  }

  const editBtn = document.createElement('button')
  editBtn.className = 'drawio-edit-btn'
  editBtn.textContent = 'Edit with Draw.io'
  editBtn.onclick = () => onEdit(xml, blockIndex)

  wrapper.appendChild(preview)
  wrapper.appendChild(editBtn)
  pre.replaceWith(wrapper)
}

export function Preview({ content, onEditDrawio }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // useEffect のクロージャに最新コールバックを渡すため ref で保持
  const onEditDrawioRef = useRef(onEditDrawio)
  onEditDrawioRef.current = onEditDrawio

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = md.render(content)
    const container = containerRef.current

    container.querySelectorAll('code.language-mermaid').forEach(
      (block, i) => renderMermaid(block, i)
    )
    container.querySelectorAll('code.language-plantuml').forEach(
      (block) => renderPlantuml(block)
    )
    container.querySelectorAll('code.language-drawio').forEach(
      (block, i) => renderDrawio(block, i, (xml, idx) => onEditDrawioRef.current(xml, idx))
    )
  }, [content])

  return <div ref={containerRef} className="preview-content" />
}
