import pako from 'pako'

// Kroki API の GET エンドポイント用エンコード: deflate → base64url
export function krokiUrl(diagramType: string, source: string): string {
  const data = new TextEncoder().encode(source)
  const compressed = pako.deflate(data)
  const base64 = btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `https://kroki.io/${diagramType}/svg/${base64}`
}
