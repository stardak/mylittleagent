import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptApiKey, decryptApiKey } from "../encryption";

const VALID_KEY = "a".repeat(64); // 64 hex chars = 32 bytes

function withEncryptionKey(key: string | undefined) {
    const orig = process.env.ENCRYPTION_KEY;
    if (key === undefined) {
        delete process.env.ENCRYPTION_KEY;
    } else {
        process.env.ENCRYPTION_KEY = key;
    }
    return () => {
        if (orig === undefined) delete process.env.ENCRYPTION_KEY;
        else process.env.ENCRYPTION_KEY = orig;
    };
}

describe("encryptApiKey / decryptApiKey", () => {
    let restore: () => void;

    beforeEach(() => {
        restore = withEncryptionKey(VALID_KEY);
    });

    afterEach(() => {
        restore();
    });

    it("round-trips a plaintext string", () => {
        const original = "sk-ant-my-secret-api-key-12345";
        const encrypted = encryptApiKey(original);
        const decrypted = decryptApiKey(encrypted);
        expect(decrypted).toBe(original);
    });

    it("produces different ciphertexts for the same plaintext (random IV)", () => {
        const plaintext = "sk-ant-same-key";
        const first = encryptApiKey(plaintext);
        const second = encryptApiKey(plaintext);
        expect(first).not.toBe(second);
    });

    it("encrypted output has three colon-separated parts (iv:authTag:ciphertext)", () => {
        const encrypted = encryptApiKey("test-value");
        expect(encrypted.split(":")).toHaveLength(3);
    });

    it("throws on malformed input (wrong number of parts)", () => {
        expect(() => decryptApiKey("not-valid-format")).toThrow(
            "Invalid encrypted data format"
        );
    });

    it("throws when ENCRYPTION_KEY is not set", () => {
        restore();
        restore = withEncryptionKey(undefined);
        expect(() => encryptApiKey("anything")).toThrow(
            "ENCRYPTION_KEY environment variable is not set"
        );
    });

    it("throws when ENCRYPTION_KEY is wrong length", () => {
        restore();
        restore = withEncryptionKey("tooshort");
        expect(() => encryptApiKey("anything")).toThrow(
            "ENCRYPTION_KEY must be a 64-character hex string"
        );
    });

    it("throws on tampered ciphertext (auth tag mismatch)", () => {
        const encrypted = encryptApiKey("original-value");
        const parts = encrypted.split(":");
        // Corrupt the ciphertext portion
        parts[2] = parts[2].split("").reverse().join("");
        expect(() => decryptApiKey(parts.join(":"))).toThrow();
    });
});
