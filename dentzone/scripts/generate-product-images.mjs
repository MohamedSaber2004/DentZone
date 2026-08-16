import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT_DIR = resolve('public/products')

const products = [
  { id: 'p-001', tint: '#0ea5e9', shape: 'toothbrush' },
  { id: 'p-002', tint: '#f59e0b', shape: 'whitening' },
  { id: 'p-003', tint: '#10b981', shape: 'toothpaste' },
  { id: 'p-004', tint: '#06b6d4', shape: 'mouthwash' },
  { id: 'p-005', tint: '#8b5cf6', shape: 'floss' },
  { id: 'p-006', tint: '#7c3aed', shape: 'floss' },
  { id: 'p-007', tint: '#0284c7', shape: 'toothbrush' },
  { id: 'p-008', tint: '#f472b6', shape: 'toothpaste' },
  { id: 'p-009', tint: '#14b8a6', shape: 'mouthwash' },
  { id: 'p-010', tint: '#3b82f6', shape: 'toothpaste' },
  { id: 'p-011', tint: '#ef4444', shape: 'scraper' },
  { id: 'p-012', tint: '#0d9488', shape: 'floss' },
  { id: 'p-013', tint: '#fbbf24', shape: 'whitening' },
  { id: 'p-014', tint: '#f97316', shape: 'case' },
  { id: 'p-015', tint: '#475569', shape: 'toothpaste' },
  { id: 'p-016', tint: '#ec4899', shape: 'case' },
]

const clamp = (value) => Math.min(255, Math.max(0, value))

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
}

const toHex = (rgb) => `#${rgb.map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('')}`

const shade = (hex, amount) => {
  const rgb = hexToRgb(hex)
  const factor = amount < 0 ? 1 + amount : 1 - amount
  const result = amount < 0 ? rgb.map((v) => v * factor) : rgb.map((v) => v + (255 - v) * amount)
  return toHex(result)
}

const lighten = (hex, amount) => shade(hex, amount)
const darken = (hex, amount) => shade(hex, -amount)

const shapes = {
  toothbrush: (tint) => `
  <g transform="rotate(35 200 200)">
    <rect x="150" y="96" width="100" height="250" rx="34" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="164" y="268" width="72" height="12" rx="6" fill="${darken(tint, 0.15)}" opacity="0.85"/>
    <rect x="166" y="54" width="68" height="82" rx="22" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <g fill="#ffffff">
      <rect x="174" y="26" width="9" height="38" rx="4.5"/>
      <rect x="188" y="20" width="9" height="44" rx="4.5"/>
      <rect x="202" y="18" width="9" height="46" rx="4.5"/>
      <rect x="216" y="20" width="9" height="44" rx="4.5"/>
      <rect x="230" y="26" width="9" height="38" rx="4.5"/>
    </g>
  </g>`,
  toothpaste: (tint) => `
  <g>
    <rect x="152" y="148" width="96" height="168" rx="28" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="152" y="222" width="96" height="42" rx="12" fill="${darken(tint, 0.1)}" opacity="0.22"/>
    <rect x="150" y="150" width="96" height="34" rx="16" fill="#ffffff" opacity="0.7"/>
    <rect x="192" y="96" width="16" height="56" rx="7" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="172" y="236" width="56" height="16" rx="8" fill="${darken(tint, 0.15)}" opacity="0.5"/>
    <path d="M160 308 q40 12 80 0" fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>
  </g>`,
  mouthwash: (tint) => `
  <g>
    <rect x="122" y="204" width="156" height="126" rx="24" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <path d="M138 204 q62 -30 124 0 z" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="180" y="118" width="40" height="70" rx="12" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="170" y="84" width="60" height="42" rx="12" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="134" y="258" width="132" height="58" rx="14" fill="${darken(tint, 0.12)}" opacity="0.28"/>
    <rect x="126" y="258" width="148" height="56" rx="14" fill="${tint}" opacity="0.35"/>
  </g>`,
  floss: (tint) => `
  <g>
    <rect x="138" y="128" width="124" height="152" rx="26" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <g stroke="${darken(tint, 0.12)}" opacity="0.3" stroke-width="11">
      <path d="M160 156 q40 10 80 0"/>
      <path d="M160 196 q40 10 80 0"/>
      <path d="M160 236 q40 10 80 0"/>
    </g>
    <circle cx="200" cy="204" r="30" fill="${tint}" opacity="0.35"/>
    <circle cx="200" cy="204" r="30" fill="none" stroke="${darken(tint, 0.2)}" stroke-width="3" opacity="0.4"/>
    <path d="M138 204 C 92 168, 56 256, 84 306" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
  </g>`,
  whitening: (tint) => `
  <g transform="rotate(-28 200 200)">
    <rect x="160" y="108" width="48" height="206" rx="24" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="176" y="66" width="16" height="50" rx="8" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="160" y="250" width="48" height="16" rx="8" fill="${darken(tint, 0.15)}" opacity="0.55"/>
  </g>
  <g fill="#ffffff">
    <path d="M316 96 l7 18 18 7 -18 7 -7 18 -7 -18 -18 -7 18 -7 z"/>
    <path d="M92 150 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5 z"/>
    <path d="M322 240 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z"/>
  </g>`,
  scraper: (tint) => `
  <g transform="rotate(-25 200 200)">
    <rect x="156" y="110" width="40" height="150" rx="20" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <path d="M148 140 q34 -44 78 0" fill="none" stroke="url(#body)" stroke-width="22" stroke-linecap="round"/>
    <path d="M148 140 q34 -44 78 0" fill="none" stroke="#cbd5e1" stroke-width="22" stroke-linecap="round" opacity="0.6"/>
    <rect x="156" y="214" width="40" height="12" rx="6" fill="${darken(tint, 0.15)}" opacity="0.5"/>
  </g>`,
  case: (tint) => `
  <g>
    <rect x="108" y="142" width="184" height="150" rx="28" fill="url(#body)" stroke="#cbd5e1" stroke-width="3"/>
    <path d="M108 216 q92 -26 184 0" fill="none" stroke="${darken(tint, 0.15)}" stroke-width="8" opacity="0.45"/>
    <path d="M168 142 v-20 a32 32 0 0 1 64 0 v20" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>
    <circle cx="200" cy="216" r="13" fill="${tint}" opacity="0.4"/>
    <circle cx="200" cy="216" r="13" fill="none" stroke="${darken(tint, 0.2)}" stroke-width="3" opacity="0.45"/>
  </g>`,
}

const buildSvg = (tint, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${lighten(tint, 0.42)}"/>
      <stop offset="1" stop-color="${darken(tint, 0.12)}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.32" cy="0.22" r="0.95">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.97"/>
      <stop offset="1" stop-color="#f1f5f9" stop-opacity="0.97"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect width="400" height="400" fill="url(#glow)"/>
  <ellipse cx="200" cy="332" rx="128" ry="20" fill="#0f172a" opacity="0.10"/>
  ${body}
</svg>
`

mkdirSync(OUT_DIR, { recursive: true })

for (const product of products) {
  const render = shapes[product.shape]
  if (!render) {
    console.error(`Unknown shape: ${product.shape} for ${product.id}`)
    process.exit(1)
  }
  const file = resolve(OUT_DIR, `${product.id}.svg`)
  writeFileSync(file, buildSvg(product.tint, render(product.tint)))
  console.log(`Generated ${product.id}.svg (${product.shape})`)
}

console.log(`\nDone — ${products.length} product images written to ${OUT_DIR}`)