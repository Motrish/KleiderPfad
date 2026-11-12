"use client";

import { useState, useRef, useCallback, useEffect, ChangeEvent } from "react";
import { Camera, RotateCcw, X, Image } from "lucide-react";
import { Button } from "./Button";

export interface PhotoCaptureProps {
  name: string;
  onCapture?: (file: File) => void;
  onRemove?: () => void;
  existingPhoto?: string | null;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PhotoCapture({
  name,
  onCapture,
  onRemove,
  existingPhoto,
  maxSizeMB = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
  className = "",
  disabled = false,
  required = false,
}: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Set srcObject on video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Update hidden input when preview changes
  const updateHiddenInput = useCallback((file: File | null) => {
    if (hiddenInputRef.current) {
      if (file) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        hiddenInputRef.current.files = dataTransfer.files;
      } else {
        hiddenInputRef.current.value = "";
      }
    }
  }, []);

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
          updateHiddenInput(file);
          onCapture?.(file);
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
      e.target.value = "";
      return;
    }

    if (!acceptedTypes.includes(file.type)) {
      alert("Nicht unterstütztes Dateiformat. Erlaubt: JPEG, PNG, WebP, HEIC.");
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    updateHiddenInput(file);
    onCapture?.(file);
  };

  const handleRemove = () => {
    if (preview && !existingPhoto) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    updateHiddenInput(null);
    onRemove?.();
  };

  const handleRetake = () => {
    if (preview && !existingPhoto) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    updateHiddenInput(null);
    startCamera();
  };

  const hasPhoto = !!preview;

  return (
    <div className={`photo-capture ${className}`}>
      {/* Hidden file input for form submission */}
      <input
        ref={hiddenInputRef}
        type="file"
        name={name}
        accept={acceptedTypes.join(",")}
        capture="environment"
        className="photo-capture-input"
        aria-hidden="true"
        disabled={disabled}
        required={required}
      />

      {isCameraOpen && stream && (
        <div className="photo-capture-camera" role="region" aria-label="Kamera">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-black rounded-xl"
            aria-hidden="true"
          />
          <div className="photo-capture-actions">
            <Button variant="secondary" onClick={stopCamera} disabled={disabled} className="wide">
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button onClick={capturePhoto} disabled={disabled} className="wide">
              <Camera className="w-4 h-4" />
              Auslösen
            </Button>
          </div>
        </div>
      )}

      {hasPhoto && !isCameraOpen && (
        <div className="photo-capture-preview relative aspect-video rounded-xl overflow-hidden bg-green-light">
          {preview && <img src={preview} alt="Vorschau" className="w-full h-full object-cover" />}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={handleRetake}
              disabled={disabled}
              className="retake-btn px-3 py-2 text-sm font-medium rounded-full bg-black/70 text-white backdrop-blur-sm hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
              aria-label="Neu aufnehmen"
            >
              <RotateCcw className="w-4 h-4" />
              Neu
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="retake-btn px-3 py-2 text-sm font-medium rounded-full bg-red-600/90 text-white backdrop-blur-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
              aria-label="Entfernen"
            >
              <X className="w-4 h-4" />
              Entfernen
            </button>
          </div>
        </div>
      )}

      {!hasPhoto && !isCameraOpen && (
        <div className="photo-capture-placeholder aspect-video rounded-xl bg-green-light border-2 border-dashed border-green/30 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green/10 flex items-center justify-center">
            <Camera className="w-10 h-10 text-green" />
          </div>
          <div>
            <p className="font-medium text-ink text-lg">Foto hinzufügen</p>
            <p className="text-sm text-ink-muted mt-1">Kamera öffnen oder Datei wählen</p>
          </div>
          <div className="flex gap-3 mt-2 flex-wrap justify-center">
            <Button variant="primary" onClick={startCamera} disabled={disabled} className="wide sm:w-auto min-h-[52px] text-lg">
              <Camera className="w-5 h-5" />
              Kamera öffnen
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={disabled} className="wide sm:w-auto min-h-[52px] text-lg">
              <Image className="w-5 h-5" />
              Aus Galerie
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
    </div>
  );
}