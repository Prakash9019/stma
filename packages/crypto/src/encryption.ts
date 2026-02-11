import * as crypto from "node:crypto";
const ALGO = "aes-256-gcm";

function toHex(buf: Buffer) {
  return buf.toString("hex");
}

function fromHex(hex: string) {
  return Buffer.from(hex, "hex");
}

function assertHexSize(hex: string, bytes: number) {
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("Invalid hex encoding");
  }

  const buf = Buffer.from(hex, "hex");

  if (buf.length !== bytes) {
    throw new Error(`Invalid length: expected ${bytes} bytes`);
  }
}




export function encryptEnvelope(payload: object) {

  // 1. Generate Data Encryption Key (DEK)
  const dek = crypto.randomBytes(32); // 256-bit

  // 2. Encrypt payload with DEK
  const payloadNonce = crypto.randomBytes(12); // required for GCM

  const payloadCipher = crypto.createCipheriv(
    ALGO,
    dek,
    payloadNonce
  );

  const payloadCiphertext = Buffer.concat([
    payloadCipher.update(JSON.stringify(payload)),
    payloadCipher.final()
  ]);

  const payloadTag = payloadCipher.getAuthTag();

  // 3. Encrypt (wrap) DEK using Master Key
  const masterKey = fromHex(process.env.MASTER_KEY!);

  const wrapNonce = crypto.randomBytes(12);

  const wrapCipher = crypto.createCipheriv(
    ALGO,
    masterKey,
    wrapNonce
  );

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


export function decryptEnvelope(record: any) {

  assertHexSize(record.payload_nonce, 12);
  assertHexSize(record.payload_tag, 16);
  assertHexSize(record.dek_wrap_nonce, 12);
  assertHexSize(record.dek_wrap_tag, 16);

  const masterKey = Buffer.from(process.env.MASTER_KEY!, "hex");

  const unwrapCipher = crypto.createDecipheriv(
    ALGO,
    masterKey,
    Buffer.from(record.dek_wrap_nonce, "hex")
  );

  unwrapCipher.setAuthTag(Buffer.from(record.dek_wrap_tag, "hex"));

  const dek = Buffer.concat([
    unwrapCipher.update(Buffer.from(record.dek_wrapped, "hex")),
    unwrapCipher.final()
  ]);

  const payloadDecipher = crypto.createDecipheriv(
    ALGO,
    dek,
    Buffer.from(record.payload_nonce, "hex")
  );

  payloadDecipher.setAuthTag(Buffer.from(record.payload_tag, "hex"));

  const plaintext = Buffer.concat([
    payloadDecipher.update(Buffer.from(record.payload_ct, "hex")),
    payloadDecipher.final()
  ]);

  return JSON.parse(plaintext.toString());
}

