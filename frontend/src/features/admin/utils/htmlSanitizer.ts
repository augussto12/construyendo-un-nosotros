const allowedTags = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'H2',
  'H3',
  'H4',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'A',
  'SPAN',
])

const allowedAttributes = new Set(['href', 'title', 'target', 'rel'])

function isSafeUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin)
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:'
  } catch {
    return false
  }
}

function cleanElement(element: Element) {
  if (!allowedTags.has(element.tagName)) {
    element.replaceWith(...Array.from(element.childNodes))
    return
  }

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase()
    const value = attribute.value

    if (element.tagName !== 'A' && (name === 'href' || name === 'target' || name === 'rel')) {
      element.removeAttribute(attribute.name)
      return
    }

    if (name.startsWith('on') || name === 'style' || !allowedAttributes.has(name)) {
      element.removeAttribute(attribute.name)
      return
    }

    if (name === 'href' && !isSafeUrl(value)) {
      element.removeAttribute(attribute.name)
    }
  })

  if (element.tagName === 'A' && element.getAttribute('href')) {
    element.setAttribute('rel', 'noreferrer')
    element.setAttribute('target', '_blank')
  }
}

export function sanitizeBasicHtml(html: string) {
  if (!html.trim() || typeof window === 'undefined') {
    return ''
  }

  const document = new DOMParser().parseFromString(html, 'text/html')

  document.body.querySelectorAll('script, iframe, object, embed, style').forEach((node) => {
    node.remove()
  })

  Array.from(document.body.querySelectorAll('*')).forEach(cleanElement)

  return document.body.innerHTML.trim()
}

export function hasUnsafeHtml(value: string) {
  return /<\s*script/i.test(value)
    || /<\s*iframe/i.test(value)
    || /\son[a-z]+\s*=/i.test(value)
    || /javascript\s*:/i.test(value)
    || /\sstyle\s*=/i.test(value)
}
