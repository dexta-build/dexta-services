"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  completeUpload,
  prepareUpload,
  type PreparedUpload,
} from "@/app/admin/(studio)/media/actions";
import {
  kindForFile,
  MAX_MB,
  type MediaAssetDTO,
  type MediaKind,
} from "@/lib/media/shared";

export type UploadStatus =
  | "waiting"
  | "uploading"
  | "saving"
  | "done"
  | "error"
  | "cancelled";

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  kind: MediaKind | null;
  status: UploadStatus;
  /** 0 to 1 */
  progress: number;
  error?: string;
  asset?: MediaAssetDTO;
};

const CONCURRENCY = 3;

class UploadError extends Error {}

/** XHR so we get upload progress (fetch can't report it yet). */
function send(
  method: "POST" | "PUT",
  url: string,
  body: globalThis.FormData | globalThis.File | globalThis.Blob,
  onProgress: (p: number) => void,
  registerAbort: (abort: () => void) => void,
  headers: Record<string, string> = {},
) {
  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    const xhr = new globalThis.XMLHttpRequest();
    xhr.open(method, url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
    xhr.onerror = () => reject(new UploadError("network"));
    xhr.onabort = () => reject(new UploadError("cancelled"));
    registerAbort(() => xhr.abort());
    xhr.send(body);
  });
}

type CloudinaryResponse = {
  public_id: string;
  version: number;
  signature: string;
  secure_url: string;
  width?: number;
  height?: number;
  bytes?: number;
  error?: { message: string };
};

async function sendToCloudinary(
  upload: Extract<PreparedUpload, { storage: "CLOUDINARY" }>,
  file: globalThis.Blob,
  fileName: string,
  onProgress: (p: number) => void,
  registerAbort: (abort: () => void) => void,
) {
  const form = new globalThis.FormData();
  for (const [k, v] of Object.entries(upload.fields)) form.append(k, v);
  form.append("file", file, fileName);
  const res = await send(
    "POST",
    upload.uploadUrl,
    form,
    onProgress,
    registerAbort,
  );
  let json: CloudinaryResponse;
  try {
    json = JSON.parse(res.text);
  } catch {
    throw new UploadError("Cloudinary sent an unexpected reply.");
  }
  if (res.status >= 400 || json.error) {
    throw new UploadError(
      json.error?.message ?? `Cloudinary refused the file (${res.status}).`,
    );
  }
  return json;
}

/** Duration, size and a poster frame for a video (best effort). */
function videoInfo(file: globalThis.File) {
  return new Promise<{
    width?: number;
    height?: number;
    duration?: number;
    poster?: globalThis.Blob;
  }>((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    const done = (out: Parameters<typeof resolve>[0]) => {
      URL.revokeObjectURL(url);
      resolve(out);
    };
    const timer = window.setTimeout(() => done({}), 10000);
    video.onerror = () => {
      window.clearTimeout(timer);
      done({});
    };
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 0) / 4);
    };
    video.onseeked = () => {
      window.clearTimeout(timer);
      const base = {
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
        duration: Number.isFinite(video.duration) ? video.duration : undefined,
      };
      try {
        const scale = Math.min(1, 1280 / (video.videoWidth || 1280));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round((video.videoWidth || 1280) * scale);
        canvas.height = Math.round((video.videoHeight || 720) * scale);
        canvas
          .getContext("2d")
          ?.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => done({ ...base, poster: blob ?? undefined }),
          "image/jpeg",
          0.85,
        );
      } catch {
        done(base);
      }
    };
    video.src = url;
  });
}

function audioDuration(file: globalThis.File) {
  return new Promise<number | undefined>((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    const done = (d?: number) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    audio.onloadedmetadata = () =>
      done(Number.isFinite(audio.duration) ? audio.duration : undefined);
    audio.onerror = () => done();
    window.setTimeout(() => done(), 8000);
    audio.src = url;
  });
}

/**
 * Upload queue for the media library and pickers. Images go straight to
 * Cloudinary, other files straight to R2, three at a time, with progress
 * and cancel. Each finished file is recorded in the library.
 */
export function useMediaUpload({
  folderId,
  onUploaded,
}: {
  folderId?: string | null;
  onUploaded?: (asset: MediaAssetDTO) => void;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const files = useRef(new Map<string, globalThis.File>());
  const aborts = useRef(new Map<string, () => void>());
  const queue = useRef<string[]>([]);
  const running = useRef(0);
  const latest = useRef({ folderId, onUploaded });
  useEffect(() => {
    latest.current = { folderId, onUploaded };
  }, [folderId, onUploaded]);

  const patch = useCallback((id: string, p: Partial<UploadItem>) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  const processOne = useCallback(
    async (id: string) => {
      const file = files.current.get(id);
      if (!file) return;
      const register = (abort: () => void) => aborts.current.set(id, abort);
      try {
        patch(id, { status: "uploading", progress: 0 });
        const prep = await prepareUpload({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          bytes: file.size,
        });
        if (!prep.success) throw new UploadError(prep.message);
        const { upload } = prep;
        const onProgress = (p: number) => patch(id, { progress: p });

        let complete: Parameters<typeof completeUpload>[0];
        if (upload.storage === "CLOUDINARY") {
          const res = await sendToCloudinary(
            upload,
            file,
            file.name,
            onProgress,
            register,
          );
          complete = {
            storage: "CLOUDINARY",
            kind: upload.kind,
            fileName: file.name,
            mimeType: file.type || null,
            bytes: res.bytes ?? file.size,
            width: res.width ?? null,
            height: res.height ?? null,
            publicId: res.public_id,
            version: res.version,
            signature: res.signature,
            secureUrl: res.secure_url,
          };
        } else {
          // Read video details first (poster frame for the grid).
          let extra: {
            width?: number;
            height?: number;
            duration?: number;
            posterKey?: string;
          } = {};
          if (upload.kind === "VIDEO") {
            const info = await videoInfo(file);
            extra = {
              width: info.width,
              height: info.height,
              duration: info.duration,
            };
            if (info.poster) {
              const p = await prepareUpload({
                fileName: `${file.name}.jpg`,
                mimeType: "image/jpeg",
                bytes: info.poster.size,
                purpose: "poster",
              });
              if (p.success && p.upload.storage === "CLOUDINARY") {
                const res = await sendToCloudinary(
                  p.upload,
                  info.poster,
                  `${file.name}.jpg`,
                  () => {},
                  register,
                ).catch(() => null);
                if (res) extra.posterKey = res.public_id;
              }
            }
          } else if (upload.kind === "AUDIO") {
            extra.duration = await audioDuration(file);
          }

          const res = await send(
            "PUT",
            upload.uploadUrl,
            file,
            onProgress,
            register,
            {
              "Content-Type": file.type || "application/octet-stream",
            },
          ).catch((e) => {
            if (e instanceof UploadError && e.message === "network") {
              throw new UploadError(
                "Large-file storage refused the upload. It may not be set up to accept uploads from this site yet.",
              );
            }
            throw e;
          });
          if (res.status >= 400)
            throw new UploadError(`Storage refused the file (${res.status}).`);
          complete = {
            storage: "R2",
            kind: upload.kind,
            key: upload.key,
            fileName: file.name,
            mimeType: file.type || null,
            bytes: file.size,
            width: extra.width ? Math.round(extra.width) : null,
            height: extra.height ? Math.round(extra.height) : null,
            duration: extra.duration ?? null,
            posterKey: extra.posterKey ?? null,
          };
        }

        patch(id, { status: "saving", progress: 1 });
        const saved = await completeUpload({
          ...complete,
          folderId: latest.current.folderId ?? null,
        });
        if (!saved.success) throw new UploadError(saved.message);
        patch(id, { status: "done", asset: saved.asset });
        latest.current.onUploaded?.(saved.asset);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Upload failed.";
        if (msg === "cancelled") patch(id, { status: "cancelled" });
        else
          patch(id, {
            status: "error",
            error: msg === "network" ? "Connection lost. Try again." : msg,
          });
      } finally {
        aborts.current.delete(id);
        files.current.delete(id);
      }
    },
    [patch],
  );

  const pump = useCallback(() => {
    while (running.current < CONCURRENCY && queue.current.length) {
      const id = queue.current.shift()!;
      running.current++;
      void processOne(id).finally(() => {
        running.current--;
        pump();
      });
    }
  }, [processOne]);

  /** Queue files. Returns how many were accepted. */
  const add = useCallback(
    (list: globalThis.File[]) => {
      const fresh: UploadItem[] = [];
      for (const file of list) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const kind = kindForFile(file.name, file.type);
        const tooBig = kind && file.size > MAX_MB[kind] * 1024 * 1024;
        const item: UploadItem = {
          id,
          name: file.name,
          size: file.size,
          kind,
          progress: 0,
          status: kind && !tooBig ? "waiting" : "error",
          error: !kind
            ? "This file type isn't accepted."
            : tooBig
              ? `Over the ${MAX_MB[kind]} MB limit.`
              : undefined,
        };
        fresh.push(item);
        if (item.status === "waiting") {
          files.current.set(id, file);
          queue.current.push(id);
        }
      }
      setItems((prev) => [...fresh, ...prev]);
      pump();
      return fresh.filter((f) => f.status === "waiting").length;
    },
    [pump],
  );

  const cancel = useCallback(
    (id: string) => {
      const i = queue.current.indexOf(id);
      if (i >= 0) {
        queue.current.splice(i, 1);
        files.current.delete(id);
        patch(id, { status: "cancelled" });
      }
      aborts.current.get(id)?.();
    },
    [patch],
  );

  /** Remove finished, failed and cancelled items from the list. */
  const clearFinished = useCallback(() => {
    setItems((list) =>
      list.filter(
        (it) =>
          it.status === "waiting" ||
          it.status === "uploading" ||
          it.status === "saving",
      ),
    );
  }, []);

  const active = items.some(
    (it) =>
      it.status === "waiting" ||
      it.status === "uploading" ||
      it.status === "saving",
  );

  return { items, add, cancel, clearFinished, active };
}
