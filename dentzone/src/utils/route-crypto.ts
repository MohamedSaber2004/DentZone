/**
 * Route Crypto & Obfuscation Service
 * Protects sensitive backend IDs (product IDs, vendor/inventory user IDs, category IDs)
 * from being exposed directly in URLs by encrypting them with a URL-safe, tamper-resistant cipher.
 */

const SECRET_KEY = 'DentZone$Secure#Route@Key!2026'
const PREFIX = 'dze_'

function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

function bytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder()
  return decoder.decode(bytes)
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function generateKeystream(key: string, salt: number, length: number): Uint8Array {
  const stream = new Uint8Array(length)
  let state = (salt ^ 0x5a) >>> 0
  for (let i = 0; i < length; i++) {
    const keyChar = key.charCodeAt(i % key.length)
    state = ((state * 1664525 + 1013904223 + keyChar + i) >>> 0)
    stream[i] = (state >>> 16) & 0xff
  }
  return stream
}

function computeChecksum(bytes: Uint8Array): number {
  let sum = 0xaa
  for (let i = 0; i < bytes.length; i++) {
    sum = (sum ^ bytes[i]!) & 0xff
  }
  return sum
}

/**
 * Encrypts a sensitive ID into a URL-safe encrypted token.
 * If the input is already encrypted or empty, it handles it safely.
 */
export function encryptId(id: string | number | null | undefined): string {
  if (id === null || id === undefined) return ''
  const strId = String(id).trim()
  if (!strId) return ''
  if (strId === 'default') return 'default'
  if (strId.startsWith(PREFIX)) return strId // Already encrypted

  try {
    const rawBytes = stringToBytes(strId)
    const salt = Math.floor(Math.random() * 256)
    const checksum = computeChecksum(rawBytes)
    const keystream = generateKeystream(SECRET_KEY, salt, rawBytes.length)

    const cipherBytes = new Uint8Array(rawBytes.length)
    for (let i = 0; i < rawBytes.length; i++) {
      cipherBytes[i] = (rawBytes[i]! ^ keystream[i]!) & 0xff
    }

    // Packed payload: [salt (1 byte), checksum (1 byte), ...cipherBytes]
    const packed = new Uint8Array(2 + cipherBytes.length)
    packed[0] = salt
    packed[1] = checksum
    packed.set(cipherBytes, 2)

    return `${PREFIX}${bytesToBase64Url(packed)}`
  } catch {
    return strId
  }
}

/**
 * Decrypts an encrypted token back to the original ID.
 * If the input is not encrypted or decryption fails, returns the string as-is (backward compatible).
 */
export function decryptId(encrypted: string | null | undefined): string {
  if (encrypted === null || encrypted === undefined) return ''
  const str = String(encrypted).trim()
  if (!str) return ''
  if (str === 'default') return 'default'
  if (!str.startsWith(PREFIX)) return str // Plain ID fallback

  try {
    const payloadStr = str.slice(PREFIX.length)
    const packed = base64UrlToBytes(payloadStr)
    if (packed.length < 3) return str

    const salt = packed[0]!
    const expectedChecksum = packed[1]!
    const cipherBytes = packed.slice(2)

    const keystream = generateKeystream(SECRET_KEY, salt, cipherBytes.length)
    const rawBytes = new Uint8Array(cipherBytes.length)
    for (let i = 0; i < cipherBytes.length; i++) {
      rawBytes[i] = (cipherBytes[i]! ^ keystream[i]!) & 0xff
    }

    const calculatedChecksum = computeChecksum(rawBytes)
    if (calculatedChecksum !== expectedChecksum) {
      return str // Checksum mismatch, return fallback
    }

    return bytesToString(rawBytes)
  } catch {
    return str
  }
}

/**
 * Route URL Builders that automatically encrypt all sensitive IDs
 */
export function productRoute(productId: string | number, inventoryUserId?: string | null, query?: Record<string, any>) {
  return {
    name: 'product-details',
    params: {
      inventoryUserId: inventoryUserId ? encryptId(inventoryUserId) : 'default',
      productId: encryptId(productId),
    },
    query: {
      ...query,
      cat: query?.cat ? encryptId(query.cat) : undefined,
    },
  }
}

export function categoryRoute(catId: string | number, query?: Record<string, any>) {
  return {
    name: 'category-inventories',
    params: {
      catId: encryptId(catId),
    },
    query,
  }
}

export function inventoryRoute(inventoryUserId: string | number, query?: Record<string, any>) {
  return {
    name: 'inventory-products',
    params: {
      inventoryUserId: encryptId(inventoryUserId),
    },
    query: {
      ...query,
      cat: query?.cat ? encryptId(query.cat) : undefined,
    },
  }
}
