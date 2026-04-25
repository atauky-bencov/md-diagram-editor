import { useEffect, useRef } from 'react'
import MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'
import { krokiUrl } from '../utils/kroki'
import './Preview.css'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

mermaid.initialize({ startOnLoad: false, theme: 'dark' })

interface PreviewProps {
  content: string
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
    const svg = await res.text()
    wrapper.innerHTML = svg
  } catch (e) {
    wrapper.className = 'diagram-error'
    wrapper.textContent = `PlantUML error: ${e}`
  }

  pre.replaceWith(wrapper)
}

export function Preview({ content }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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
  }, [content])

  return <div ref={containerRef} className="preview-content" />
}
