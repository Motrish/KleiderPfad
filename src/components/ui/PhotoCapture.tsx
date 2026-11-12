"use client";

import { useState, useRef, useCallback, useEffect, ChangeEvent } from "react";
import { Camera, RotateCcw, X, Image } from "lucide-react";
import { Button } from "./Button";

export interface PhotoCaptureProps {
  onCapture: (file: File) => void;
  onRemove?: () => void;
  existingPhoto?: string | null;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function PhotoCapture({
  onCapture,
  onRemove,
  existingPhoto,
  maxSizeMB = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  className = "",
  disabled = false,
}: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set srcObject on video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  }, []);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
          const url = URL.createObjectURL(file);
          setPreview(url);
          onCapture(file);
        }
        stopCamera();
      },
      "image/jpeg",
      0.85
    );
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Datei zu groß. Maximum ${maxSizeMB} MB.`);
      return;
    }

    if (!acceptedTypes.includes(file.type)) {
      alert("Nicht unterstütztes Dateiformat. Erlaubt: JPEG, PNG, WebP, HEIC.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    onCapture(file);
  };

  const handleRemove = () => {
    if (preview && !existingPhoto) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onRemove?.();
  };

  const handleRetake = () => {
    if (preview && !existingPhoto) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    startCamera();
  };

  const hasPhoto = !!preview;

  return (
    <div className={`photo-capture ${className}`}>
      {isCameraOpen && stream && (
        <div className="photo-capture-camera" role="region" aria-label="Kamera">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-black rounded-xl"
            aria-hidden="true"
          />
          <div className="flex justify-center gap-3 mt-3">
            <Button variant="secondary" onClick={stopCamera} disabled={disabled}>
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button onClick={capturePhoto} disabled={disabled}>
              <Camera className="w-4 h-4" />
              Auslösen
            </Button>
          </div>
        </div>
      )}

      {hasPhoto && !isCameraOpen && (
        <div className="photo-capture-preview relative aspect-video rounded-xl overflow-hidden bg-green-light">
          {preview && <img src={preview} alt="Vorschau" className="w-full h-full object-cover" />}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleRetake}
              disabled={disabled}
              className="retake-btn px-3 py-1.5 text-sm font-medium rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/70 transition-colors disabled:opacity-50"
              aria-label="Neu aufnehmen"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Neu
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="retake-btn px-3 py-1.5 text-sm font-medium rounded-full bg-red-600/90 text-white backdrop-blur-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              aria-label="Entfernen"
            >
              <X className="w-4 h-4 mr-1" />
              Entfernen
            </button>
          </div>
        </div>
      )}

      {!hasPhoto && !isCameraOpen && (
        <div className="photo-capture-placeholder aspect-video rounded-xl bg-green-light border-2 border-dashed border-green/30 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-green" />
          </div>
          <div>
            <p className="font-medium text-ink">Foto hinzufügen</p>
            <p className="text-sm text-ink-muted mt-1">Kamera öffnen oder Datei wählen</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="primary" onClick={startCamera} disabled={disabled}>
              <Camera className="w-4 h-4" />
              Kamera
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
              <Image className="w-4 h-4" />
              Datei
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            capture="environment"
            onChange={handleFileSelect}
            className="photo-capture-input"
            aria-label="Foto auswählen"
            disabled={disabled}
          />
          <p className="help text-xs mt-2">Max. {maxSizeMB} MB. Fotos werden verkleinert und ohne Metadaten gespeichert.</p>
        </div>
      )}

      {/* Hidden file input for non-camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        capture="environment"
        onChange={handleFileSelect}
        className="photo-capture-input"
        aria-label="Foto auswählen"
        disabled={disabled}
      />
    </div>
  );
}