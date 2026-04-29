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
  onZoomDiagram?: (svg: string) => void
}

function errorElement(label: string, e: unknown): HTMLElement {
  const el = document.createElement('div')
  el.className = 'diagram-error'
  const msg = e instanceof Error ? e.message : String(e)
  el.innerHTML = `<span class="diagram-error-label">${label}</span><pre class="diagram-error-msg">${escapeHtml(msg)}</pre>`
  return el
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function renderMermaid(
  block: Element,
  index: number,
  onZoom: ((svg: string) => void) | undefined,
) {
  const pre = block.parentElement
  if (!pre) return
  const code = block.textContent ?? ''
  const id = `mermaid-${Date.now()}-${index}`
  try {
    const { svg } = await mermaid.render(id, code)
    document.getElementById(id)?.remove()
    const wrapper = document.createElement('div')
    wrapper.className = 'mermaid-diagram'
    wrapper.innerHTML = svg
    if (onZoom) {
      wrapper.title = 'クリックで拡大'
      wrapper.onclick = () => onZoom(svg)
    }
    pre.replaceWith(wrapper)
  } catch (e) {
    document.getElementById(id)?.remove()
    pre.replaceWith(errorElement('Mermaid エラー', e))
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
    pre.replaceWith(wrapper)
  } catch (e) {
    pre.replaceWith(errorElement('PlantUML エラー', e))
  }
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

export function Preview({ content, onEditDrawio, onZoomDiagram }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onEditDrawioRef = useRef(onEditDrawio)
  onEditDrawioRef.current = onEditDrawio
  const onZoomDiagramRef = useRef(onZoomDiagram)
  onZoomDiagramRef.current = onZoomDiagram

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = md.render(content)
    const container = containerRef.current

    container.querySelectorAll('code.language-mermaid').forEach(
      (block, i) => renderMermaid(block, i, onZoomDiagramRef.current)
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
