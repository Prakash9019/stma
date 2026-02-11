"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptEnvelope = encryptEnvelope;
exports.decryptEnvelope = decryptEnvelope;
const crypto = __importStar(require("node:crypto"));
const ALGO = "aes-256-gcm";
function toHex(buf) {
    return buf.toString("hex");
}
function fromHex(hex) {
    return Buffer.from(hex, "hex");
}
function assertHexSize(hex, bytes) {
    if (!/^[0-9a-fA-F]+$/.test(hex)) {
        throw new Error("Invalid hex encoding");
    }
    const buf = Buffer.from(hex, "hex");
    if (buf.length !== bytes) {
        throw new Error(`Invalid length: expected ${bytes} bytes`);
    }
}
function encryptEnvelope(payload) {
    // 1. Generate Data Encryption Key (DEK)
    const dek = crypto.randomBytes(32); // 256-bit
    // 2. Encrypt payload with DEK
    const payloadNonce = crypto.randomBytes(12); // required for GCM
    const payloadCipher = crypto.createCipheriv(ALGO, dek, payloadNonce);
    const payloadCiphertext = Buffer.concat([
        payloadCipher.update(JSON.stringify(payload)),
        payloadCipher.final()
    ]);
    const payloadTag = payloadCipher.getAuthTag();
    // 3. Encrypt (wrap) DEK using Master Key
    const masterKey = fromHex(process.env.MASTER_KEY);
    const wrapNonce = crypto.randomBytes(12);
    const wrapCipher = crypto.createCipheriv(ALGO, masterKey, wrapNonce);
    const wrappedDek = Buffer.concat([
        wrapCipher.update(dek),
        wrapCipher.final()
    ]);
    const wrapTag = wrapCipher.getAuthTag();
    // 4. Return everything in hex
    return {
        payload_nonce: toHex(payloadNonce),
        payload_ct: toHex(payloadCiphertext),
        payload_tag: toHex(payloadTag),
        dek_wrap_nonce: toHex(wrapNonce),
        dek_wrapped: toHex(wrappedDek),
        dek_wrap_tag: toHex(wrapTag),
        alg: "AES-256-GCM",
        mk_version: 1
    };
}
function decryptEnvelope(record) {
    assertHexSize(record.payload_nonce, 12);
    assertHexSize(record.payload_tag, 16);
    assertHexSize(record.dek_wrap_nonce, 12);
    assertHexSize(record.dek_wrap_tag, 16);
    const masterKey = Buffer.from(process.env.MASTER_KEY, "hex");
    const unwrapCipher = crypto.createDecipheriv(ALGO, masterKey, Buffer.from(record.dek_wrap_nonce, "hex"));
    unwrapCipher.setAuthTag(Buffer.from(record.dek_wrap_tag, "hex"));
    const dek = Buffer.concat([
        unwrapCipher.update(Buffer.from(record.dek_wrapped, "hex")),
        unwrapCipher.final()
    ]);
    const payloadDecipher = crypto.createDecipheriv(ALGO, dek, Buffer.from(record.payload_nonce, "hex"));
    payloadDecipher.setAuthTag(Buffer.from(record.payload_tag, "hex"));
    const plaintext = Buffer.concat([
        payloadDecipher.update(Buffer.from(record.payload_ct, "hex")),
        payloadDecipher.final()
    ]);
    return JSON.parse(plaintext.toString());
}
