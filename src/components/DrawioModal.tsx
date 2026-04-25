import { useEffect, useRef } from 'react'
import './DrawioModal.css'

const EMBED_URL = 'https://embed.diagrams.net/?embed=1&proto=json&spin=1&dark=1'
const EMBED_ORIGIN = 'https://embed.diagrams.net'

const EMPTY_XML =
  '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'

interface DrawioModalProps {
  xml: string
  onSave: (xml: string) => void
  onClose: () => void
}

type EmbedMessage =
  | { event: 'init' }
  | { event: 'save'; xml: string }
  | { event: 'exit' }
  | { event: 'load' }

export function DrawioModal({ xml, onSave, onClose }: DrawioModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const send = (data: object) => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify(data),
        EMBED_ORIGIN
      )
    }

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== EMBED_ORIGIN) return
      let msg: EmbedMessage
      try {
        msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return
      }

      if (msg.event === 'init') {
        send({ action: 'load', xml: xml || EMPTY_XML })
      } else if (msg.event === 'save') {
        onSave(msg.xml)
        onClose()
      } else if (msg.event === 'exit') {
        onClose()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [xml, onSave, onClose])

  return (
    <div className="drawio-overlay" onClick={onClose}>
      <div className="drawio-modal" onClick={(e) => e.stopPropagation()}>
        <iframe
          ref={iframeRef}
          src={EMBED_URL}
          className="drawio-iframe"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  )
}
