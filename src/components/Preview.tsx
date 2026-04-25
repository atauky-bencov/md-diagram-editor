import { useEffect, useRef } from 'react'
import MarkdownIt from 'markdown-it'
import mermaid from 'mermaid'
import './Preview.css'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

mermaid.initialize({ startOnLoad: false, theme: 'dark' })

interface PreviewProps {
  content: string
}

export function Preview({ content }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    containerRef.current.innerHTML = md.render(content)

    // mermaidブロックを検出してレンダリング
    const mermaidBlocks = containerRef.current.querySelectorAll('code.language-mermaid')
    mermaidBlocks.forEach(async (block, i) => {
      const pre = block.parentElement
      if (!pre) return
      const code = block.textContent ?? ''
      const id = `mermaid-${Date.now()}-${i}`
      try {
        const { svg } = await mermaid.render(id, code)
        const wrapper = document.createElement('div')
        wrapper.className = 'mermaid-diagram'
        wrapper.innerHTML = svg
        pre.replaceWith(wrapper)
      } catch (e) {
        const err = document.createElement('pre')
        err.className = 'mermaid-error'
        err.textContent = `Mermaid error: ${e}`
        pre.replaceWith(err)
      }
    })
  }, [content])

  return <div ref={containerRef} className="preview-content" />
}
