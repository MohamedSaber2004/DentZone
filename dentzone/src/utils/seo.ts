import { locale } from '../i18n'
import { APP_STORE_LINK, CONTACT_PHONE, GOOGLE_PLAY_LINK } from '../config/contact.config'
import { SITE_LOGO_URL, SITE_NAME, SITE_URL } from '../config/site.config'

export type JsonLd = Record<string, unknown>

export interface SeoInput {
  title?: string
  description?: string
  /** Route path used for the canonical URL. Query strings and hashes are ignored. */
  canonicalPath?: string
  image?: string
  type?: 'website' | 'product' | 'article'
  robots?: string
  jsonLd?: JsonLd | JsonLd[]
  productPrice?: { amount: number; currency: string }
}

const JSONLD_ATTR = 'data-dz-seo-jsonld'

const abs = (value: string): string => `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`

export const absoluteUrl = (pathOrUrl?: string): string => {
  const value = (pathOrUrl || '/').trim()
  if (/^https?:\/\//i.test(value)) return value
  return abs(value)
}

const setMeta = (attribute: 'name' | 'property', key: string, content: string): void => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

const removeMeta = (attribute: 'name' | 'property', key: string): void => {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove()
}

const setCanonical = (href: string): void => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

const setJsonLd = (jsonLd?: JsonLd | JsonLd[]): void => {
  document.head.querySelectorAll(`script[${JSONLD_ATTR}]`).forEach((element) => element.remove())
  if (!jsonLd) return

  const entries = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
  if (entries.length === 0) return

  let payload: JsonLd
  if (entries.length === 1) {
    payload = entries[0]!
  } else {
    payload = {
      '@context': 'https://schema.org',
      '@graph': entries.map((entry) => {
        const { '@context': _context, ...rest } = entry
        return rest
      }),
    }
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.setAttribute(JSONLD_ATTR, '')
  script.textContent = JSON.stringify(payload)
  document.head.appendChild(script)
}

const localeTag = (): string => (locale.value === 'ar' ? 'ar_EG' : 'en_US')
const alternateLocaleTag = (): string => (locale.value === 'ar' ? 'en_US' : 'ar_EG')
const language = (): string => (locale.value === 'ar' ? 'ar' : 'en')

export const canonicalPath = (path: string): string => {
  const clean = path.split('#')[0]!.split('?')[0]!
  return clean || '/'
}

/**
 * Applies all document-level SEO tags for the current page.
 * Called by the router on every navigation and by detail views once data loads.
 */
export const applySeo = (input: SeoInput): void => {
  if (typeof document === 'undefined') return

  const title = input.title?.trim()
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  const description = input.description?.trim() || ''
  const canonical = absoluteUrl(canonicalPath(input.canonicalPath ?? window.location.pathname))
  const image = absoluteUrl(input.image || SITE_LOGO_URL)
  const robots = input.robots || 'index, follow'

  document.title = fullTitle
  document.documentElement.lang = language()

  setMeta('name', 'description', description)
  setMeta('name', 'robots', robots)
  const isDark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark'
  setMeta('name', 'theme-color', isDark ? '#0d1821' : '#ffffff')
  setCanonical(canonical)

  setMeta('property', 'og:site_name', SITE_NAME)
  setMeta('property', 'og:type', input.type || 'website')
  setMeta('property', 'og:title', fullTitle)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', canonical)
  setMeta('property', 'og:image', image)
  setMeta('property', 'og:locale', localeTag())
  setMeta('property', 'og:locale:alternate', alternateLocaleTag())

  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', fullTitle)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', image)

  if (input.productPrice) {
    setMeta('property', 'product:price:amount', String(input.productPrice.amount))
    setMeta('property', 'product:price:currency', input.productPrice.currency)
  } else {
    removeMeta('property', 'product:price:amount')
    removeMeta('property', 'product:price:currency')
  }

  setJsonLd(input.jsonLd)
}

export const homeJsonLd = (): JsonLd => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        '@type': 'ImageObject',
        url: SITE_LOGO_URL,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: CONTACT_PHONE.replace(/\s+/g, ''),
        contactType: 'customer service',
        availableLanguage: ['Arabic', 'English'],
      },
      sameAs: [APP_STORE_LINK, GOOGLE_PLAY_LINK],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      inLanguage: language(),
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
})

export const breadcrumbJsonLd = (items: Array<{ name: string; path: string }>): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
})
