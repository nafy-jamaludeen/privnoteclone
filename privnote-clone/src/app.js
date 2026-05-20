import { buildShareableURL, decryptFromURL } from "./crypto.js";

const senderView = document.getElementById("app-sender");
const receiverView = document.getElementById("app-receiver");
const messageInput = document.getElementById("message-input");
const charCount = document.getElementById("char-count");
const encryptBtn = document.getElementById("encrypt-btn");
const resultBox = document.getElementById("result-box");
const linkPreview = document.getElementById("link-preview");
const copyAgainBtn = document.getElementById("copy-again-btn");
const sendOwnBtn = document.getElementById("send-own-btn");
const decryptedBox = document.getElementById("decrypted-box");

// ── Detect: sender or receiver? ──────────────────────────────────
const fragment = window.location.hash.slice(1); // remove #

if (fragment && fragment.includes(":")) {
  // Receiver mode — there's an encrypted payload in the URL
  showReceiverView();
  decryptAndShow(fragment);
} else {
  // Sender mode
  senderView.classList.remove("hidden");
}

// ── Sender logic ─────────────────────────────────────────────────
messageInput.addEventListener("input", () => {
  charCount.textContent = messageInput.value.length;
});

encryptBtn.addEventListener("click", async () => {
  const msg = messageInput.value.trim();
  if (!msg) {
    messageInput.focus();
    return;
  }

  encryptBtn.textContent = "⏳ Encrypting...";
  encryptBtn.disabled = true;

  try {
    const { url } = await buildShareableURL(msg);

    // Copy to clipboard
    await navigator.clipboard.writeText(url);

    // Show result
    linkPreview.textContent = url;
    resultBox.classList.remove("hidden");

    encryptBtn.textContent = "✅ Encrypted & Copied!";
    setTimeout(() => {
      encryptBtn.textContent = "🔒 Encrypt & Copy Link";
      encryptBtn.disabled = false;
    }, 2000);

  } catch (err) {
    encryptBtn.textContent = "❌ Error — Try Again";
    encryptBtn.disabled = false;
    console.error(err);
  }
});

copyAgainBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(linkPreview.textContent);
  copyAgainBtn.textContent = "✅ Copied!";
  setTimeout(() => { copyAgainBtn.textContent = "Copy Again"; }, 1500);
});

// ── Receiver logic ───────────────────────────────────────────────
function showReceiverView() {
  senderView.classList.add("hidden");
  receiverView.classList.remove("hidden");
}

async function decryptAndShow(fragment) {
  try {
    const message = await decryptFromURL(fragment);
    decryptedBox.innerHTML = `<span style="white-space:pre-wrap">${escapeHtml(message)}</span>`;
  } catch (err) {
    decryptedBox.innerHTML = `<span class="error-msg">❌ Could not decrypt.<br>Link may be broken or tampered.</span>`;
  }
}

sendOwnBtn.addEventListener("click", () => {
  window.location.href = window.location.origin + window.location.pathname;
});

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}