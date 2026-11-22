// Preconfigured storage helpers for Manus WebDev templates
// Uses the Biz-provided storage proxy or local filesystem fallback

import { ENV } from "./_core/env";
import path from "path";
import fs from "fs";

type StorageConfig = { baseUrl: string; apiKey: string };

function hasForgeConfig(): boolean {
  return Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
}

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(baseUrl: string, relKey: string, apiKey: string): Promise<string> {
  const downloadApiUrl = new URL("v1/storage/downloadUrl", ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string,
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  // If Forge proxy is configured, use it
  if (hasForgeConfig()) {
    try {
      const { baseUrl, apiKey } = getStorageConfig();
      const uploadUrl = buildUploadUrl(baseUrl, key);
      const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: buildAuthHeaders(apiKey),
        body: formData,
      });

      if (response.ok) {
        const url = (await response.json()).url;
        return { key, url };
      }
    } catch (err) {
      console.warn("[Storage] Cloud upload failed, falling back to local storage:", err);
    }
  }

  // Local filesystem fallback
  try {
    const uploadDir = path.resolve(process.cwd(), "uploads");
    const filePath = path.resolve(uploadDir, key);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const buffer = Buffer.isBuffer(data)
      ? data
      : typeof data === "string"
      ? Buffer.from(data, "base64")
      : Buffer.from(data);

    fs.writeFileSync(filePath, buffer);
    const url = `/uploads/${key}`;
    return { key, url };
  } catch (error) {
    console.error("[Storage] Local file save failed:", error);
    throw new Error(`Failed to save file locally: ${String(error)}`);
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  if (hasForgeConfig()) {
    try {
      const { baseUrl, apiKey } = getStorageConfig();
      return {
        key,
        url: await buildDownloadUrl(baseUrl, key, apiKey),
      };
    } catch (err) {
      console.warn("[Storage] Cloud get failed, falling back to local storage:", err);
    }
  }

  return {
    key,
    url: `/uploads/${key}`,
  };
}
