"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import React, { useState } from "react";

interface FileUploadProps {
  onSuccess: (response: any) => void;
  onProgress?: (progress: number) => void;
  fileType?: "image" | "video";
}

const FileUpload = ({
  onSuccess,
  onProgress,
  fileType = "image",
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const validateFile = (file: File) => {
    if (fileType === "video" && !file.type.startsWith("video/")) {
      setError("Please upload a valid video file (.mp4, .webm, .mov, etc.).");
      return false;
    }

    if (fileType === "image" && !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (.jpg, .png, .webp, etc.).");
      return false;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File size exceeds the limit of 100MB.");
      return false;
    }

    return true;
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) return;

    setUploading(true);
    setError(null);
    setProgress(0);
    setUploadedFileName(null);

    const abortController = new AbortController();

    try {
      // 1. Fetch authentication parameters from our server route
      const authResponse = await fetch("/api/imagekit-auth");
      const authData = await authResponse.json();

      if (!authResponse.ok || !authData.signature) {
        throw new Error(
          authData.error ||
            "ImageKit authentication failed. Check your API keys in .env.local"
        );
      }

      const publicKey =
        authData.publicKey ||
        process.env.NEXT_PUBLIC_PUBLIC_KEY ||
        process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error(
          "Public key is missing. Please set NEXT_PUBLIC_PUBLIC_KEY in .env.local and restart dev server."
        );
      }

      // 2. Perform direct upload to ImageKit
      const response = await upload({
        file,
        fileName: file.name,
        publicKey,
        signature: authData.signature,
        expire: authData.expire,
        token: authData.token,
        abortSignal: abortController.signal,
        onProgress: (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setProgress(percent);
            if (onProgress) {
              onProgress(percent);
            }
          }
        },
      });

      setUploadedFileName(file.name);
      onSuccess(response);
    } catch (err: any) {
      console.error("ImageKit upload error:", err);
      let errorMsg = "Upload failed.";
      if (err instanceof ImageKitAbortError) {
        errorMsg = "Upload was aborted.";
      } else if (err instanceof ImageKitInvalidRequestError) {
        errorMsg = err.message || "Invalid upload request parameters.";
      } else if (err instanceof ImageKitUploadNetworkError) {
        errorMsg = "Network error: unable to reach ImageKit. Check internet connection and CORS settings.";
      } else if (err instanceof ImageKitServerError) {
        errorMsg = err.message || "ImageKit server error.";
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="relative">
        <input
          type="file"
          id={`file-input-${fileType}`}
          accept={fileType === "video" ? "video/*" : "image/*"}
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer disabled:opacity-50"
        />
      </div>

      {/* Uploading progress indicator */}
      {uploading && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-zinc-300 text-[11px]">
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin w-3 h-3 text-[#E50914]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Uploading {fileType}...
            </span>
            <span className="font-mono text-zinc-400">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E50914] transition-all duration-200 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success banner */}
      {uploadedFileName && !uploading && (
        <div className="p-2 bg-emerald-950/60 border border-emerald-700/60 rounded text-emerald-300 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="truncate">
            Uploaded: <strong className="text-white">{uploadedFileName}</strong>
          </span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-2.5 bg-red-950/70 border border-red-700/80 rounded text-red-300 space-y-1">
          <div className="flex items-start gap-1.5 font-semibold text-red-200">
            <svg className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;