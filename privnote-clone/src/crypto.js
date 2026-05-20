// crypto.js - Phase 1: Core Encryption Engine
// Uses Web Crypto API (browser built-in) — zero dependencies, zero servers

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

// ─── Key Generation ────────────────────────────────────────────────
export async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH },
    true,        // extractable — we need to export it for the URL
    ["encrypt", "decrypt"]
  );
}

// CryptoKey → base64url string (goes into the URL fragment)
export async function exportKey(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64url(raw);
}

// base64url string → CryptoKey (when receiver opens the link)
export async function importKey(base64urlKey) {
  const raw = base64urlToBuffer(base64urlKey);
  return await crypto.subtle.importKey(
    "raw", raw,
    { name: ALGO },
    false,
    ["decrypt"]
  );
}

// ─── Encrypt ───────────────────────────────────────────────────────
export async function encryptMessage(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  // Pack IV + ciphertext together → single base64url string
  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength);

  return bufferToBase64url(combined);
}

// ─── Decrypt ───────────────────────────────────────────────────────
export async function decryptMessage(encryptedData, key) {
  const combined = base64urlToBuffer(encryptedData);

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// ─── URL Builder ───────────────────────────────────────────────────
// Format: https://yoursite.com/#<base64urlKey>:<base64urlCiphertext>
// The # means the fragment NEVER reaches the server. Pure client-side.

export async function buildShareableURL(plaintext) {
  const key = await generateKey();
  const exportedKey = await exportKey(key);
  const encryptedData = await encryptMessage(plaintext, key);

  const fragment = `${exportedKey}:${encryptedData}`;
  return {
    url: `${window.location.origin}/#${fragment}`,
    key: exportedKey,       // for debugging only
    data: encryptedData     // for debugging only
  };
}

export async function decryptFromURL(fragment) {
  const [keyPart, dataPart] = fragment.split(":");
  if (!keyPart || !dataPart) throw new Error("Invalid link format");

  const key = await importKey(keyPart);
  return await decryptMessage(dataPart, key);
}

// ─── Helpers ───────────────────────────────────────────────────────
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlToBuffer(base64url) {
  const base64 = base64url
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}