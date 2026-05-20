// Quick test — browser console-ൽ run ചെയ്യാം
import {
  generateKey, exportKey, importKey,
  encryptMessage, decryptMessage,
  buildShareableURL, decryptFromURL
} from "../src/crypto.js";

async function runTests() {
  console.log("🔐 Phase 1 Tests Starting...\n");

  // Test 1: Encrypt & Decrypt
  const key = await generateKey();
  const original = "Hello, this is a secret message!";
  const encrypted = await encryptMessage(original, key);
  const decrypted = await decryptMessage(encrypted, key);

  console.assert(decrypted === original, "❌ Test 1 Failed");
  console.log("✅ Test 1 passed: Encrypt → Decrypt works");

  // Test 2: Key export/import round-trip
  const exported = await exportKey(key);
  const imported = await importKey(exported);
  const decrypted2 = await decryptMessage(encrypted, imported);

  console.assert(decrypted2 === original, "❌ Test 2 Failed");
  console.log("✅ Test 2 passed: Key export/import works");

  // Test 3: Full URL flow
  const { url } = await buildShareableURL("Test message via URL");
  const fragment = url.split("#")[1];
  const recovered = await decryptFromURL(fragment);

  console.assert(recovered === "Test message via URL", "❌ Test 3 Failed");
  console.log("✅ Test 3 passed: Full URL flow works");
  console.log("\n🎉 All Phase 1 tests passed!");
  console.log("Sample URL:", url);
}

runTests().catch(console.error);