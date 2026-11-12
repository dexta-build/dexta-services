import "server-only";
import { Buffer } from "node:buffer";
import { createHash, createHmac, randomUUID } from "node:crypto";

/**
 * Cloudflare R2 (S3-compatible) for large files. Browsers upload straight
 * to R2 with a short-lived presigned URL, so big videos never pass through
 * our server. The bucket needs a CORS rule allowing PUT from the site.
 */

const REGION = "auto";
const SERVICE = "s3";

export function r2Config() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL?.trim();
  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !publicBaseUrl
  ) {
    throw new Error(
      "R2 storage isn't set up (missing CLOUDFLARE_R2_* settings).",
    );
  }
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    host: `${accountId}.r2.cloudflarestorage.com`,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
  };
}

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
const hmac = (key: Buffer | string, v: string) =>
  createHmac("sha256", key).update(v).digest();

/** RFC 3986 encoding, as SigV4 expects. */
function enc(v: string) {
  return encodeURIComponent(v).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodeKey(key: string) {
  return key.split("/").map(enc).join("/");
}

function stamps(date = new Date()) {
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate, dateStamp: amzDate.slice(0, 8) };
}

function signingKey(secret: string, dateStamp: string) {
  return hmac(
    hmac(hmac(hmac(`AWS4${secret}`, dateStamp), REGION), SERVICE),
    "aws4_request",
  );
}

export function publicUrlFor(key: string) {
  return `${r2Config().publicBaseUrl}/${encodeKey(key)}`;
}

/** A tidy, unique object key: media/2026/11/<uuid>-<name>.<ext> */
export function newObjectKey(fileName: string) {
  const ext =
    fileName.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() ?? "bin";
  const base =
    fileName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `media/${now.getUTCFullYear()}/${month}/${randomUUID()}-${base}.${ext}`;
}

/** A URL the browser can PUT one file to, valid for `expiresIn` seconds. */
export function presignPut(key: string, expiresIn = 15 * 60) {
  const c = r2Config();
  const { amzDate, dateStamp } = stamps();
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const path = `/${enc(c.bucket)}/${encodeKey(key)}`;
  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${c.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresIn),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${enc(k)}=${enc(query[k])}`)
    .join("&");
  const canonicalRequest = [
    "PUT",
    path,
    canonicalQuery,
    `host:${c.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(c.secretAccessKey, dateStamp),
  )
    .update(stringToSign)
    .digest("hex");
  return `https://${c.host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

/** A signed server-side request (HEAD, DELETE, GET). */
async function signedFetch(
  method: "HEAD" | "DELETE" | "GET",
  key: string,
  search = "",
) {
  const c = r2Config();
  const { amzDate, dateStamp } = stamps();
  const scope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const path = key
    ? `/${enc(c.bucket)}/${encodeKey(key)}`
    : `/${enc(c.bucket)}`;
  const payloadHash = sha256("");
  const canonicalHeaders = `host:${c.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    path,
    search,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256(canonicalRequest),
  ].join("\n");
  const signature = createHmac(
    "sha256",
    signingKey(c.secretAccessKey, dateStamp),
  )
    .update(stringToSign)
    .digest("hex");
  return fetch(`https://${c.host}${path}${search ? `?${search}` : ""}`, {
    method,
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${c.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate,
    },
    cache: "no-store",
  });
}

/** Size and type of an uploaded object, or null if it isn't there. */
export async function headObject(key: string) {
  const res = await signedFetch("HEAD", key);
  if (!res.ok) return null;
  return {
    bytes: Number(res.headers.get("content-length") ?? 0) || null,
    contentType: res.headers.get("content-type"),
  };
}

export async function deleteObject(key: string) {
  const res = await signedFetch("DELETE", key);
  // 204 on success; 404 means it's already gone.
  return res.ok || res.status === 404;
}

/**
 * The bucket's CORS rules. `readable` is false when the access key isn't
 * allowed to read bucket settings (common for object-only tokens).
 */
export async function getBucketCors() {
  const res = await signedFetch("GET", "", "cors=");
  if (res.status === 403) return { readable: false as const, xml: null };
  if (!res.ok) return { readable: true as const, xml: null };
  return { readable: true as const, xml: await res.text() };
}
