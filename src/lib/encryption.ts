/**
 * AES-256-GCM encryption utilities for BYOK API key storage.
 *
 * Keys are encrypted before writing to the database and decrypted
 * only in memory at the moment of making an API call.
 *
 * Uses ENCRYPTION_KEY env var (64-char hex string = 32 bytes).
 * Generate with: openssl rand -hex 32
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error(
            "ENCRYPTION_KEY environment variable is not set. " +
            "Generate one with: openssl rand -hex 32"
        );
    }
    if (key.length !== 64) {
        throw new Error(
            "ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
            "Generate with: openssl rand -hex 32"
        );
    }
    return Buffer.from(key, "hex");
}

/**
 * Encrypt a plaintext string (e.g., an API key).
 * Returns a base64 string in the format: iv:authTag:ciphertext
 */
export function encryptApiKey(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:ciphertext (all base64)
    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted,
    ].join(":");
}

/**
 * Decrypt an encrypted string back to plaintext.
 * Expects input in the format: iv:authTag:ciphertext (all base64)
 */
export function decryptApiKey(encrypted: string): string {
    const key = getEncryptionKey();
    const parts = encrypted.split(":");

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
    }

    const [ivBase64, authTagBase64, ciphertext] = parts;
    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
