"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { useState } from "react";

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

  const validateFile = (file: File) => {
    if (fileType === "video" && !file.type.startsWith("video/")) {
      setError("Please upload a valid video file.");
      return false;
    }

    if (fileType === "image" && !file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
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

    if (!file || !validateFile(file)) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    const abortController = new AbortController();

    try {
      const authResponse = await fetch("/api/auth/imagekit-auth");
      const authData = await authResponse.json();

      const response = await upload({
        file,
        fileName: file.name,
        publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
        signature: authData.signature,
        expire: authData.expire,
        token: authData.token,
        abortSignal: abortController.signal,
        onProgress: (event) => {
          if (event.lengthComputable) {
            const percent = Math.round(
              (event.loaded / event.total) * 100
            );

            setProgress(percent);

            if (onProgress) {
              onProgress(percent);
            }
          }
        },
      });

      onSuccess(response);
    } catch (err) {
      if (err instanceof ImageKitAbortError) {
        setError("Upload aborted.");
      } else if (err instanceof ImageKitInvalidRequestError) {
        setError(err.message);
      } else if (err instanceof ImageKitUploadNetworkError) {
        setError("Network error while uploading.");
      } else if (err instanceof ImageKitServerError) {
        setError("ImageKit server error.");
      } else {
        setError("Upload failed.");
      }

      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        accept={fileType === "video" ? "video/*" : "image/*"}
        onChange={handleFileChange}
        disabled={uploading}
      />

      {uploading && <p>Uploading...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <progress value={progress} max={100} />
      <p>{progress}%</p>
    </>
  );
};

export default FileUpload;