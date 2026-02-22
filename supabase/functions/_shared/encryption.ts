/**
 * AES-256-GCM encryption/decryption using Web Crypto API (Deno).
 * Master key is stored as ENCRYPTION_MASTER_KEY env var (32-byte base64).
 */

let cachedKey: CryptoKey | null = null

async function getMasterKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey

  const keyBase64 = Deno.env.get('ENCRYPTION_MASTER_KEY')
  if (!keyBase64) throw new Error('ENCRYPTION_MASTER_KEY not set')

  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0))
  if (keyBytes.length !== 32) throw new Error('ENCRYPTION_MASTER_KEY must be 32 bytes')

  cachedKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  )
  return cachedKey
}

export interface EncryptedData {
  encrypted: string // base64 ciphertext
  iv: string // base64 IV
  authTag: string // base64 auth tag
  hint: string // last 4 chars of plaintext
}

export async function encryptSecret(plaintext: string): Promise<EncryptedData> {
  const key = await getMasterKey()

  // 12-byte random IV (recommended for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encoded = new TextEncoder().encode(plaintext)
  const ciphertextWithTag = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, encoded),
  )

  // GCM appends 16-byte auth tag to ciphertext
  const ciphertext = ciphertextWithTag.slice(0, -16)
  const authTag = ciphertextWithTag.slice(-16)

  return {
    encrypted: btoa(String.fromCharCode(...ciphertext)),
    iv: btoa(String.fromCharCode(...iv)),
    authTag: btoa(String.fromCharCode(...authTag)),
    hint: plaintext.slice(-4),
  }
}

export async function decryptSecret(
  encryptedBase64: string,
  ivBase64: string,
  authTagBase64: string,
): Promise<string> {
  const key = await getMasterKey()

  const ciphertext = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0))
  const authTag = Uint8Array.from(atob(authTagBase64), (c) => c.charCodeAt(0))

  // Reconstruct ciphertext+tag for GCM
  const combined = new Uint8Array(ciphertext.length + authTag.length)
  combined.set(ciphertext)
  combined.set(authTag, ciphertext.length)

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    combined,
  )

  return new TextDecoder().decode(decrypted)
}
