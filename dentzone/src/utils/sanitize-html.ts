export const sanitizePolicyHtml = (rawHtml: string): string => {
  if (!rawHtml) return ''

  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(rawHtml, 'text/html')

      // Remove executable script elements and object/embed tags
      const dangerousTags = doc.querySelectorAll('script, object, embed, iframe, applet')
      dangerousTags.forEach((el) => el.remove())

      // Remove inline event handlers (onclick, onload, onerror, etc.) and javascript: links
      const allElements = doc.querySelectorAll('*')
      allElements.forEach((el) => {
        const attributes = Array.from(el.attributes)
        for (const attr of attributes) {
          const name = attr.name.toLowerCase()
          if (name.startsWith('on')) {
            el.removeAttribute(attr.name)
          } else if ((name === 'href' || name === 'src') && attr.value.trim().toLowerCase().startsWith('javascript:')) {
            el.setAttribute(attr.name, '#')
          }
        }
      })

      return doc.documentElement.outerHTML
    } catch {
      // Fallback to regex if DOMParser encounters an unexpected issue
    }
  }

  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
    .replace(/<\/?(object|embed|applet)\b[^>]*>/gi, '')
}
