/**
 * Object storage: S3-compatible when S3_ENDPOINT is configured
 * (MinIO locally, R2/S3 at deploy), otherwise a local filesystem
 * store under STORAGE_DIR (dev default). Signed URLs expire <= 1h.
 */
import { createHash, createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface StorageAdapter {
  put(key: string, body: Buffer | string, contentType?: string): Promise<{ key: string; checksum: string }>;
  get(key: string): Promise<Buffer>;
  signedUrl(key: string, ttlSec?: number): Promise<string>;
  presignedPutUrl(key: string, contentType: string, ttlSec?: number): Promise<string>;
}

const checksumOf = (body: Buffer | string) =>
  createHash("sha256").update(body).digest("hex");

export class LocalStorage implements StorageAdapter {
  constructor(private root: string) {}
  private full(key: string) {
    return path.join(this.root, key.replace(/\.\.+/g, "_"));
  }
  async put(key: string, body: Buffer | string) {
    const buf = typeof body === "string" ? Buffer.from(body) : body;
    await mkdir(path.dirname(this.full(key)), { recursive: true });
    await writeFile(this.full(key), buf);
    return { key, checksum: checksumOf(buf) };
  }
  async get(key: string) {
    return readFile(this.full(key));
  }
  async signedUrl(key: string, ttlSec = 3600) {
    const exp = Math.floor(Date.now() / 1000) + Math.min(ttlSec, 3600);
    const sig = createHmac("sha256", process.env.AUTH_JWT_SECRET ?? "dev")
      .update(`${key}:${exp}`)
      .digest("hex")
      .slice(0, 32);
    return `/files/${encodeURIComponent(key)}?exp=${exp}&sig=${sig}`;
  }
  async presignedPutUrl(key: string) {
    return this.signedUrl(key);
  }
  verifySigned(key: string, exp: number, sig: string): boolean {
    if (exp < Math.floor(Date.now() / 1000)) return false;
    const expected = createHmac("sha256", process.env.AUTH_JWT_SECRET ?? "dev")
      .update(`${key}:${exp}`)
      .digest("hex")
      .slice(0, 32);
    return expected === sig;
  }
}

export class S3Storage implements StorageAdapter {
  private clientPromise: Promise<{
    s3: InstanceType<typeof import("@aws-sdk/client-s3").S3Client>;
    bucket: string;
  }> | undefined;
  private async client() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { S3Client } = await import("@aws-sdk/client-s3");
        const s3 = new S3Client({
          endpoint: process.env.S3_ENDPOINT,
          region: process.env.S3_REGION ?? "us-east-1",
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY ?? "",
            secretAccessKey: process.env.S3_SECRET_KEY ?? "",
          },
        });
        return { s3, bucket: process.env.S3_BUCKET ?? "scriptwriter" };
      })();
    }
    return this.clientPromise;
  }
  async put(key: string, body: Buffer | string, contentType?: string) {
    const { s3, bucket } = await this.client();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const buf = typeof body === "string" ? Buffer.from(body) : body;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: contentType }));
    return { key, checksum: checksumOf(buf) };
  }
  async get(key: string) {
    const { s3, bucket } = await this.client();
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }
  async signedUrl(key: string, ttlSec = 3600) {
    const { s3, bucket } = await this.client();
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
      expiresIn: Math.min(ttlSec, 3600),
    });
  }
  async presignedPutUrl(key: string, contentType: string, ttlSec = 3600) {
    const { s3, bucket } = await this.client();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    return getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
      { expiresIn: Math.min(ttlSec, 3600) },
    );
  }
}

export function createStorage(): StorageAdapter {
  if (process.env.S3_ENDPOINT) return new S3Storage();
  return new LocalStorage(process.env.STORAGE_DIR ?? path.resolve(process.cwd(), ".storage"));
}
