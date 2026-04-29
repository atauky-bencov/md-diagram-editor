import { useEffect } from 'react'
import './DiagramZoomModal.css'

interface DiagramZoomModalProps {
  svg: string
  onClose: () => void
}

export function DiagramZoomModal({ svg, onClose }: DiagramZoomModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="zoom-backdrop" onClick={onClose}>
      <div
        className="zoom-content"
        onClick={(e) => e.stopPropagation()}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
