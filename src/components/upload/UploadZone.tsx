"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_FORMATS } from "@/lib/types";

interface UploadResult {
  fileName: string;
  success: boolean;
  error?: string;
  documentId?: string;
}

interface UploadConfig {
  provider: string;
  clientUpload: boolean;
}

async function registerUpload(fileRef: string, fileName: string, fileSize: number) {
  const res = await fetch("/api/upload/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileRef, fileName, fileSize }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Registration failed");
  return data;
}

async function uploadToBlob(file: File): Promise<string> {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload/handlers",
  });
  return blob.url;
}

async function uploadToS3(file: File): Promise<string> {
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
  });
  const presignData = await presignRes.json();
  if (!presignRes.ok) throw new Error(presignData.error ?? "Presign failed");

  const putRes = await fetch(presignData.uploadUrl, {
    method: "PUT",
    body: file,
  });
  if (!putRes.ok) throw new Error("S3 upload failed");

  return presignData.publicUrl as string;
}

export function UploadZone() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [config, setConfig] = useState<UploadConfig | null>(null);

  useEffect(() => {
    fetch("/api/upload/config")
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => setConfig({ provider: "local", clientUpload: false }));
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      setResults([]);

      const fileArray = Array.from(files);
      const newResults: UploadResult[] = [];
      const useClient = config?.clientUpload ?? false;
      const provider = config?.provider ?? "local";

      for (const file of fileArray) {
        try {
          let document;

          if (useClient && provider === "blob") {
            const fileRef = await uploadToBlob(file);
            document = await registerUpload(fileRef, file.name, file.size);
          } else if (useClient && provider === "s3") {
            const fileRef = await uploadToS3(file);
            document = await registerUpload(fileRef, file.name, file.size);
          } else {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            document = await res.json();
            if (!res.ok) throw new Error(document.error ?? "Upload failed");
          }

          newResults.push({
            fileName: file.name,
            success: true,
            documentId: document.id,
          });
        } catch (err) {
          newResults.push({
            fileName: file.name,
            success: false,
            error: err instanceof Error ? err.message : "Upload failed",
          });
        }
      }

      setResults(newResults);
      setUploading(false);

      const successCount = newResults.filter((r) => r.success).length;
      if (successCount === 1 && fileArray.length === 1) {
        const doc = newResults.find((r) => r.success);
        if (doc?.documentId) {
          router.push(`/reader/${doc.documentId}`);
        }
      } else if (successCount > 0) {
        router.push("/dashboard");
      }
    },
    [config, router]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging
            ? "border-accent bg-accent/5"
            : "border-gray-700 bg-surface-raised hover:border-gray-600"
        }`}
      >
        <input
          type="file"
          multiple
          accept={SUPPORTED_FORMATS.join(",")}
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploading || !config}
        />

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          {uploading || !config ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          ) : (
            <Upload className="h-8 w-8 text-accent" />
          )}
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          {!config
            ? "Loading..."
            : uploading
              ? "Uploading..."
              : "Drop files here or click to browse"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          EPUB and PDF supported · Max 100MB per file
        </p>
        {config?.clientUpload && (
          <p className="mt-1 text-xs text-muted-foreground">
            Cloud upload via {config.provider.toUpperCase()}
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          {results.map((result) => (
            <div
              key={result.fileName}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                result.success
                  ? "border-emerald-800/50 bg-emerald-900/10"
                  : "border-rose-800/50 bg-rose-900/10"
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{result.fileName}</p>
                {result.error && (
                  <p className="text-xs text-rose-400">{result.error}</p>
                )}
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          Back to library
        </Button>
      </div>
    </div>
  );
}
